package com.juiceplatform.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for POST /admin/customers/{id}/wallet/set-balance.
 * Computes a delta and inserts a single CREDIT or DEBIT SYSTEM_ADJUSTMENT entry.
 */
@Getter
@Setter
@NoArgsConstructor
public class AdminSetBalanceRequest {

    @NotNull(message = "newBalancePaise is required")
    @Min(value = 0, message = "newBalancePaise must be non-negative")
    private Long newBalancePaise;

    @NotBlank(message = "reason is required")
    private String reason;
}
