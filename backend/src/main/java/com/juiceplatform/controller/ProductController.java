package com.juiceplatform.controller;

import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.common.PagedResponse;
import com.juiceplatform.dto.common.PaginationMeta;
import com.juiceplatform.dto.product.ProductCustomerResponse;
import com.juiceplatform.security.AuthenticatedUser;
import com.juiceplatform.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springdoc.core.annotations.ParameterObject;

/**
 * Customer-facing product catalogue.
 * Requires a valid CUSTOMER JWT (enforced by SecurityConfig — "/api/v1/products/**"
 * is mapped to hasRole("CUSTOMER"), matching API spec Domain 3's "Auth: Customer JWT").
 * Also requires onboardingComplete=true, per the global onboarding middleware rule
 * (BR-ONB-02) — enforced in ProductServiceImpl.
 */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductCustomerResponse>>> listProducts(
            @ParameterObject Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        Page<ProductCustomerResponse> page = productService.listProductsForCustomer(
                authenticatedUser.getUserId(), pageable);

        PagedResponse<ProductCustomerResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }
}
