package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminSubscriptionListItemResponse;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideRequest;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideResponse;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.Subscription;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.ProductRepository;
import com.juiceplatform.repository.SubscriptionRepository;
import com.juiceplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSubscriptionServiceImpl implements AdminSubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminSubscriptionListItemResponse> listSubscriptions(String status, Pageable pageable) {
        Page<Subscription> page;

        if (status != null && !status.isBlank()) {
            Subscription.SubscriptionStatus statusEnum;
            try {
                statusEnum = Subscription.SubscriptionStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_STATUS",
                        "Invalid subscription status: " + status, HttpStatus.BAD_REQUEST);
            }
            page = subscriptionRepository.findAllByStatusOrderByCreatedAtDesc(statusEnum, pageable);
        } else {
            page = subscriptionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        // Collect unique customer IDs and product IDs for batch lookup
        List<Subscription> subs = page.getContent();

        List<UUID> customerIds = subs.stream()
                .map(Subscription::getCustomerId)
                .distinct()
                .collect(Collectors.toList());
        List<UUID> productIds = subs.stream()
                .map(Subscription::getProductId)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, String> customerNames = new HashMap<>();
        if (!customerIds.isEmpty()) {
            userRepository.findAllById(customerIds)
                    .forEach(u -> customerNames.put(u.getId(), u.getName()));
        }

        Map<UUID, String> productNames = new HashMap<>();
        if (!productIds.isEmpty()) {
            productRepository.findAllById(productIds)
                    .forEach(p -> productNames.put(p.getId(), p.getName()));
        }

        return page.map(sub -> AdminSubscriptionListItemResponse.builder()
                .id(sub.getId())
                .customerId(sub.getCustomerId())
                .customerName(customerNames.getOrDefault(sub.getCustomerId(), "Unknown Customer"))
                .productId(sub.getProductId())
                .productName(productNames.getOrDefault(sub.getProductId(), "Unknown Product"))
                .quantity(sub.getQuantity())
                .status(sub.getStatus().name())
                .effectiveStartDate(sub.getStartDate())
                .createdAt(sub.getCreatedAt())
                .build());
    }

    @Override
    @Transactional
    public AdminSubscriptionOverrideResponse overrideSubscription(UUID subscriptionId,
                                                                   AdminSubscriptionOverrideRequest request,
                                                                   UUID adminId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Subscription not found: " + subscriptionId, HttpStatus.NOT_FOUND));

        // Snapshot before for audit log
        Map<String, Object> before = Map.of(
                "status", subscription.getStatus().name(),
                "quantity", subscription.getQuantity(),
                "productId", subscription.getProductId().toString()
        );

        // Apply status override
        Subscription.SubscriptionStatus oldStatus = subscription.getStatus();
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            Subscription.SubscriptionStatus newStatus;
            try {
                newStatus = Subscription.SubscriptionStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_STATUS",
                        "Invalid subscription status: " + request.getStatus(), HttpStatus.BAD_REQUEST);
            }

            if (newStatus == Subscription.SubscriptionStatus.CANCELLED
                    && oldStatus == Subscription.SubscriptionStatus.CANCELLED) {
                throw new BusinessException("SUBSCRIPTION_ALREADY_CANCELLED",
                        "Subscription is already cancelled", HttpStatus.CONFLICT);
            }

            subscription.setStatus(newStatus);

            // Handle status-specific side effects
            if (newStatus == Subscription.SubscriptionStatus.PAUSED) {
                subscription.setPauseReason(Subscription.PauseReason.USER_PAUSED);
                cancelScheduledOrdersFrom(subscription.getId(), LocalDate.now());
            } else if (newStatus == Subscription.SubscriptionStatus.CANCELLED) {
                subscription.setPauseReason(null);
                cancelScheduledOrdersFrom(subscription.getId(), LocalDate.now());
            } else if (newStatus == Subscription.SubscriptionStatus.ACTIVE) {
                // Re-activating from PAUSED or PENDING_START — clear pause reason
                subscription.setPauseReason(null);
                // Do NOT recreate cancelled orders; scheduler will generate from next cycle
            }
        }

        // Apply quantity override
        if (request.getQuantity() != null) {
            subscription.setQuantity(request.getQuantity());
        }

        // Apply product override
        if (request.getProductId() != null) {
            Product newProduct = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new BusinessException("PRODUCT_UNAVAILABLE",
                            "Product not found: " + request.getProductId(), HttpStatus.BAD_REQUEST));
            if (!newProduct.getIsAvailable()) {
                throw new BusinessException("PRODUCT_UNAVAILABLE",
                        "Product is currently disabled", HttpStatus.BAD_REQUEST);
            }
            subscription.setProductId(request.getProductId());
        }

        subscription = subscriptionRepository.save(subscription);

        // Audit log
        Map<String, Object> after = new HashMap<>();
        after.put("status", subscription.getStatus().name());
        after.put("quantity", subscription.getQuantity());
        after.put("productId", subscription.getProductId().toString());
        if (request.getNotes() != null) {
            after.put("notes", request.getNotes());
        }

        auditLogService.log("SUBSCRIPTION_EDIT", "subscription", subscriptionId.toString(),
                before, after, adminId, request.getNotes());

        // Resolve product name for response
        String productName = productRepository.findById(subscription.getProductId())
                .map(Product::getName)
                .orElse("Unknown Product");

        return AdminSubscriptionOverrideResponse.builder()
                .id(subscription.getId())
                .customerId(subscription.getCustomerId())
                .productId(subscription.getProductId())
                .productName(productName)
                .quantity(subscription.getQuantity())
                .status(subscription.getStatus().name())
                .effectiveStartDate(subscription.getStartDate())
                .updatedAt(subscription.getUpdatedAt())
                .build();
    }

    private void cancelScheduledOrdersFrom(UUID subscriptionId, LocalDate fromDate) {
        List<Order> scheduledOrders = orderRepository
                .findBySubscriptionIdAndStatusAndDeliveryDateGreaterThanEqual(
                        subscriptionId, Order.OrderStatus.SCHEDULED, fromDate);
        for (Order order : scheduledOrders) {
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
        }
    }
}
