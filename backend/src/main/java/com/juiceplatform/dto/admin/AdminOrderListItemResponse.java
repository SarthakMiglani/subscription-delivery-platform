package com.juiceplatform.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Admin order list item — Domain 10.1 from API spec.
 */
@Getter
@Builder
public class AdminOrderListItemResponse {

    private UUID id;
    private UUID customerId;
    private String customerName;
    private String productName;
    private int quantity;
    private long totalAmountPaise;
    private LocalDate deliveryDate;
    private String status;

    @JsonProperty("isLocked")
    private Boolean isLocked;
}
