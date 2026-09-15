package com.juiceplatform.controller;

import com.juiceplatform.dto.admin.AdminSubscriptionListItemResponse;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideRequest;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideResponse;
import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.common.PagedResponse;
import com.juiceplatform.dto.common.PaginationMeta;
import com.juiceplatform.security.AuthenticatedUser;
import com.juiceplatform.service.AdminSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Admin subscription management endpoints.
 * Overrides bypass the 10 PM cutoff and apply immediately (admin privilege).
 * All /api/v1/admin/** routes are secured to ROLE_ADMIN by SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@RequiredArgsConstructor
public class AdminSubscriptionController {

    private final AdminSubscriptionService adminSubscriptionService;

    /**
     * GET /api/v1/admin/subscriptions?status=&page=&size=
     * Returns paginated list of all subscriptions across all customers.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminSubscriptionListItemResponse>>> listSubscriptions(
            @RequestParam(required = false) String status,
            @ParameterObject Pageable pageable) {

        Page<AdminSubscriptionListItemResponse> page =
                adminSubscriptionService.listSubscriptions(status, pageable);

        PagedResponse<AdminSubscriptionListItemResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }

    /**
     * PATCH /api/v1/admin/subscriptions/{id}
     * Admin override — directly mutates status, quantity, and/or product.
     * Bypasses the 10 PM cutoff. Cancels future SCHEDULED orders on PAUSED/CANCELLED transitions.
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminSubscriptionOverrideResponse>> overrideSubscription(
            @PathVariable UUID id,
            @RequestBody @Valid AdminSubscriptionOverrideRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        AdminSubscriptionOverrideResponse response = adminSubscriptionService.overrideSubscription(
                id, request, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
