package com.juiceplatform.repository;

import com.juiceplatform.entity.ProductIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, UUID> {

    List<ProductIngredient> findByProductId(UUID productId);

    boolean existsByIngredientId(UUID ingredientId);

    @Modifying
    @Query("DELETE FROM ProductIngredient pi WHERE pi.productId = :productId")
    void deleteByProductId(@Param("productId") UUID productId);
}
