package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminOrderListItemResponse;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.ProductRepository;
import com.juiceplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

/**
 * Admin cross-customer order listing — Domain 10.1 from API spec.
 * Read-only query service backing GET /api/v1/admin/orders.
 */
@Service
@RequiredArgsConstructor
public class AdminOrderQueryService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AdminOrderListItemResponse> listOrders(UUID customerId, String status,
                                                         LocalDate deliveryDate, LocalDate fromDate,
                                                         LocalDate toDate, Pageable pageable) {
        Order.OrderStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = Order.OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_STATUS",
                        "Invalid order status: " + status, HttpStatus.BAD_REQUEST);
            }
        }

        Page<Order> page = orderRepository.findForAdmin(
                customerId, statusEnum, deliveryDate, fromDate, toDate, pageable);

        List<Order> orders = page.getContent();
        if (orders.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, page.getTotalElements());
        }

        // Batch-fetch customer names and product names to avoid N+1
        List<UUID> customerIds = orders.stream().map(Order::getCustomerId).distinct().collect(Collectors.toList());
        Map<UUID, String> customerNames = new HashMap<>();
        userRepository.findAllById(customerIds).forEach(u -> customerNames.put(u.getId(), u.getName()));

        List<UUID> productIds = orders.stream().map(Order::getProductId).distinct().collect(Collectors.toList());
        Map<UUID, String> productNames = new HashMap<>();
        productRepository.findAllById(productIds).forEach(p -> productNames.put(p.getId(), p.getName()));

        List<AdminOrderListItemResponse> items = orders.stream()
                .map(o -> AdminOrderListItemResponse.builder()
                        .id(o.getId())
                        .customerId(o.getCustomerId())
                        .customerName(customerNames.getOrDefault(o.getCustomerId(), "Unknown Customer"))
                        .productName(productNames.getOrDefault(o.getProductId(), "Unknown Product"))
                        .quantity(o.getQuantity())
                        .totalAmountPaise(o.getTotalAmountPaise())
                        .deliveryDate(o.getDeliveryDate())
                        .status(o.getStatus().name())
                        .isLocked(o.getStatus() == Order.OrderStatus.LOCKED)
                        .build())
                .collect(Collectors.toList());

        return new PageImpl<>(items, pageable, page.getTotalElements());
    }
}
