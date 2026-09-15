package com.juiceplatform.controller;

import com.juiceplatform.dto.admin.AdminCustomerDetailResponse;
import com.juiceplatform.dto.admin.AdminCustomerListItemResponse;
import com.juiceplatform.dto.admin.AdminCustomerStatusResponse;
import com.juiceplatform.dto.admin.AdminSetBalanceRequest;
import com.juiceplatform.dto.admin.AdminSetBalanceResponse;
import com.juiceplatform.dto.admin.AdminWalletAdjustRequest;
import com.juiceplatform.dto.admin.AdminWalletAdjustResponse;
import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.common.PagedResponse;
import com.juiceplatform.dto.common.PaginationMeta;
import com.juiceplatform.dto.wallet.LedgerEntryResponse;
import com.juiceplatform.security.AuthenticatedUser;
import com.juiceplatform.service.AdminCustomerService;
import com.juiceplatform.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Admin customer management endpoints.
 * NOTE: POST /{customerId}/wallet/credit is handled by AdminWalletController (existing).
 * All /api/v1/admin/** routes are secured to ROLE_ADMIN by SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;
    private final WalletService walletService;

    /**
     * GET /api/v1/admin/customers?search=&page=&size=
     * Returns paginated list of all customers with wallet balance and subscription count.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminCustomerListItemResponse>>> listCustomers(
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {

        Page<AdminCustomerListItemResponse> page = adminCustomerService.listCustomers(search, pageable);

        PagedResponse<AdminCustomerListItemResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }

    /**
     * GET /api/v1/admin/customers/{customerId}
     * Returns full customer detail including address and wallet balance.
     */
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<AdminCustomerDetailResponse>> getCustomerDetail(
            @PathVariable UUID customerId) {

        AdminCustomerDetailResponse response = adminCustomerService.getCustomerDetail(customerId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/admin/customers/{customerId}/wallet/ledger?page=&size=
     * Returns paginated wallet transaction history for a customer.
     */
    @GetMapping("/{customerId}/wallet/ledger")
    public ResponseEntity<ApiResponse<PagedResponse<LedgerEntryResponse>>> getWalletLedger(
            @PathVariable UUID customerId,
            @ParameterObject Pageable pageable) {

        Page<LedgerEntryResponse> page = walletService.getLedgerHistory(customerId, pageable);

        PagedResponse<LedgerEntryResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }

    /**
     * POST /api/v1/admin/customers/{customerId}/deactivate
     * Deactivates the customer and auto-pauses all active subscriptions.
     * No request body — Spring MVC requires no @RequestBody annotation.
     */
    @PostMapping("/{customerId}/deactivate")
    public ResponseEntity<ApiResponse<AdminCustomerStatusResponse>> deactivateCustomer(
            @PathVariable UUID customerId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        AdminCustomerStatusResponse response = adminCustomerService.deactivateCustomer(
                customerId, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/admin/customers/{customerId}/reactivate
     * Reactivates the customer and restores CUSTOMER_DEACTIVATED paused subscriptions.
     * No request body.
     */
    @PostMapping("/{customerId}/reactivate")
    public ResponseEntity<ApiResponse<AdminCustomerStatusResponse>> reactivateCustomer(
            @PathVariable UUID customerId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        AdminCustomerStatusResponse response = adminCustomerService.reactivateCustomer(
                customerId, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/admin/customers/{customerId}/wallet/adjust
     * Applies a REFUND, ADJUSTMENT, or DEBIT entry to the customer's wallet.
     */
    @PostMapping("/{customerId}/wallet/adjust")
    public ResponseEntity<ApiResponse<AdminWalletAdjustResponse>> adjustWallet(
            @PathVariable UUID customerId,
            @RequestBody @Valid AdminWalletAdjustRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        AdminWalletAdjustResponse response = walletService.adjustWallet(
                customerId, request, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/admin/customers/{customerId}/wallet/set-balance
     * Sets the customer's wallet to an exact target balance via a delta CREDIT or DEBIT.
     */
    @PostMapping("/{customerId}/wallet/set-balance")
    public ResponseEntity<ApiResponse<AdminSetBalanceResponse>> setWalletBalance(
            @PathVariable UUID customerId,
            @RequestBody @Valid AdminSetBalanceRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        AdminSetBalanceResponse response = walletService.setWalletBalance(
                customerId, request, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
