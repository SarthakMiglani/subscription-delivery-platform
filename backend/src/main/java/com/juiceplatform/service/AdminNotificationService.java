package com.juiceplatform.service;

import com.juiceplatform.dto.notification.AdminNotificationResponse;
import com.juiceplatform.entity.AdminNotification;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.AdminNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {

    // ── Notification type constants ──────────────────────────────────────────
    public static final String TYPE_WALLET_RECHARGE_REQUESTED = "WALLET_RECHARGE_REQUESTED";
    public static final String TYPE_LOW_BALANCE               = "LOW_BALANCE";
    public static final String TYPE_ORDER_GENERATION_BLOCKED  = "ORDER_GENERATION_BLOCKED";
    public static final String TYPE_WALLET_CREDITED           = "WALLET_CREDITED";
    public static final String TYPE_SCHEDULER_JOB_FAILURE     = "SCHEDULER_JOB_FAILURE";
    public static final String TYPE_PRODUCT_AUTO_PAUSE        = "PRODUCT_AUTO_PAUSE";
    public static final String TYPE_SUBSCRIPTION_CANCELLED    = "SUBSCRIPTION_CANCELLED";

    private final AdminNotificationRepository notificationRepository;

    // ── Write ────────────────────────────────────────────────────────────────

    /**
     * Persists a new admin notification tied to a specific customer.
     * Called by NotificationService after logging — best-effort, non-transactional
     * relative to the caller's business transaction.
     */
    @Transactional
    public void create(String type, UUID customerId, String customerName,
                       String message, Long amountPaise) {
        AdminNotification n = new AdminNotification(type, customerId, customerName, message, amountPaise);
        notificationRepository.save(n);
    }

    /**
     * Persists a new admin notification with no associated customer
     * (e.g. a scheduler job failure). customerId/customerName are stored as null.
     */
    @Transactional
    public void createSystemEvent(String type, String message) {
        AdminNotification n = new AdminNotification(type, null, null, message, null);
        notificationRepository.save(n);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> list(boolean unreadOnly, Pageable pageable) {
        Page<AdminNotification> page = unreadOnly
                ? notificationRepository.findByReadFalseOrderByCreatedAtDesc(pageable)
                : notificationRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return notificationRepository.countByReadFalse();
    }

    // ── Mark read ────────────────────────────────────────────────────────────

    @Transactional
    public AdminNotificationResponse markAsRead(UUID id) {
        AdminNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "RESOURCE_NOT_FOUND", "Notification not found", HttpStatus.NOT_FOUND));
        n.setRead(true);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private AdminNotificationResponse toResponse(AdminNotification n) {
        return AdminNotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .customerId(n.getCustomerId())
                .customerName(n.getCustomerName())
                .message(n.getMessage())
                .amountPaise(n.getAmountPaise())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
