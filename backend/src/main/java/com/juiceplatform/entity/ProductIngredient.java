package com.juiceplatform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductIngredient {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "ingredient_id", nullable = false)
    private UUID ingredientId;

    @Column(name = "quantity_per_unit", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantityPerUnit;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        this.createdAt = OffsetDateTime.now();
    }
}
