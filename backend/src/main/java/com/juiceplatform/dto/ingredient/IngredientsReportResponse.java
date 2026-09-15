package com.juiceplatform.dto.ingredient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Live ingredients shopping list for a given delivery date,
 * computed from LOCKED orders.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientsReportResponse {

    private LocalDate targetDate;
    private List<IngredientSummaryEntry> ingredients;

    /**
     * Product names that have LOCKED orders for the date but have no recipe configured.
     * These products contribute zero ingredients — admin should be aware.
     */
    private List<String> productsWithoutRecipe;
}
