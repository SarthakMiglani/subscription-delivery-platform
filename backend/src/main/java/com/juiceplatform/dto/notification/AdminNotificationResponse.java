package com.juiceplatform.dto.notification;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminNotificationResponse {
    private UUID id;
    private String type;
    private UUID customerId;
    private String customerName;
    private String message;
    private Long amountPaise;
    private boolean read;
    private OffsetDateTime createdAt;
}
