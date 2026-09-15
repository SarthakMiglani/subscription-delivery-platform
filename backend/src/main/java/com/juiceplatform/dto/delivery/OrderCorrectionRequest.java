package com.juiceplatform.dto.delivery;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OrderCorrectionRequest {

    /**
     * Target order status. Optional — if omitted, the order's status is left unchanged
     * and only a quantity/product data correction (see below) is applied.
     */
    private String status;

    private String skipReason;

    private Boolean isSystemError;

    private String notes;

    private String cancellationComment;

    /**
     * BR-HIS-05: admin data correction for quantity on a LOCKED order (pre-delivery).
     * When set, unitPricePaise/totalAmountPaise are recalculated: quantity-only edits
     * reuse the order's existing historical unitPricePaise.
     * Only permitted when the order is currently LOCKED and no status transition is
     * requested in the same call (status must be omitted or equal to "LOCKED").
     */
    @Positive
    private Integer quantity;

    /**
     * BR-HIS-05: admin data correction for product on a LOCKED order (pre-delivery).
     * When set, unitPricePaise is taken from the new product's current price and
     * totalAmountPaise is recalculated. Same eligibility rules as {@link #quantity}.
     */
    private UUID productId;
}
