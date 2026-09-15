package com.juiceplatform.dto.deliverysheet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * One order entry in the delivery sheet.
 * Matches the API spec Domain 13 response format exactly.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverySheetOrderEntry {

    private UUID orderId;
    private String customerName;
    private String phone;
    private String address;
    private String deliveryNotes;
    private String productName;
    private int quantity;

    /**
     * Live delivery record status at snapshot generation time.
     * PENDING = not yet acted on; DELIVERED / SKIPPED / CANCELLED = already actioned.
     * Null in pre-V109 snapshots — frontend should treat null as PENDING.
     */
    private String deliveryStatus;
}
