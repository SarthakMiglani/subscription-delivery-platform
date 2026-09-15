package com.juiceplatform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Persisted admin notification event.
 * Created whenever the NotificationService fires an alert-worthy event.
 * Admin can mark individual notifications or all as read.
 */
@Entity
@Table(name = "admin_notifications")
@Getter
@Setter
@NoArgsConstructor
public class AdminNotification {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * Discriminator: WALLET_RECHARGE_REQUESTED | LOW_BALANCE | ORDER_GENERATION_BLOCKED |
     * WALLET_CREDITED | SCHEDULER_JOB_FAILURE | PRODUCT_AUTO_PAUSE | SUBSCRIPTION_CANCELLED
     */
    @Column(name = "type", nullable = false, length = 80)
    private String type;

    /** Null for non-customer events (e.g. scheduler job failures). */
    @Column(name = "customer_id")
    private UUID customerId;

    /** Null for non-customer events (e.g. scheduler job failures). */
    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Optional: amount involved (wallet balance, recharge amount) in paise */
    @Column(name = "amount_paise")
    private Long amountPaise;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        this.createdAt = OffsetDateTime.now();
    }

    public AdminNotification(String type, UUID customerId, String customerName,
                              String message, Long amountPaise) {
        this.type = type;
        this.customerId = customerId;
        this.customerName = customerName;
        this.message = message;
        this.amountPaise = amountPaise;
    }
}
