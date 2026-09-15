package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminSubscriptionListItemResponse;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideRequest;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminSubscriptionService {

    Page<AdminSubscriptionListItemResponse> listSubscriptions(String status, Pageable pageable);

    AdminSubscriptionOverrideResponse overrideSubscription(UUID subscriptionId,
                                                            AdminSubscriptionOverrideRequest request,
                                                            UUID adminId);
}
