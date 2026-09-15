package com.juiceplatform.dto.ingredient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientResponse {

    private UUID id;
    private String name;
    private String defaultUnit;
    private OffsetDateTime createdAt;
}
