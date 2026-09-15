package com.juiceplatform.repository;

import com.juiceplatform.entity.Subscription;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Page<Subscription> findByCustomerId(UUID customerId, Pageable pageable);

    /**
     * Same lookup as {@link #findByIdAndCustomerId}, but acquires a pessimistic write
     * lock on the subscription row for the duration of the transaction.
     * <p>
     * Used by change-request creation (changeQuantity/changeProduct) to serialize
     * "supersede existing APPROVED request → insert new APPROVED request" per subscription
     * (BR-SUB-10). Without this lock, two concurrent requests of the same type could both
     * read "no existing APPROVED request" and both insert, leaving two simultaneously
     * APPROVED requests of the same type.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Subscription s WHERE s.id = :id AND s.customerId = :customerId")
    Optional<Subscription> findByIdAndCustomerIdForUpdate(
            @Param("id") UUID id, @Param("customerId") UUID customerId);

    Page<Subscription> findByCustomerIdAndStatus(UUID customerId, Subscription.SubscriptionStatus status, Pageable pageable);

    @Query("SELECT s FROM Subscription s WHERE s.customerId = :customerId AND s.productId = :productId AND s.status IN ('ACTIVE', 'PAUSED', 'PENDING_START')")
    Optional<Subscription> findActiveByCustomerIdAndProductId(UUID customerId, UUID productId);

    Optional<Subscription> findByIdAndCustomerId(UUID id, UUID customerId);

    List<Subscription> findAllByStatus(Subscription.SubscriptionStatus status);

    List<Subscription> findAllByStatusAndStartDateLessThanEqual(
            Subscription.SubscriptionStatus status, java.time.LocalDate date);

    /**
     * Finds all ACTIVE and PENDING_START subscriptions for a given product.
     * Used by product-disable auto-pause logic.
     */
    List<Subscription> findAllByProductIdAndStatusIn(
            UUID productId, List<Subscription.SubscriptionStatus> statuses);

    /**
     * Admin cross-customer listing: all subscriptions ordered by createdAt DESC.
     */
    Page<Subscription> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Admin cross-customer listing filtered by status.
     */
    Page<Subscription> findAllByStatusOrderByCreatedAtDesc(
            Subscription.SubscriptionStatus status, Pageable pageable);

    /**
     * All ACTIVE/PENDING_START/PAUSED subscriptions for a customer.
     * Used by deactivate cascade to find subs to pause.
     */
    List<Subscription> findAllByCustomerIdAndStatusIn(
            UUID customerId, List<Subscription.SubscriptionStatus> statuses);

    /**
     * Batch count of ACTIVE + PENDING_START + PAUSED subscriptions per customer.
     * Returns rows of [customerId (UUID), count (Long)].
     * Used to avoid N+1 in customer list.
     */
    @Query("SELECT s.customerId, COUNT(s) FROM Subscription s " +
           "WHERE s.customerId IN :customerIds " +
           "AND s.status IN ('ACTIVE', 'PENDING_START', 'PAUSED') " +
           "GROUP BY s.customerId")
    List<Object[]> countActiveSubscriptionsByCustomerIds(
            @Param("customerIds") List<UUID> customerIds);
}
