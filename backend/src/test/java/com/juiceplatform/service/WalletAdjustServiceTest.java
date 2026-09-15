package com.juiceplatform.service;

import com.juiceplatform.AbstractIntegrationTest;
import com.juiceplatform.TestDataFactory;
import com.juiceplatform.dto.admin.AdminSetBalanceRequest;
import com.juiceplatform.dto.admin.AdminSetBalanceResponse;
import com.juiceplatform.dto.admin.AdminWalletAdjustRequest;
import com.juiceplatform.dto.admin.AdminWalletAdjustResponse;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class WalletAdjustServiceTest extends AbstractIntegrationTest {

    @Autowired WalletService walletService;
    @Autowired TestDataFactory factory;

    User customer;
    User admin;

    @BeforeEach
    void setUp() {
        customer = factory.createCustomer();
        admin = factory.createAdmin();
        // Seed initial balance of ₹500 (50000 paise)
        factory.creditWallet(customer.getId(), 50_000L, admin.getId());
    }

    // ── adjustWallet: REFUND ──────────────────────────────────────────────────

    @Test
    void adjustWallet_refund_increasesBalance() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("REFUND");
        request.setAmountPaise(10_000L);
        request.setNotes("Refund for damaged delivery");

        AdminWalletAdjustResponse response = walletService.adjustWallet(customer.getId(), request, admin.getId());

        assertThat(response.getEntryType()).isEqualTo("REFUND");
        assertThat(response.getSourceType()).isEqualTo("REFUND");
        assertThat(response.getNewBalancePaise()).isEqualTo(60_000L);
        assertThat(response.getAmountPaise()).isEqualTo(10_000L);
        assertThat(response.getAdjustedAt()).isNotNull();
        assertThat(walletService.getCurrentBalance(customer.getId())).isEqualTo(60_000L);
    }

    // ── adjustWallet: ADJUSTMENT ──────────────────────────────────────────────

    @Test
    void adjustWallet_adjustment_increasesBalance() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("ADJUSTMENT");
        request.setAmountPaise(5_000L);

        AdminWalletAdjustResponse response = walletService.adjustWallet(customer.getId(), request, admin.getId());

        assertThat(response.getEntryType()).isEqualTo("ADJUSTMENT");
        assertThat(response.getSourceType()).isEqualTo("MANUAL_ADJUSTMENT");
        assertThat(response.getNewBalancePaise()).isEqualTo(55_000L);
    }

    // ── adjustWallet: DEBIT ───────────────────────────────────────────────────

    @Test
    void adjustWallet_debit_decreasesBalance() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("DEBIT");
        request.setAmountPaise(20_000L);

        AdminWalletAdjustResponse response = walletService.adjustWallet(customer.getId(), request, admin.getId());

        assertThat(response.getEntryType()).isEqualTo("DEBIT");
        assertThat(response.getSourceType()).isEqualTo("MANUAL_DEBIT");
        assertThat(response.getNewBalancePaise()).isEqualTo(30_000L);
    }

    @Test
    void adjustWallet_debit_exceedsBalance_throws400() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("DEBIT");
        request.setAmountPaise(100_000L); // more than 50000 balance

        assertThatThrownBy(() -> walletService.adjustWallet(customer.getId(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INSUFFICIENT_BALANCE");
    }

    @Test
    void adjustWallet_caseInsensitiveEntryType() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("refund"); // lowercase
        request.setAmountPaise(1_000L);

        AdminWalletAdjustResponse response = walletService.adjustWallet(customer.getId(), request, admin.getId());
        assertThat(response.getEntryType()).isEqualTo("REFUND");
    }

    @Test
    void adjustWallet_invalidEntryType_throws400() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("CREDIT"); // not allowed via adjust endpoint
        request.setAmountPaise(1_000L);

        assertThatThrownBy(() -> walletService.adjustWallet(customer.getId(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_ENTRY_TYPE");
    }

    @Test
    void adjustWallet_unknownCustomer_throws404() {
        AdminWalletAdjustRequest request = new AdminWalletAdjustRequest();
        request.setEntryType("REFUND");
        request.setAmountPaise(1_000L);

        assertThatThrownBy(() -> walletService.adjustWallet(UUID.randomUUID(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("RESOURCE_NOT_FOUND");
    }

    // ── setWalletBalance ──────────────────────────────────────────────────────

    @Test
    void setWalletBalance_increaseBalance_insertsCreditEntry() {
        AdminSetBalanceRequest request = new AdminSetBalanceRequest();
        request.setNewBalancePaise(80_000L);
        request.setReason("Promotional top-up");

        AdminSetBalanceResponse response = walletService.setWalletBalance(customer.getId(), request, admin.getId());

        assertThat(response.getEntryType()).isEqualTo("CREDIT");
        assertThat(response.getSourceType()).isEqualTo("SYSTEM_ADJUSTMENT");
        assertThat(response.getAmountPaise()).isEqualTo(30_000L); // delta = 80000 - 50000
        assertThat(response.getNewBalancePaise()).isEqualTo(80_000L);
        assertThat(response.getReason()).isEqualTo("Promotional top-up");
        assertThat(response.getSetAt()).isNotNull();
        assertThat(walletService.getCurrentBalance(customer.getId())).isEqualTo(80_000L);
    }

    @Test
    void setWalletBalance_decreaseBalance_insertsDebitEntry() {
        AdminSetBalanceRequest request = new AdminSetBalanceRequest();
        request.setNewBalancePaise(20_000L);
        request.setReason("Correction for overbilling");

        AdminSetBalanceResponse response = walletService.setWalletBalance(customer.getId(), request, admin.getId());

        assertThat(response.getEntryType()).isEqualTo("DEBIT");
        assertThat(response.getSourceType()).isEqualTo("SYSTEM_ADJUSTMENT");
        assertThat(response.getAmountPaise()).isEqualTo(30_000L); // delta = 50000 - 20000
        assertThat(response.getNewBalancePaise()).isEqualTo(20_000L);
    }

    @Test
    void setWalletBalance_sameBalance_throws400() {
        AdminSetBalanceRequest request = new AdminSetBalanceRequest();
        request.setNewBalancePaise(50_000L); // same as current
        request.setReason("No change");

        assertThatThrownBy(() -> walletService.setWalletBalance(customer.getId(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("NO_CHANGE");
    }

    @Test
    void setWalletBalance_zeroBalance_clearsBalance() {
        AdminSetBalanceRequest request = new AdminSetBalanceRequest();
        request.setNewBalancePaise(0L);
        request.setReason("Full deduction");

        AdminSetBalanceResponse response = walletService.setWalletBalance(customer.getId(), request, admin.getId());

        assertThat(response.getNewBalancePaise()).isZero();
        assertThat(walletService.getCurrentBalance(customer.getId())).isZero();
    }

    @Test
    void setWalletBalance_unknownCustomer_throws404() {
        AdminSetBalanceRequest request = new AdminSetBalanceRequest();
        request.setNewBalancePaise(10_000L);
        request.setReason("Test");

        assertThatThrownBy(() -> walletService.setWalletBalance(UUID.randomUUID(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("RESOURCE_NOT_FOUND");
    }
}
