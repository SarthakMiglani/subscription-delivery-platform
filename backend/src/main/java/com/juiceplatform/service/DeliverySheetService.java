package com.juiceplatform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.juiceplatform.dto.deliverysheet.DeliverySheetOrderEntry;
import com.juiceplatform.dto.deliverysheet.DeliverySheetResponse;
import com.juiceplatform.dto.deliverysheet.JuiceSummaryEntry;
import com.juiceplatform.dto.ingredient.IngredientSummaryEntry;
import com.juiceplatform.entity.DeliveryRecord;
import com.juiceplatform.entity.DeliverySheetSnapshot;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.DeliveryRecordRepository;
import com.juiceplatform.repository.DeliverySheetSnapshotRepository;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.ProductRepository;
import com.juiceplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Generates and retrieves delivery sheet snapshots.
 * Only LOCKED orders with PENDING delivery_records appear.
 * CANCELLED delivery_records are excluded.
 * Snapshots are replaced on rerun (not append-only).
 */
@Service
@RequiredArgsConstructor
public class DeliverySheetService {

    private static final Logger log = LoggerFactory.getLogger(DeliverySheetService.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final DeliverySheetSnapshotRepository snapshotRepository;
    private final DeliveryRecordRepository deliveryRecordRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final IngredientService ingredientService;

    /**
     * Generates (or regenerates) the delivery sheet snapshot for the given date.
     * On rerun: replaces the existing snapshot (DELETE + INSERT).
     * Idempotent: safe to call multiple times for the same date.
     *
     * @param deliveryDate the target delivery date
     * @param source       SCHEDULER or ADMIN_RERUN
     * @param adminId      null for scheduler runs, admin UUID for manual reruns
     */
    @Transactional
    public DeliverySheetResponse generateSnapshot(LocalDate deliveryDate,
                                                   DeliverySheetSnapshot.GeneratedBySource source,
                                                   UUID adminId) {
        log.info("DeliverySheetGenerationJob starting for delivery date: {} (source: {})", deliveryDate, source);

        // Build the delivery sheet data from LOCKED orders with PENDING delivery_records
        DeliverySheetResponse sheetData = buildSheetData(deliveryDate);

        // Serialize to JSON for storage
        String snapshotJson;
        try {
            snapshotJson = objectMapper.writeValueAsString(sheetData);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize delivery sheet snapshot", e);
        }

        // Replace existing snapshot if present (DELETE + INSERT on rerun)
        snapshotRepository.findByDeliveryDate(deliveryDate)
                .ifPresent(snapshotRepository::delete);
        snapshotRepository.flush();

        DeliverySheetSnapshot snapshot = new DeliverySheetSnapshot();
        snapshot.setDeliveryDate(deliveryDate);
        snapshot.setGeneratedAt(OffsetDateTime.now(IST));
        snapshot.setGeneratedBySource(source);
        snapshot.setGeneratedByUserId(adminId);
        snapshot.setSnapshotJson(snapshotJson);
        snapshotRepository.save(snapshot);

        log.info("DeliverySheetGenerationJob completed for {}: {} orders in sheet", deliveryDate, sheetData.getOrders().size());

        return sheetData;
    }

    /**
     * Retrieves the delivery sheet snapshot for a given date.
     * Returns 404 if no snapshot exists (not yet generated).
     */
    @Transactional(readOnly = true)
    public DeliverySheetResponse getSnapshot(LocalDate deliveryDate) {
        DeliverySheetSnapshot snapshot = snapshotRepository.findByDeliveryDate(deliveryDate)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "No delivery sheet exists for date: " + deliveryDate, HttpStatus.NOT_FOUND));

        try {
            DeliverySheetResponse response = objectMapper.readValue(snapshot.getSnapshotJson(), DeliverySheetResponse.class);

            List<UUID> orderIds = response.getOrders().stream()
                    .map(com.juiceplatform.dto.deliverysheet.DeliverySheetOrderEntry::getOrderId)
                    .collect(Collectors.toList());

            if (!orderIds.isEmpty()) {
                Map<UUID, DeliveryRecord> records = deliveryRecordRepository.findByOrderIdIn(orderIds)
                        .stream().collect(Collectors.toMap(DeliveryRecord::getOrderId, r -> r));

                response.getOrders().forEach(entry -> {
                    DeliveryRecord record = records.get(entry.getOrderId());
                    if (record != null) {
                        entry.setDeliveryStatus(record.getStatus().name());
                    }
                });
            }

            return response;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize delivery sheet snapshot", e);
        }
    }

    /**
     * Builds the delivery sheet data from LOCKED orders with PENDING delivery_records.
     * CANCELLED delivery_records are excluded.
     */
    private DeliverySheetResponse buildSheetData(LocalDate deliveryDate) {
        // Find all relevant orders for this delivery date (LOCKED, DELIVERED, SKIPPED)
        List<Order> lockedOrders = orderRepository.findByDeliveryDateAndStatusIn(
                deliveryDate, List.of(Order.OrderStatus.LOCKED, Order.OrderStatus.DELIVERED, Order.OrderStatus.SKIPPED));

        // Batch-fetch delivery records, customers, and products to avoid N+1 queries
        List<UUID> orderIds = lockedOrders.stream().map(Order::getId).collect(Collectors.toList());
        Map<UUID, DeliveryRecord> recordsByOrderId = deliveryRecordRepository.findByOrderIdIn(orderIds)
                .stream().collect(Collectors.toMap(DeliveryRecord::getOrderId, r -> r));

        List<UUID> customerIds = lockedOrders.stream().map(Order::getCustomerId).distinct().collect(Collectors.toList());
        Map<UUID, User> customersById = userRepository.findAllById(customerIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        List<UUID> productIds = lockedOrders.stream().map(Order::getProductId).distinct().collect(Collectors.toList());
        Map<UUID, String> productNames = productRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(Product::getId, Product::getName));

        List<DeliverySheetOrderEntry> orderEntries = new ArrayList<>();
        Map<String, Integer> juiceTotals = new LinkedHashMap<>();
        List<Order> activeOrders = new ArrayList<>();

        for (Order order : lockedOrders) {
            // Only include orders with PENDING delivery_records (exclude CANCELLED)
            DeliveryRecord record = recordsByOrderId.get(order.getId());
            if (record == null || record.getStatus() == DeliveryRecord.DeliveryRecordStatus.CANCELLED) {
                continue;
            }

            activeOrders.add(order);

            User customer = customersById.get(order.getCustomerId());
            String customerName = customer != null ? customer.getName() : "Unknown";
            String phone = customer != null ? customer.getPhone() : "";

            String address = formatAddress(order);
            String productName = productNames.getOrDefault(order.getProductId(), "Unknown Product");

            orderEntries.add(DeliverySheetOrderEntry.builder()
                    .orderId(order.getId())
                    .customerName(customerName)
                    .phone(phone != null ? phone : "")
                    .address(address)
                    .deliveryNotes(order.getDeliveryNotes())
                    .productName(productName)
                    .quantity(order.getQuantity())
                    .deliveryStatus(record.getStatus().name())
                    .build());

            juiceTotals.merge(productName, order.getQuantity(), Integer::sum);
        }

        List<JuiceSummaryEntry> juiceSummary = juiceTotals.entrySet().stream()
                .map(e -> JuiceSummaryEntry.builder()
                        .productName(e.getKey())
                        .totalQuantity(e.getValue())
                        .build())
                .toList();

        IngredientService.IngredientComputeResult ingredientResult =
                ingredientService.computeIngredientSummary(activeOrders);

        return DeliverySheetResponse.builder()
                .deliveryDate(deliveryDate)
                .generatedAt(OffsetDateTime.now(IST))
                .orders(orderEntries)
                .juiceSummary(juiceSummary)
                .ingredientSummary(ingredientResult.entries())
                .productsWithoutRecipe(ingredientResult.productsWithoutRecipe())
                .build();
    }

    /**
     * Formats address as a display string: "line1, line2, city pincode".
     */
    private String formatAddress(Order order) {
        StringBuilder sb = new StringBuilder();
        if (order.getDeliveryLine1() != null) sb.append(order.getDeliveryLine1());
        if (order.getDeliveryLine2() != null && !order.getDeliveryLine2().isBlank()) {
            sb.append(", ").append(order.getDeliveryLine2());
        }
        if (order.getDeliveryCity() != null) sb.append(", ").append(order.getDeliveryCity());
        if (order.getDeliveryPincode() != null) sb.append(" ").append(order.getDeliveryPincode());
        return sb.toString();
    }
}
