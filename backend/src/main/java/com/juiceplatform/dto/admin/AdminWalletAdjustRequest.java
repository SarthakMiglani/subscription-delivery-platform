package com.juiceplatform.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for POST /admin/customers/{id}/wallet/adjust.
 * entryType must be one of: REFUND, ADJUSTMENT, DEBIT.
 */
@Getter
@Setter
@NoArgsConstructor
public class AdminWalletAdjustRequest {

    @NotBlank(message = "entryType is required (REFUND, ADJUSTMENT, or DEBIT)")
    private String entryType;

    @NotNull(message = "amountPaise is required")
    @Min(value = 1, message = "amountPaise must be at least 1")
    private Long amountPaise;

    private String notes;
}
