package com.juiceplatform.service;

import com.juiceplatform.dto.admin.AdminCustomerDetailResponse;
import com.juiceplatform.dto.admin.AdminCustomerListItemResponse;
import com.juiceplatform.dto.admin.AdminCustomerStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminCustomerService {

    Page<AdminCustomerListItemResponse> listCustomers(String search, Pageable pageable);

    AdminCustomerDetailResponse getCustomerDetail(UUID customerId);

    AdminCustomerStatusResponse deactivateCustomer(UUID customerId, UUID adminId);

    AdminCustomerStatusResponse reactivateCustomer(UUID customerId, UUID adminId);
}
