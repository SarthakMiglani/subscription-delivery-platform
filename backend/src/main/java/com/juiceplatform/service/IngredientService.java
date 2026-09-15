package com.juiceplatform.service;

import com.juiceplatform.dto.ingredient.CreateIngredientRequest;
import com.juiceplatform.dto.ingredient.IngredientResponse;
import com.juiceplatform.dto.ingredient.IngredientSummaryEntry;
import com.juiceplatform.dto.ingredient.IngredientsReportResponse;
import com.juiceplatform.dto.ingredient.ProductIngredientEntry;
import com.juiceplatform.entity.Ingredient;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.ProductIngredient;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.IngredientRepository;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.ProductIngredientRepository;
import com.juiceplatform.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    // ─── Ingredient Catalog ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<IngredientResponse> listIngredients() {
        return ingredientRepository.findAll().stream()
                .sorted(Comparator.comparing(Ingredient::getName))
                .map(i -> IngredientResponse.builder()
                        .id(i.getId())
                        .name(i.getName())
                        .defaultUnit(i.getDefaultUnit())
                        .createdAt(i.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public IngredientResponse createIngredient(CreateIngredientRequest request) {
        ingredientRepository.findByNameIgnoreCase(request.getName().trim())
                .ifPresent(existing -> {
                    throw new BusinessException("DUPLICATE_INGREDIENT",
                            "Ingredient '" + existing.getName() + "' already exists", HttpStatus.CONFLICT);
                });

        Ingredient ingredient = new Ingredient();
        ingredient.setName(request.getName().trim());
        ingredient.setDefaultUnit(request.getDefaultUnit().trim());
        Ingredient saved = ingredientRepository.save(ingredient);

        return IngredientResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .defaultUnit(saved.getDefaultUnit())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteIngredient(UUID id) {
        ingredientRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Ingredient not found", HttpStatus.NOT_FOUND));

        if (productIngredientRepository.existsByIngredientId(id)) {
            throw new BusinessException("INGREDIENT_IN_USE",
                    "This ingredient is used in one or more product recipes. Remove it from all recipes before deleting.",
                    HttpStatus.CONFLICT);
        }

        ingredientRepository.deleteById(id);
    }

    // ─── Product Recipe ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProductIngredientEntry> getProductRecipe(UUID productId) {
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Product not found", HttpStatus.NOT_FOUND));

        List<ProductIngredient> pis = productIngredientRepository.findByProductId(productId);
        if (pis.isEmpty()) {
            return List.of();
        }

        List<UUID> ingIds = pis.stream().map(ProductIngredient::getIngredientId).collect(Collectors.toList());
        Map<UUID, Ingredient> ingMap = ingredientRepository.findAllById(ingIds)
                .stream().collect(Collectors.toMap(Ingredient::getId, i -> i));

        return pis.stream()
                .map(pi -> ProductIngredientEntry.builder()
                        .ingredientId(pi.getIngredientId())
                        .ingredientName(ingMap.containsKey(pi.getIngredientId())
                                ? ingMap.get(pi.getIngredientId()).getName() : null)
                        .quantityPerUnit(pi.getQuantityPerUnit())
                        .unit(pi.getUnit())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ProductIngredientEntry> setProductRecipe(UUID productId, List<ProductIngredientEntry> entries) {
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND",
                        "Product not found", HttpStatus.NOT_FOUND));

        // Validate all referenced ingredients exist
        if (!entries.isEmpty()) {
            List<UUID> ingIds = entries.stream().map(ProductIngredientEntry::getIngredientId).collect(Collectors.toList());
            Map<UUID, Ingredient> ingMap = ingredientRepository.findAllById(ingIds)
                    .stream().collect(Collectors.toMap(Ingredient::getId, i -> i));

            for (UUID ingId : ingIds) {
                if (!ingMap.containsKey(ingId)) {
                    throw new BusinessException("RESOURCE_NOT_FOUND",
                            "Ingredient " + ingId + " not found", HttpStatus.NOT_FOUND);
                }
            }
        }

        // Atomic replace: bulk delete then insert
        productIngredientRepository.deleteByProductId(productId);
        productIngredientRepository.flush();

        if (!entries.isEmpty()) {
            List<ProductIngredient> newPis = entries.stream().map(e -> {
                ProductIngredient pi = new ProductIngredient();
                pi.setProductId(productId);
                pi.setIngredientId(e.getIngredientId());
                pi.setQuantityPerUnit(e.getQuantityPerUnit());
                pi.setUnit(e.getUnit());
                return pi;
            }).collect(Collectors.toList());

            productIngredientRepository.saveAll(newPis);
        }

        return getProductRecipe(productId);
    }

    // ─── Ingredient Aggregation ──────────────────────────────────────────────────

    /**
     * Computes the ingredient shopping list from a list of orders.
     * Aggregates by (ingredientId, unit) — so "orange, pieces" and "orange, kg" are separate lines.
     * Products without a configured recipe contribute nothing and are tracked in productsWithoutRecipe.
     * <p>
     * Called from:
     * - {@link DeliverySheetService} during snapshot generation (passes filtered LOCKED orders)
     * - {@link #getIngredientsReport(LocalDate)} for the live admin report endpoint
     */
    @Transactional(readOnly = true)
    public IngredientComputeResult computeIngredientSummary(List<Order> orders) {
        if (orders.isEmpty()) {
            return new IngredientComputeResult(List.of(), List.of());
        }

        // Sum quantities by product
        Map<UUID, Integer> qtyByProduct = new LinkedHashMap<>();
        for (Order order : orders) {
            qtyByProduct.merge(order.getProductId(), order.getQuantity(), Integer::sum);
        }

        // Batch-fetch product names for warning messages
        Map<UUID, String> productNames = productRepository.findAllById(qtyByProduct.keySet())
                .stream().collect(Collectors.toMap(Product::getId, Product::getName));

        // Fetch recipes for all products
        List<UUID> productIds = new ArrayList<>(qtyByProduct.keySet());
        Map<UUID, List<ProductIngredient>> pisByProduct = new HashMap<>();
        for (UUID pid : productIds) {
            pisByProduct.put(pid, productIngredientRepository.findByProductId(pid));
        }

        // Products with orders but no recipe — surface as a warning
        List<String> productsWithoutRecipe = productIds.stream()
                .filter(pid -> pisByProduct.getOrDefault(pid, List.of()).isEmpty())
                .map(pid -> productNames.getOrDefault(pid, pid.toString()))
                .sorted()
                .collect(Collectors.toList());

        // Collect unique ingredient IDs across all recipes
        List<UUID> allIngIds = pisByProduct.values().stream()
                .flatMap(List::stream)
                .map(ProductIngredient::getIngredientId)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, Ingredient> ingMap = ingredientRepository.findAllById(allIngIds)
                .stream().collect(Collectors.toMap(Ingredient::getId, i -> i));

        // Aggregate: (ingredientId, unit) → total quantity
        record AggKey(UUID ingredientId, String unit) {}
        Map<AggKey, BigDecimal> totals = new LinkedHashMap<>();

        for (UUID pid : productIds) {
            int orderQty = qtyByProduct.getOrDefault(pid, 0);
            for (ProductIngredient pi : pisByProduct.getOrDefault(pid, List.of())) {
                AggKey key = new AggKey(pi.getIngredientId(), pi.getUnit());
                BigDecimal contrib = pi.getQuantityPerUnit().multiply(BigDecimal.valueOf(orderQty));
                totals.merge(key, contrib, BigDecimal::add);
            }
        }

        List<IngredientSummaryEntry> summaryEntries = totals.entrySet().stream()
                .map(e -> {
                    Ingredient ing = ingMap.get(e.getKey().ingredientId());
                    return IngredientSummaryEntry.builder()
                            .ingredientId(e.getKey().ingredientId())
                            .ingredientName(ing != null ? ing.getName() : e.getKey().ingredientId().toString())
                            .totalQuantity(e.getValue())
                            .unit(e.getKey().unit())
                            .build();
                })
                .sorted(Comparator.comparing(IngredientSummaryEntry::getIngredientName))
                .collect(Collectors.toList());

        return new IngredientComputeResult(summaryEntries, productsWithoutRecipe);
    }

    // ─── Live Report Endpoint ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public IngredientsReportResponse getIngredientsReport(LocalDate targetDate) {
        List<Order> lockedOrders = orderRepository.findByDeliveryDateAndStatus(
                targetDate, Order.OrderStatus.LOCKED);

        IngredientComputeResult result = computeIngredientSummary(lockedOrders);

        return IngredientsReportResponse.builder()
                .targetDate(targetDate)
                .ingredients(result.entries())
                .productsWithoutRecipe(result.productsWithoutRecipe())
                .build();
    }

    // ─── Inner Result Type ───────────────────────────────────────────────────────

    public record IngredientComputeResult(
            List<IngredientSummaryEntry> entries,
            List<String> productsWithoutRecipe
    ) {}
}
