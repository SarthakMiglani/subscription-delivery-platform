package com.juiceplatform.service;

import com.juiceplatform.dto.delivery.OrderCorrectionRequest;
import com.juiceplatform.dto.delivery.OrderCorrectionResponse;
import com.juiceplatform.entity.DeliveryRecord;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.WalletLedger;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.DeliveryRecordRepository;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.ProductRepository;
import com.juiceplatform.repository.WalletLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

/**
 * Handles historical order corrections.
 *
 * Allowed transitions:
 *   DELIVERED → SKIPPED  (with optional auto-refund if isSystemError=true)
 *   SKIPPED   → DELIVERED (auto DEBIT, negative balance permitted)
 *   LOCKED    → CANCELLED (delivery_record retained, status→CANCELLED)
 *
 * All other transitions → 409 INVALID_STATUS_TRANSITION.
 * Wallet ledger is append-only — corrections insert new entries, never modify existing ones.
 */
@Service
@RequiredArgsConstructor
public class OrderCorrectionService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final OrderRepository orderRepository;
    private final DeliveryRecordRepository deliveryRecordRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public OrderCorrectionResponse correctOrder(UUID orderId, OrderCorrectionRequest request, UUID adminId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Order not found: " + orderId, HttpStatus.NOT_FOUND));

        Order.OrderStatus currentStatus = order.getStatus();

        boolean hasQuantityOrProductEdit = request.getQuantity() != null || request.getProductId() != null;
        boolean hasStatusTransition = request.getStatus() != null && !request.getStatus().isBlank();

        OffsetDateTime now = OffsetDateTime.now(IST);
        boolean autoRefundIssued = false;
        boolean pricingRecalculated = false;

        java.util.Map<String, Object> before = new java.util.HashMap<>();
        before.put("status", currentStatus.name());
        before.put("quantity", order.getQuantity());
        before.put("unitPricePaise", order.getUnitPricePaise());
        before.put("totalAmountPaise", order.getTotalAmountPaise());

        if (hasStatusTransition) {
            Order.OrderStatus newStatus;
            try {
                newStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_STATUS_TRANSITION",
                        "Invalid target status: " + request.getStatus(), HttpStatus.CONFLICT);
            }

            // Route to the correct correction handler based on transition
            if (currentStatus == Order.OrderStatus.DELIVERED && newStatus == Order.OrderStatus.SKIPPED) {
                autoRefundIssued = handleDeliveredToSkipped(order, request, adminId, now);

            } else if (currentStatus == Order.OrderStatus.SKIPPED && newStatus == Order.OrderStatus.DELIVERED) {
                handleSkippedToDelivered(order, adminId, now);

            } else if (currentStatus == Order.OrderStatus.LOCKED && newStatus == Order.OrderStatus.CANCELLED) {
                handleLockedToCancelled(order, request, adminId, now);

            } else if (currentStatus == newStatus && currentStatus == Order.OrderStatus.LOCKED
                    && hasQuantityOrProductEdit) {
                // status explicitly re-sent as the current (LOCKED) status alongside a
                // quantity/product edit — treated purely as a data correction below.

            } else {
                throw new BusinessException("INVALID_STATUS_TRANSITION",
                        "Transition from " + currentStatus + " to " + newStatus + " is not allowed",
                        HttpStatus.CONFLICT);
            }
        }

        // BR-HIS-05: quantity/product data correction. Only permitted on LOCKED orders
        // before delivery completion, and only when no status transition away from
        // LOCKED was requested in the same call (a DELIVERED/SKIPPED/CANCELLED
        // transition already finalizes the order — pricing is not touched afterward).
        if (hasQuantityOrProductEdit) {
            if (order.getStatus() != Order.OrderStatus.LOCKED) {
                throw new BusinessException("ORDER_NOT_CORRECTABLE",
                        "Quantity/product corrections are only allowed on LOCKED orders",
                        HttpStatus.CONFLICT);
            }
            pricingRecalculated = applyQuantityOrProductCorrection(order, request);
        }

        orderRepository.save(order);

        // Audit log
        java.util.Map<String, Object> after = new java.util.HashMap<>();
        after.put("status", order.getStatus().name());
        after.put("quantity", order.getQuantity());
        after.put("unitPricePaise", order.getUnitPricePaise());
        after.put("totalAmountPaise", order.getTotalAmountPaise());
        after.put("autoRefundIssued", autoRefundIssued);
        after.put("pricingRecalculated", pricingRecalculated);

        auditLogService.log("HISTORICAL_ORDER_EDIT", "order", orderId.toString(),
                before, after, adminId, request.getNotes());

        return OrderCorrectionResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .autoRefundIssued(autoRefundIssued)
                .updatedAt(now)
                .build();
    }

    /**
     * BR-HIS-05: applies an admin quantity and/or product correction to a LOCKED order
     * and recalculates unitPricePaise/totalAmountPaise.
     * <p>
     * - Quantity-only edit: reuses the existing historical unitPricePaise already
     *   stored on the order (no product price lookup).
     * - Product change: unitPricePaise is taken from the new product's CURRENT price
     *   at the time of the override.
     *
     * @return true if any pricing field was actually recalculated
     */
    private boolean applyQuantityOrProductCorrection(Order order, OrderCorrectionRequest request) {
        boolean changed = false;

        if (request.getProductId() != null && !request.getProductId().equals(order.getProductId())) {
            Product newProduct = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new BusinessException("PRODUCT_UNAVAILABLE",
                            "Product not found: " + request.getProductId(), HttpStatus.BAD_REQUEST));

            order.setProductId(newProduct.getId());
            order.setUnitPricePaise(newProduct.getPricePerUnitPaise());
            changed = true;
        }

        if (request.getQuantity() != null && !request.getQuantity().equals(order.getQuantity())) {
            order.setQuantity(request.getQuantity());
            changed = true;
        }

        if (changed) {
            order.setTotalAmountPaise(order.getUnitPricePaise() * order.getQuantity());
        }

        return changed;
    }

    /**
     * DELIVERED → SKIPPED
     * If isSystemError=true: insert REFUND ledger entry (source_type=HISTORICAL_CORRECTION).
     * If isSystemError=false: no automatic ledger entry.
     */
    private boolean handleDeliveredToSkipped(Order order, OrderCorrectionRequest request,
                                              UUID adminId, OffsetDateTime now) {
        // skipReason is required when new status is SKIPPED
        Order.SkipReason skipReason = parseSkipReason(request.getSkipReason());

        order.setStatus(Order.OrderStatus.SKIPPED);
        order.setSkipReason(skipReason);
        orderRepository.save(order);

        DeliveryRecord record = requireDeliveryRecord(order.getId());
        record.setStatus(DeliveryRecord.DeliveryRecordStatus.SKIPPED);
        record.setSkipReason(skipReason);
        record.setDeliveredAt(null);
        deliveryRecordRepository.save(record);

        boolean isSystemError = Boolean.TRUE.equals(request.getIsSystemError());
        if (isSystemError) {
            // Auto-refund: reverse the original wallet deduction
            // Acquire pessimistic write lock before reading balance
            long currentBalance = walletLedgerRepository.findTopByCustomerIdForUpdate(order.getCustomerId())
                    .map(WalletLedger::getRunningBalancePaise)
                    .orElse(0L);
            long newBalance = currentBalance + order.getTotalAmountPaise();

            WalletLedger refundEntry = new WalletLedger();
            refundEntry.setCustomerId(order.getCustomerId());
            refundEntry.setOrderId(order.getId());
            refundEntry.setEntryType(WalletLedger.EntryType.REFUND);
            refundEntry.setSourceType(WalletLedger.SourceType.HISTORICAL_CORRECTION);
            refundEntry.setAmountPaise(order.getTotalAmountPaise());
            refundEntry.setRunningBalancePaise(newBalance);
            refundEntry.setDescription("Refund for system error correction on " + order.getDeliveryDate());
            refundEntry.setCreatedByUserId(adminId);
            walletLedgerRepository.save(refundEntry);

            return true;
        }

        return false;
    }

    /**
     * SKIPPED → DELIVERED
     * Treated as standard delivery confirmation — insert DEBIT ledger entry.
     * Negative balance is permitted for historical corrections.
     */
    private void handleSkippedToDelivered(Order order, UUID adminId, OffsetDateTime now) {
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setSkipReason(null);
        orderRepository.save(order);

        DeliveryRecord record = requireDeliveryRecord(order.getId());
        record.setStatus(DeliveryRecord.DeliveryRecordStatus.DELIVERED);
        record.setSkipReason(null);
        record.setDeliveredAt(now);
        deliveryRecordRepository.save(record);

        // Insert DEBIT — negative balance permitted (no balance check)
        // Acquire pessimistic write lock before reading balance
        long currentBalance = walletLedgerRepository.findTopByCustomerIdForUpdate(order.getCustomerId())
                .map(WalletLedger::getRunningBalancePaise)
                .orElse(0L);
        long newBalance = currentBalance - order.getTotalAmountPaise();

        WalletLedger debitEntry = new WalletLedger();
        debitEntry.setCustomerId(order.getCustomerId());
        debitEntry.setOrderId(order.getId());
        debitEntry.setEntryType(WalletLedger.EntryType.DEBIT);
        debitEntry.setSourceType(WalletLedger.SourceType.HISTORICAL_CORRECTION_DEBIT);
        debitEntry.setAmountPaise(order.getTotalAmountPaise());
        debitEntry.setRunningBalancePaise(newBalance);
        debitEntry.setDescription("Historical correction delivery on " + order.getDeliveryDate());
        debitEntry.setCreatedByUserId(adminId);
        walletLedgerRepository.save(debitEntry);
    }

    /**
     * LOCKED → CANCELLED
     * delivery_record is retained and transitions to CANCELLED.
     * No wallet ledger entry — order was never delivered.
     */
    private void handleLockedToCancelled(Order order, OrderCorrectionRequest request,
                                          UUID adminId, OffsetDateTime now) {
        order.setStatus(Order.OrderStatus.CANCELLED);

        // cancellationComment is only valid when new status is CANCELLED
        if (request.getCancellationComment() != null && !request.getCancellationComment().isBlank()) {
            order.setCancellationComment(request.getCancellationComment());
            order.setCancellationCommentedAt(now);
            order.setCancellationCommentedBy(adminId);
        }
        orderRepository.save(order);

        // Retain delivery_record, transition to CANCELLED
        deliveryRecordRepository.findByOrderId(order.getId()).ifPresent(record -> {
            record.setStatus(DeliveryRecord.DeliveryRecordStatus.CANCELLED);
            deliveryRecordRepository.save(record);
        });
    }

    private Order.SkipReason parseSkipReason(String skipReasonStr) {
        if (skipReasonStr == null || skipReasonStr.isBlank()) {
            throw new BusinessException("INVALID_SKIP_REASON",
                    "skipReason is required when status is SKIPPED", HttpStatus.BAD_REQUEST);
        }
        try {
            return Order.SkipReason.valueOf(skipReasonStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("INVALID_SKIP_REASON",
                    "skipReason must be one of: CUSTOMER_UNAVAILABLE, PRODUCT_UNAVAILABLE, DAMAGED, OTHER",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private DeliveryRecord requireDeliveryRecord(UUID orderId) {
        return deliveryRecordRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Delivery record not found for order: " + orderId, HttpStatus.NOT_FOUND));
    }
}
