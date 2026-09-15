package com.juiceplatform.service;

import com.juiceplatform.dto.customer.CustomerProfileResponse;
import com.juiceplatform.dto.customer.UpdateAddressRequest;
import com.juiceplatform.dto.customer.UpdateAddressResponse;

import java.util.UUID;

public interface CustomerService {

    /**
     * Returns the authenticated customer's full profile including address and wallet summary.
     */
    CustomerProfileResponse getProfile(UUID customerId);

    /**
     * Updates the customer's delivery address immediately.
     * No cutoff rule applies — changes take effect at once.
     * Existing order address snapshots are NOT modified.
     */
    UpdateAddressResponse updateAddress(UUID customerId, UpdateAddressRequest request);

    /**
     * Updates the customer's profile details.
     */
    CustomerProfileResponse updateProfile(UUID customerId, com.juiceplatform.dto.customer.UpdateProfileRequest request);
}
