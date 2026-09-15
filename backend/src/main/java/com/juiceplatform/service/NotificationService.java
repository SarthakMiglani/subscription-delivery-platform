package com.juiceplatform.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Best-effort, non-blocking notification service.
 * Failures are logged and never affect business operations.
 * Notification dispatch must never participate in financial database transactions —
 * business transactions commit first, notifications are sent after commit.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final AdminNotificationService adminNotificationService;

    /**
     * Notifies admin that a customer has requested a wallet recharge.
     * Persists a notification row and logs to console.
     */
    public void notifyAdminWalletRechargeRequested(UUID customerId, String customerName,
                                                    String notes, long currentBalancePaise) {
        try {
            log.info("[NOTIFICATION] Admin alert: Customer {} ({}) requested wallet recharge. " +
                     "Current balance: {} paise. Notes: {}",
                     customerId, customerName, currentBalancePaise, notes);

            String message = String.format(
                    "%s requested a wallet recharge. Current balance: ₹%.2f. Notes: %s",
                    customerName, currentBalancePaise / 100.0,
                    notes != null && !notes.isBlank() ? notes : "—");

            adminNotificationService.create(
                    AdminNotificationService.TYPE_WALLET_RECHARGE_REQUESTED,
                    customerId, customerName, message, currentBalancePaise);

        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify admin of recharge request for customer {}: {}",
                     customerId, e.getMessage());
        }
    }

    /**
     * Notifies customer and admin of low wallet balance (below ₹200 threshold).
     */
    public void notifyLowBalance(UUID customerId, String customerName,
                                  long balancePaise, long thresholdPaise) {
        try {
            log.info("[NOTIFICATION] Low balance warning: Customer {} ({}) balance {} paise < threshold {} paise",
                     customerId, customerName, balancePaise, thresholdPaise);

            String message = String.format(
                    "%s has a low wallet balance of ₹%.2f (threshold ₹%.2f). Top up soon to avoid order interruptions.",
                    customerName, balancePaise / 100.0, thresholdPaise / 100.0);

            adminNotificationService.create(
                    AdminNotificationService.TYPE_LOW_BALANCE,
                    customerId, customerName, message, balancePaise);

        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to send low balance warning for customer {}: {}",
                     customerId, e.getMessage());
        }
    }

    /**
     * Notifies admin that order generation was blocked due to insufficient balance.
     */
    public void notifyOrderGenerationBlocked(UUID customerId, String customerName,
                                              long balancePaise, long requiredPaise) {
        try {
            log.info("[NOTIFICATION] Order generation blocked: Customer {} ({}) balance {} paise < required {} paise",
                     customerId, customerName, balancePaise, requiredPaise);

            String message = String.format(
                    "Order generation blocked for %s — balance ₹%.2f is below the required ₹%.2f.",
                    customerName, balancePaise / 100.0, requiredPaise / 100.0);

            adminNotificationService.create(
                    AdminNotificationService.TYPE_ORDER_GENERATION_BLOCKED,
                    customerId, customerName, message, balancePaise);

        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify order generation blocked for customer {}: {}",
                     customerId, e.getMessage());
        }
    }

    /**
     * Notifies admin (in-app panel) that a customer's wallet was credited.
     * Email delivery to the customer is a future enhancement (SMTP not yet configured);
     * the in-app admin notification is persisted so the credit is visible in the panel.
     */
    public void notifyWalletCredited(UUID customerId, String customerName,
                                      long amountPaise, long newBalancePaise) {
        try {
            log.info("[NOTIFICATION] Wallet credited: Customer {} ({}) received {} paise. New balance: {} paise",
                     customerId, customerName, amountPaise, newBalancePaise);

            String message = String.format(
                    "%s's wallet was credited ₹%.2f. New balance: ₹%.2f.",
                    customerName, amountPaise / 100.0, newBalancePaise / 100.0);

            adminNotificationService.create(
                    AdminNotificationService.TYPE_WALLET_CREDITED,
                    customerId, customerName, message, amountPaise);
            // TODO: Send email to customer when SMTP is configured
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify wallet credit for customer {}: {}", customerId, e.getMessage());
        }
    }

    /**
     * Notifies admin of a scheduler job failure. Persisted with no associated customer.
     */
    public void notifySchedulerJobFailure(String jobName, LocalDate jobDate, String errorMessage) {
        try {
            log.error("[NOTIFICATION] Scheduler job failure: {} for date {} — {}", jobName, jobDate, errorMessage);

            String message = String.format(
                    "%s failed for %s: %s", jobName, jobDate,
                    errorMessage != null && !errorMessage.isBlank() ? errorMessage : "Unknown error");

            adminNotificationService.createSystemEvent(
                    AdminNotificationService.TYPE_SCHEDULER_JOB_FAILURE, message);
            // TODO: Send email to admin when SMTP is configured
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify scheduler job failure for {}: {}", jobName, e.getMessage());
        }
    }

    /**
     * Notifies admin and customer that a subscription was auto-paused
     * because its product was disabled.
     */
    public void notifyProductAutoPause(UUID customerId, String customerName,
                                        UUID productId, String productName,
                                        UUID subscriptionId) {
        try {
            log.info("[NOTIFICATION] Subscription auto-paused: Customer {} ({}) subscription {} " +
                     "paused because product {} ({}) was disabled",
                     customerId, customerName, subscriptionId, productId, productName);

            String message = String.format(
                    "%s's subscription was auto-paused because product \"%s\" was disabled.",
                    customerName, productName);

            adminNotificationService.create(
                    AdminNotificationService.TYPE_PRODUCT_AUTO_PAUSE,
                    customerId, customerName, message, null);
            // TODO: Send email to customer and admin when SMTP is configured
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify product auto-pause for customer {}, subscription {}: {}",
                     customerId, subscriptionId, e.getMessage());
        }
    }

    /**
     * Notifies admin that a customer's subscription was cancelled.
     */
    public void notifySubscriptionCancelled(UUID customerId, String customerName,
                                             UUID subscriptionId, String productName) {
        try {
            log.info("[NOTIFICATION] Subscription cancelled: Customer {} ({}) cancelled subscription {} ({})",
                     customerId, customerName, subscriptionId, productName);

            String message = String.format("%s cancelled their subscription for %s.",
                    customerName, productName != null ? productName : "a product");

            adminNotificationService.create(
                    AdminNotificationService.TYPE_SUBSCRIPTION_CANCELLED,
                    customerId, customerName, message, null);
            // TODO: Send email to customer when SMTP is configured
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to notify subscription cancellation for customer {}, subscription {}: {}",
                     customerId, subscriptionId, e.getMessage());
        }
    }
}
