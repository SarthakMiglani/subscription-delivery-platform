package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminCustomerDetailResponse;
import com.juiceplatform.dto.admin.AdminCustomerListItemResponse;
import com.juiceplatform.dto.admin.AdminCustomerStatusResponse;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Subscription;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.DeliveryAddressRepository;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.SubscriptionRepository;
import com.juiceplatform.repository.UserRepository;
import com.juiceplatform.repository.WalletLedgerRepository;
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

@Service
@RequiredArgsConstructor
public class AdminCustomerServiceImpl implements AdminCustomerService {

    private final UserRepository userRepository;
    private final DeliveryAddressRepository deliveryAddressRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminCustomerListItemResponse> listCustomers(String search, Pageable pageable) {
        Page<User> userPage;

        if (search != null && !search.isBlank()) {
            userPage = userRepository.searchCustomers(User.UserRole.CUSTOMER, search.trim(), pageable);
        } else {
            userPage = userRepository.findByRoleOrderByCreatedAtDesc(User.UserRole.CUSTOMER, pageable);
        }

        List<User> users = userPage.getContent();
        if (users.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, userPage.getTotalElements());
        }

        List<UUID> customerIds = users.stream().map(User::getId).collect(Collectors.toList());

        // Batch fetch active subscription counts — avoids N+1
        List<Object[]> countRows = subscriptionRepository.countActiveSubscriptionsByCustomerIds(customerIds);
        Map<UUID, Long> subCountMap = new HashMap<>();
        for (Object[] row : countRows) {
            UUID cid = (UUID) row[0];
            Long count = (Long) row[1];
            subCountMap.put(cid, count);
        }

        // Batch fetch latest wallet balances — avoids N+1
        List<Object[]> balanceRows = walletLedgerRepository.findLatestBalancesByCustomerIds(customerIds);
        Map<UUID, Long> balanceMap = new HashMap<>();
        for (Object[] row : balanceRows) {
            // Native query returns PostgreSQL UUID as String — convert back to UUID
            UUID cid = row[0] instanceof UUID ? (UUID) row[0] : UUID.fromString(row[0].toString());
            Long balance = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            balanceMap.put(cid, balance);
        }

        List<AdminCustomerListItemResponse> items = users.stream()
                .map(u -> AdminCustomerListItemResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .phone(u.getPhone())
                        .isActive(u.getIsActive())
                        .onboardingComplete(u.getOnboardingCompleted())
                        .walletBalancePaise(balanceMap.getOrDefault(u.getId(), 0L))
                        .activeSubscriptionCount(subCountMap.getOrDefault(u.getId(), 0L))
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return new PageImpl<>(items, pageable, userPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCustomerDetailResponse getCustomerDetail(UUID customerId) {
        User customer = requireCustomer(customerId);

        AdminCustomerDetailResponse.AddressDto addressDto = null;
        if (Boolean.TRUE.equals(customer.getOnboardingCompleted())) {
            addressDto = deliveryAddressRepository.findByCustomerId(customerId)
                    .map(addr -> AdminCustomerDetailResponse.AddressDto.builder()
                            .id(addr.getId())
                            .line1(addr.getLine1())
                            .line2(addr.getLine2())
                            .city(addr.getCity())
                            .state(addr.getState())
                            .pincode(addr.getPincode())
                            .deliveryNotes(addr.getDeliveryNotes())
                            .build())
                    .orElse(null);
        }

        long balance = walletService.getCurrentBalance(customerId);

        return AdminCustomerDetailResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .isActive(Boolean.TRUE.equals(customer.getIsActive()))
                .onboardingComplete(Boolean.TRUE.equals(customer.getOnboardingCompleted()))
                .address(addressDto)
                .walletBalancePaise(balance)
                .createdAt(customer.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminCustomerStatusResponse deactivateCustomer(UUID customerId, UUID adminId) {
        User customer = requireCustomer(customerId);

        if (!Boolean.TRUE.equals(customer.getIsActive())) {
            throw new BusinessException("CUSTOMER_ALREADY_INACTIVE",
                    "Customer is already deactivated", HttpStatus.CONFLICT);
        }

        customer.setIsActive(false);
        userRepository.save(customer);

        // Auto-pause all ACTIVE and PENDING_START subscriptions (CUSTOMER_DEACTIVATED reason)
        List<Subscription> activeSubs = subscriptionRepository.findAllByCustomerIdAndStatusIn(
                customerId,
                List.of(Subscription.SubscriptionStatus.ACTIVE, Subscription.SubscriptionStatus.PENDING_START));

        LocalDate today = LocalDate.now();
        for (Subscription sub : activeSubs) {
            sub.setStatus(Subscription.SubscriptionStatus.PAUSED);
            sub.setPauseReason(Subscription.PauseReason.CUSTOMER_DEACTIVATED);
            subscriptionRepository.save(sub);

            // Cancel future SCHEDULED orders from today onward
            List<Order> scheduledOrders = orderRepository
                    .findBySubscriptionIdAndStatusAndDeliveryDateGreaterThanEqual(
                            sub.getId(), Order.OrderStatus.SCHEDULED, today);
            for (Order order : scheduledOrders) {
                order.setStatus(Order.OrderStatus.CANCELLED);
                orderRepository.save(order);
            }
        }

        auditLogService.log("CUSTOMER_DEACTIVATION", "customer", customerId.toString(),
                Map.of("isActive", true),
                Map.of("isActive", false, "pausedSubscriptions", activeSubs.size()),
                adminId);

        return AdminCustomerStatusResponse.builder()
                .message("Customer deactivated")
                .build();
    }

    @Override
    @Transactional
    public AdminCustomerStatusResponse reactivateCustomer(UUID customerId, UUID adminId) {
        User customer = requireCustomer(customerId);

        if (Boolean.TRUE.equals(customer.getIsActive())) {
            throw new BusinessException("CUSTOMER_ALREADY_ACTIVE",
                    "Customer is already active", HttpStatus.CONFLICT);
        }

        customer.setIsActive(true);
        userRepository.save(customer);

        // Re-activate subscriptions that were paused due to CUSTOMER_DEACTIVATED
        List<Subscription> deactivatedSubs = subscriptionRepository.findAllByCustomerIdAndStatusIn(
                customerId, List.of(Subscription.SubscriptionStatus.PAUSED));

        int resumed = 0;
        for (Subscription sub : deactivatedSubs) {
            if (sub.getPauseReason() == Subscription.PauseReason.CUSTOMER_DEACTIVATED) {
                sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                sub.setPauseReason(null);
                subscriptionRepository.save(sub);
                resumed++;
            }
        }

        auditLogService.log("CUSTOMER_REACTIVATION", "customer", customerId.toString(),
                Map.of("isActive", false),
                Map.of("isActive", true, "resumedSubscriptions", resumed),
                adminId);

        return AdminCustomerStatusResponse.builder()
                .message("Customer reactivated")
                .build();
    }

    private User requireCustomer(UUID customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Customer not found: " + customerId, HttpStatus.NOT_FOUND));
        if (customer.getRole() != User.UserRole.CUSTOMER) {
            throw new BusinessException("RESOURCE_NOT_FOUND",
                    "Customer not found: " + customerId, HttpStatus.NOT_FOUND);
        }
        return customer;
    }
}
