package com.juiceplatform.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminCustomerListItemResponse {

    private UUID id;
    private String name;
    private String email;
    private String phone;

    /**
     * Use @JsonProperty to ensure serialization as "isActive".
     * Lombok generates isActive() for boolean fields, which Jackson strips to "active".
     * Using Boolean (boxed) here so Lombok generates getIsActive() → serialized as "isActive".
     */
    @JsonProperty("isActive")
    private Boolean isActive;

    private Boolean onboardingComplete;
    private long walletBalancePaise;
    private long activeSubscriptionCount;
    private OffsetDateTime createdAt;
}
