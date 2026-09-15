package com.juiceplatform.dto.admin;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminWalletAdjustResponse {

    private UUID ledgerEntryId;
    private String entryType;
    private String sourceType;
    private long amountPaise;
    private long newBalancePaise;
    private String notes;
    private OffsetDateTime adjustedAt;
}
