package com.juiceplatform.dto.deliverysheet;

import com.juiceplatform.dto.ingredient.IngredientSummaryEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Delivery sheet response matching API spec Domain 13 exactly.
 * ingredientSummary is null for snapshots generated before V108 migration —
 * frontend should treat null as empty list.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverySheetResponse {

    private LocalDate deliveryDate;
    private OffsetDateTime generatedAt;
    private List<DeliverySheetOrderEntry> orders;
    private List<JuiceSummaryEntry> juiceSummary;

    /** Ingredient shopping list for kitchen prep. Null in pre-V108 snapshots. */
    private List<IngredientSummaryEntry> ingredientSummary;

    /**
     * Product names that have orders in this sheet but have no ingredient recipe configured.
     * Shopping list for these products is incomplete. Null in pre-V108 snapshots.
     */
    private List<String> productsWithoutRecipe;
}
