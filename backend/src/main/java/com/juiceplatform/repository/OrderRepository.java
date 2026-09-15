package com.juiceplatform.repository;

import com.juiceplatform.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findByCustomerIdOrderByDeliveryDateDesc(UUID customerId, Pageable pageable);

    Page<Order> findByCustomerIdAndStatusOrderByDeliveryDateDesc(UUID customerId, Order.OrderStatus status, Pageable pageable);

    Optional<Order> findByIdAndCustomerId(UUID id, UUID customerId);

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByIdempotencyKeyAndStatus(String idempotencyKey, Order.OrderStatus status);

    List<Order> findByDeliveryDateAndStatus(LocalDate deliveryDate, Order.OrderStatus status);

    List<Order> findByDeliveryDateAndStatusIn(LocalDate deliveryDate, List<Order.OrderStatus> statuses);

    List<Order> findBySubscriptionIdAndStatusAndDeliveryDateGreaterThanEqual(
            UUID subscriptionId, Order.OrderStatus status, LocalDate fromDate);

    /**
     * Admin cross-customer order listing (Domain 10.1) with optional filters.
     * Each filter is applied only when its parameter is non-null — passing null for
     * a given filter matches all values for that column.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT o FROM Order o WHERE " +
            "(:customerId IS NULL OR o.customerId = :customerId) AND " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:deliveryDate IS NULL OR o.deliveryDate = :deliveryDate) AND " +
            "(:fromDate IS NULL OR o.deliveryDate >= :fromDate) AND " +
            "(:toDate IS NULL OR o.deliveryDate <= :toDate) " +
            "ORDER BY o.deliveryDate DESC, o.createdAt DESC")
    Page<Order> findForAdmin(
            @org.springframework.data.repository.query.Param("customerId") UUID customerId,
            @org.springframework.data.repository.query.Param("status") Order.OrderStatus status,
            @org.springframework.data.repository.query.Param("deliveryDate") LocalDate deliveryDate,
            @org.springframework.data.repository.query.Param("fromDate") LocalDate fromDate,
            @org.springframework.data.repository.query.Param("toDate") LocalDate toDate,
            Pageable pageable);
}
