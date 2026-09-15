package com.juiceplatform.service;

import com.juiceplatform.dto.product.CreateProductRequest;
import com.juiceplatform.dto.product.DisableProductResponse;
import com.juiceplatform.dto.product.EnableProductResponse;
import com.juiceplatform.dto.product.ProductCustomerResponse;
import com.juiceplatform.dto.product.ProductResponse;
import com.juiceplatform.dto.product.UpdateProductRequest;
import com.juiceplatform.dto.product.UpdateProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    /**
     * Lists enabled products for the customer catalogue.
     * Requires the customer to have completed onboarding (BR-ONB-02) —
     * throws 403 ONBOARDING_INCOMPLETE otherwise.
     */
    Page<ProductCustomerResponse> listProductsForCustomer(UUID customerId, Pageable pageable);

    Page<ProductResponse> listProductsForAdmin(Boolean isAvailable, Pageable pageable);

    ProductResponse createProduct(CreateProductRequest request, UUID adminId);

    UpdateProductResponse updateProduct(UUID productId, UpdateProductRequest request, UUID adminId);

    DisableProductResponse disableProduct(UUID productId, UUID adminId);

    EnableProductResponse enableProduct(UUID productId, UUID adminId);
}
