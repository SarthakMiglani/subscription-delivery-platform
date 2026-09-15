package com.juiceplatform.dto.admin;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Request body for PATCH /admin/subscriptions/{id}.
 * All fields are optional — only non-null fields are applied.
 */
@Getter
@Setter
@NoArgsConstructor
public class AdminSubscriptionOverrideRequest {

    /** Target status: ACTIVE, PAUSED, or CANCELLED. */
    private String status;

    @Min(value = 1, message = "quantity must be at least 1")
    private Integer quantity;

    private UUID productId;

    private String notes;
}
