package com.juiceplatform.repository;

import com.juiceplatform.entity.WalletLedger;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletLedgerRepository extends JpaRepository<WalletLedger, UUID> {

    /**
     * Returns the most recent ledger entry for a customer.
     * running_balance_paise on this row is the live wallet balance.
     * Uses Spring Data Top/First to return exactly one row ordered by createdAt DESC.
     *
     * Use this for READ-ONLY balance checks (e.g. wallet summary, order generation).
     */
    Optional<WalletLedger> findTopByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    /**
     * Returns the most recent ledger entry for a customer with a pessimistic write lock
     * (SELECT ... FOR UPDATE). Must be called inside an active @Transactional context.
     *
     * Use this before inserting any new ledger entry that depends on the current balance
     * (admin credit, delivery debit, historical correction refund/debit).
     * This prevents concurrent transactions from reading the same running_balance_paise
     * and producing an incorrect double-mutation.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WalletLedger w WHERE w.customerId = :customerId " +
           "ORDER BY w.createdAt DESC, w.id DESC LIMIT 1")
    Optional<WalletLedger> findTopByCustomerIdForUpdate(@Param("customerId") UUID customerId);

    Page<WalletLedger> findByCustomerIdOrderByCreatedAtDescIdDesc(UUID customerId, Pageable pageable);

    /**
     * Batch fetch of the latest running_balance_paise per customer.
     * Uses PostgreSQL DISTINCT ON to return one row per customer_id (latest by created_at DESC).
     * Returns rows of [customer_id (UUID), running_balance_paise (Long)].
     * Used by admin customer list to avoid N+1 wallet balance queries.
     */
    @Query(value = "SELECT DISTINCT ON (customer_id) customer_id, running_balance_paise " +
                   "FROM wallet_ledger " +
                   "WHERE customer_id IN :customerIds " +
                   "ORDER BY customer_id, created_at DESC, id DESC",
           nativeQuery = true)
    List<Object[]> findLatestBalancesByCustomerIds(@Param("customerIds") List<UUID> customerIds);
}
