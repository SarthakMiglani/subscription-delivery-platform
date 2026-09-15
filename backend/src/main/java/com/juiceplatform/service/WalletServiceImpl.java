package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminSetBalanceRequest;
import com.juiceplatform.dto.admin.AdminSetBalanceResponse;
import com.juiceplatform.dto.admin.AdminWalletAdjustRequest;
import com.juiceplatform.dto.admin.AdminWalletAdjustResponse;
import com.juiceplatform.dto.wallet.AdminCreditRequest;
import com.juiceplatform.dto.wallet.AdminCreditResponse;
import com.juiceplatform.dto.wallet.LedgerEntryResponse;
import com.juiceplatform.dto.wallet.WalletSummaryResponse;
import com.juiceplatform.entity.User;
import com.juiceplatform.entity.WalletLedger;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.UserRepository;
import com.juiceplatform.repository.WalletLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    // Low balance threshold: ₹200 = 20,000 paise
    private static final long LOW_BALANCE_THRESHOLD_PAISE = 20_000L;

    private final WalletLedgerRepository walletLedgerRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public WalletSummaryResponse getWalletSummary(UUID customerId) {
        long balance = getCurrentBalance(customerId);

        return WalletSummaryResponse.builder()
                .balancePaise(balance)
                .lowBalanceWarning(balance < LOW_BALANCE_THRESHOLD_PAISE)
                .lowBalanceThresholdPaise(LOW_BALANCE_THRESHOLD_PAISE)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LedgerEntryResponse> getLedgerHistory(UUID customerId, Pageable pageable) {
        return walletLedgerRepository
                .findByCustomerIdOrderByCreatedAtDescIdDesc(customerId, pageable)
                .map(entry -> LedgerEntryResponse.builder()
                        .id(entry.getId())
                        .entryType(entry.getEntryType().name())
                        .sourceType(entry.getSourceType().name())
                        .amountPaise(entry.getAmountPaise())
                        .balanceAfterPaise(entry.getRunningBalancePaise())
                        .description(entry.getDescription())
                        .orderId(entry.getOrderId())
                        .createdAt(entry.getCreatedAt())
                        .build());
    }

    @Override
    @Transactional
    public AdminCreditResponse creditWallet(UUID customerId, AdminCreditRequest request, UUID adminId) {
        // Verify customer exists
        userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Customer not found: " + customerId, HttpStatus.NOT_FOUND));

        // Minimum credit validation
        if (request.getAmountPaise() < 100) {
            throw new BusinessException("INVALID_AMOUNT",
                    "Minimum wallet credit amount is ₹1 (100 paise)", HttpStatus.BAD_REQUEST);
        }

        // Compute new running balance — acquire pessimistic write lock on latest row
        // to prevent concurrent credits from computing the same running_balance_paise
        long currentBalance = walletLedgerRepository.findTopByCustomerIdForUpdate(customerId)
                .map(WalletLedger::getRunningBalancePaise)
                .orElse(0L);
        long newBalance = currentBalance + request.getAmountPaise();

        // Insert CREDIT ledger entry
        WalletLedger entry = new WalletLedger();
        entry.setCustomerId(customerId);
        entry.setEntryType(WalletLedger.EntryType.CREDIT);
        entry.setSourceType(WalletLedger.SourceType.ADMIN_CREDIT);
        entry.setAmountPaise(request.getAmountPaise());
        entry.setRunningBalancePaise(newBalance);
        entry.setDescription(request.getNotes() != null ? request.getNotes() : "Wallet top-up by admin");
        entry.setCreatedByUserId(adminId);
        entry = walletLedgerRepository.save(entry);

        // Audit log — action_type: BALANCE_CREDIT
        auditLogService.log("BALANCE_CREDIT", "customer", customerId.toString(),
                null,
                java.util.Map.of("amountPaise", request.getAmountPaise(),
                        "newBalancePaise", newBalance,
                        "ledgerEntryId", entry.getId().toString()),
                adminId, request.getNotes());

        // Best-effort notification — after the transaction's business writes are complete.
        // Notification failures never affect the credit itself (BR-NOT-01).
        User customer = userRepository.findById(customerId).orElse(null);
        notificationService.notifyWalletCredited(customerId,
                customer != null ? customer.getName() : "Customer",
                request.getAmountPaise(), newBalance);

        return AdminCreditResponse.builder()
                .ledgerEntryId(entry.getId())
                .entryType(entry.getEntryType().name())
                .sourceType(entry.getSourceType().name())
                .amountPaise(entry.getAmountPaise())
                .newBalancePaise(newBalance)
                .notes(request.getNotes())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminWalletAdjustResponse adjustWallet(UUID customerId, AdminWalletAdjustRequest request, UUID adminId) {
        // Verify customer exists
        userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Customer not found: " + customerId, HttpStatus.NOT_FOUND));

        // Resolve entry type
        String entryTypeStr = request.getEntryType().toUpperCase();
        WalletLedger.EntryType entryType;
        WalletLedger.SourceType sourceType;
        boolean isCredit;

        if ("REFUND".equals(entryTypeStr)) {
            entryType = WalletLedger.EntryType.REFUND;
            sourceType = WalletLedger.SourceType.REFUND;
            isCredit = true;
        } else if ("ADJUSTMENT".equals(entryTypeStr)) {
            entryType = WalletLedger.EntryType.ADJUSTMENT;
            sourceType = WalletLedger.SourceType.MANUAL_ADJUSTMENT;
            isCredit = true;
        } else if ("DEBIT".equals(entryTypeStr)) {
            entryType = WalletLedger.EntryType.DEBIT;
            sourceType = WalletLedger.SourceType.MANUAL_DEBIT;
            isCredit = false;
        } else {
            throw new BusinessException("INVALID_ENTRY_TYPE",
                    "entryType must be REFUND, ADJUSTMENT, or DEBIT", HttpStatus.BAD_REQUEST);
        }

        // Pessimistic lock to prevent concurrent balance corruption
        long currentBalance = walletLedgerRepository.findTopByCustomerIdForUpdate(customerId)
                .map(WalletLedger::getRunningBalancePaise)
                .orElse(0L);

        long newBalance;
        if (isCredit) {
            newBalance = currentBalance + request.getAmountPaise();
        } else {
            newBalance = currentBalance - request.getAmountPaise();
            if (newBalance < 0) {
                throw new BusinessException("INSUFFICIENT_BALANCE",
                        "Debit would result in negative balance", HttpStatus.BAD_REQUEST);
            }
        }

        WalletLedger entry = new WalletLedger();
        entry.setCustomerId(customerId);
        entry.setEntryType(entryType);
        entry.setSourceType(sourceType);
        entry.setAmountPaise(request.getAmountPaise());
        entry.setRunningBalancePaise(newBalance);
        entry.setDescription(request.getNotes() != null ? request.getNotes() : "Admin manual adjustment");
        entry.setCreatedByUserId(adminId);
        entry = walletLedgerRepository.save(entry);

        auditLogService.log("BALANCE_ADJUSTMENT", "customer", customerId.toString(),
                java.util.Map.of("balancePaise", currentBalance),
                java.util.Map.of("entryType", entryType.name(),
                        "amountPaise", request.getAmountPaise(),
                        "newBalancePaise", newBalance,
                        "ledgerEntryId", entry.getId().toString()),
                adminId, request.getNotes());

        return AdminWalletAdjustResponse.builder()
                .ledgerEntryId(entry.getId())
                .entryType(entry.getEntryType().name())
                .sourceType(entry.getSourceType().name())
                .amountPaise(entry.getAmountPaise())
                .newBalancePaise(newBalance)
                .notes(request.getNotes())
                .adjustedAt(entry.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminSetBalanceResponse setWalletBalance(UUID customerId, AdminSetBalanceRequest request, UUID adminId) {
        // Verify customer exists
        userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Customer not found: " + customerId, HttpStatus.NOT_FOUND));

        // Pessimistic lock
        long currentBalance = walletLedgerRepository.findTopByCustomerIdForUpdate(customerId)
                .map(WalletLedger::getRunningBalancePaise)
                .orElse(0L);

        long targetBalance = request.getNewBalancePaise();
        long delta = targetBalance - currentBalance;

        if (delta == 0) {
            throw new BusinessException("NO_CHANGE",
                    "New balance equals current balance — no change applied", HttpStatus.BAD_REQUEST);
        }

        WalletLedger.EntryType entryType = delta > 0
                ? WalletLedger.EntryType.CREDIT
                : WalletLedger.EntryType.DEBIT;
        long amountPaise = Math.abs(delta);

        // BR-WAL-12: admin set-balance operations always use SYSTEM_ADJUSTMENT as the
        // source_type, regardless of direction. created_by_user_id must be null for
        // SYSTEM_ADJUSTMENT entries (enforced by chk_wallet_ledger_system_adjustment_no_actor).
        // The acting admin is still fully captured in the admin_audit_log entry below.
        WalletLedger entry = new WalletLedger();
        entry.setCustomerId(customerId);
        entry.setEntryType(entryType);
        entry.setSourceType(WalletLedger.SourceType.SYSTEM_ADJUSTMENT);
        entry.setAmountPaise(amountPaise);
        entry.setRunningBalancePaise(targetBalance);
        entry.setDescription(request.getReason());
        entry.setCreatedByUserId(null);
        entry = walletLedgerRepository.save(entry);

        auditLogService.log("BALANCE_SET", "customer", customerId.toString(),
                java.util.Map.of("balancePaise", currentBalance),
                java.util.Map.of("newBalancePaise", targetBalance,
                        "delta", delta,
                        "ledgerEntryId", entry.getId().toString()),
                adminId, request.getReason());

        return AdminSetBalanceResponse.builder()
                .ledgerEntryId(entry.getId())
                .entryType(entry.getEntryType().name())
                .sourceType(entry.getSourceType().name())
                .amountPaise(amountPaise)
                .newBalancePaise(targetBalance)
                .reason(request.getReason())
                .setAt(entry.getCreatedAt())
                .build();
    }

    @Override
    public long getCurrentBalance(UUID customerId) {
        // Balance = running_balance_paise of the latest ledger row; 0 if no entries exist
        return walletLedgerRepository.findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(WalletLedger::getRunningBalancePaise)
                .orElse(0L);
    }
}
