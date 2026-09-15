package com.juiceplatform.controller;

import com.juiceplatform.dto.admin.AdminOrderListItemResponse;
import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.common.PagedResponse;
import com.juiceplatform.dto.common.PaginationMeta;
import com.juiceplatform.dto.delivery.MarkDeliveredResponse;
import com.juiceplatform.dto.delivery.MarkSkippedRequest;
import com.juiceplatform.dto.delivery.MarkSkippedResponse;
import com.juiceplatform.dto.delivery.OrderCorrectionRequest;
import com.juiceplatform.dto.delivery.OrderCorrectionResponse;
import com.juiceplatform.security.AuthenticatedUser;
import com.juiceplatform.service.AdminOrderQueryService;
import com.juiceplatform.service.DeliveryService;
import com.juiceplatform.service.OrderCorrectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final DeliveryService deliveryService;
    private final OrderCorrectionService orderCorrectionService;
    private final AdminOrderQueryService adminOrderQueryService;

    /**
     * GET /api/v1/admin/orders — Domain 10.1 from API spec.
     * Cross-customer order listing with optional filters: customerId, status,
     * deliveryDate, fromDate, toDate. All filters are optional and combinable.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminOrderListItemResponse>>> listOrders(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deliveryDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @ParameterObject Pageable pageable) {

        Page<AdminOrderListItemResponse> page = adminOrderQueryService.listOrders(
                customerId, status, deliveryDate, fromDate, toDate, pageable);

        PagedResponse<AdminOrderListItemResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<ApiResponse<MarkDeliveredResponse>> markDelivered(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        MarkDeliveredResponse response = deliveryService.markDelivered(id, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<ApiResponse<MarkSkippedResponse>> markSkipped(
            @PathVariable UUID id,
            @RequestBody @Valid MarkSkippedRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        MarkSkippedResponse response = deliveryService.markSkipped(
                id, request.getSkipReason(), authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderCorrectionResponse>> correctOrder(
            @PathVariable UUID id,
            @RequestBody @Valid OrderCorrectionRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {

        OrderCorrectionResponse response = orderCorrectionService.correctOrder(
                id, request, authenticatedUser.getUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
