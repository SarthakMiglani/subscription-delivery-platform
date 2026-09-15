package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminSetBalanceRequest;
import com.juiceplatform.dto.admin.AdminSetBalanceResponse;
import com.juiceplatform.dto.admin.AdminWalletAdjustRequest;
import com.juiceplatform.dto.admin.AdminWalletAdjustResponse;
import com.juiceplatform.dto.wallet.AdminCreditRequest;
import com.juiceplatform.dto.wallet.AdminCreditResponse;
import com.juiceplatform.dto.wallet.LedgerEntryResponse;
import com.juiceplatform.dto.wallet.WalletSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WalletService {

    WalletSummaryResponse getWalletSummary(UUID customerId);

    Page<LedgerEntryResponse> getLedgerHistory(UUID customerId, Pageable pageable);

    AdminCreditResponse creditWallet(UUID customerId, AdminCreditRequest request, UUID adminId);

    /**
     * Applies a manual REFUND, ADJUSTMENT, or DEBIT to the customer's wallet.
     * REFUND and ADJUSTMENT increase the balance; DEBIT decreases it.
     */
    AdminWalletAdjustResponse adjustWallet(UUID customerId, AdminWalletAdjustRequest request, UUID adminId);

    /**
     * Sets the customer's wallet to an exact balance by inserting a CREDIT or DEBIT
     * with SYSTEM_ADJUSTMENT sourceType for the delta (BR-WAL-12).
     */
    AdminSetBalanceResponse setWalletBalance(UUID customerId, AdminSetBalanceRequest request, UUID adminId);

    long getCurrentBalance(UUID customerId);
}
