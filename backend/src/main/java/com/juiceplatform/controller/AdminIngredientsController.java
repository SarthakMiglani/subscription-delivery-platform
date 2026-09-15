package com.juiceplatform.controller;

import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.ingredient.CreateIngredientRequest;
import com.juiceplatform.dto.ingredient.IngredientResponse;
import com.juiceplatform.dto.ingredient.IngredientSummaryEntry;
import com.juiceplatform.dto.ingredient.IngredientsReportResponse;
import com.juiceplatform.dto.ingredient.ProductIngredientEntry;
import com.juiceplatform.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Admin ingredient catalog, product recipe, and shopping list report endpoints.
 *
 * GET  /api/v1/admin/ingredients                          — list all ingredients
 * POST /api/v1/admin/ingredients                          — create ingredient
 * DEL  /api/v1/admin/ingredients/{id}                    — delete ingredient (RESTRICT if in use)
 * GET  /api/v1/admin/products/{productId}/ingredients    — get product recipe
 * PUT  /api/v1/admin/products/{productId}/ingredients    — set/replace product recipe
 * GET  /api/v1/admin/ingredients-report?targetDate=DATE  — live shopping list (LOCKED orders)
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminIngredientsController {

    private final IngredientService ingredientService;

    // ─── Ingredient Catalog ──────────────────────────────────────────────────────

    @GetMapping("/ingredients")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> listIngredients() {
        return ResponseEntity.ok(ApiResponse.success(ingredientService.listIngredients()));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<ApiResponse<IngredientResponse>> createIngredient(
            @RequestBody @Valid CreateIngredientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ingredientService.createIngredient(request)));
    }

    @DeleteMapping("/ingredients/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIngredient(@PathVariable UUID id) {
        ingredientService.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Product Recipe ──────────────────────────────────────────────────────────

    @GetMapping("/products/{productId}/ingredients")
    public ResponseEntity<ApiResponse<List<ProductIngredientEntry>>> getProductRecipe(
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(ingredientService.getProductRecipe(productId)));
    }

    @PutMapping("/products/{productId}/ingredients")
    public ResponseEntity<ApiResponse<List<ProductIngredientEntry>>> setProductRecipe(
            @PathVariable UUID productId,
            @RequestBody @Valid List<ProductIngredientEntry> entries) {
        return ResponseEntity.ok(ApiResponse.success(ingredientService.setProductRecipe(productId, entries)));
    }

    // ─── Shopping List Report ────────────────────────────────────────────────────

    @GetMapping("/ingredients-report")
    public ResponseEntity<ApiResponse<IngredientsReportResponse>> getIngredientsReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {
        return ResponseEntity.ok(ApiResponse.success(ingredientService.getIngredientsReport(targetDate)));
    }
}
