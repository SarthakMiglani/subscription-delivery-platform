package com.juiceplatform.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminCustomerDetailResponse {

    private UUID id;
    private String name;
    private String email;
    private String phone;

    /**
     * Use Boolean (boxed) so Lombok generates getIsActive() → Jackson serializes as "isActive".
     * Primitive boolean would generate isActive() → Jackson strips "is" → serializes as "active".
     */
    @JsonProperty("isActive")
    private Boolean isActive;

    private Boolean onboardingComplete;
    private AddressDto address;
    private long walletBalancePaise;
    private OffsetDateTime createdAt;

    @Getter
    @Builder
    public static class AddressDto {
        private UUID id;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
        private String deliveryNotes;
    }
}
