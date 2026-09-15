package com.juiceplatform.dto.ingredient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Used as both request (PUT /products/{id}/ingredients) and response body.
 * On requests, ingredientName is ignored. On responses, it is populated.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductIngredientEntry {

    @NotNull
    private UUID ingredientId;

    /** Populated in responses, ignored in requests. */
    private String ingredientName;

    @NotNull
    @Positive
    private BigDecimal quantityPerUnit;

    @NotBlank
    @Size(max = 30)
    private String unit;
}
