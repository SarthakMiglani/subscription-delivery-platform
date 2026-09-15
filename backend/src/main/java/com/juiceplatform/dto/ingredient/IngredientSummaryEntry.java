package com.juiceplatform.dto.ingredient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * One line in the ingredient shopping list — total quantity of a single ingredient
 * needed across all orders for the target delivery date.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientSummaryEntry {

    private UUID ingredientId;
    private String ingredientName;
    private BigDecimal totalQuantity;
    private String unit;
}
