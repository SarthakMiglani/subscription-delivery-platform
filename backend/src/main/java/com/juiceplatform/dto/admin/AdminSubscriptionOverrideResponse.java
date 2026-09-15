package com.juiceplatform.dto.admin;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminSubscriptionOverrideResponse {

    private UUID id;
    private UUID customerId;
    private UUID productId;
    private String productName;
    private int quantity;
    private String status;
    private LocalDate effectiveStartDate;
    private OffsetDateTime updatedAt;
}
