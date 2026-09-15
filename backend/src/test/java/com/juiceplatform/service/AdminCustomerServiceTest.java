package com.juiceplatform.service;

import com.juiceplatform.AbstractIntegrationTest;
import com.juiceplatform.TestDataFactory;
import com.juiceplatform.dto.admin.AdminCustomerDetailResponse;
import com.juiceplatform.dto.admin.AdminCustomerListItemResponse;
import com.juiceplatform.dto.admin.AdminCustomerStatusResponse;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.Subscription;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.SubscriptionRepository;
import com.juiceplatform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AdminCustomerServiceTest extends AbstractIntegrationTest {

    @Autowired AdminCustomerService adminCustomerService;
    @Autowired TestDataFactory factory;
    @Autowired UserRepository userRepository;
    @Autowired SubscriptionRepository subscriptionRepository;

    User customer;
    User admin;

    @BeforeEach
    void setUp() {
        customer = factory.createCustomer();
        admin = factory.createAdmin();
        factory.createAddress(customer.getId());
        factory.creditWallet(customer.getId(), 50_000L, admin.getId());
    }

    // ── listCustomers ─────────────────────────────────────────────────────────

    @Test
    void listCustomers_noSearch_returnsCustomersOnly() {
        Page<AdminCustomerListItemResponse> page =
                adminCustomerService.listCustomers(null, PageRequest.of(0, 20));

        assertThat(page.getContent())
                .extracting(AdminCustomerListItemResponse::getId)
                .contains(customer.getId());

        // Admin users must not appear in the customer list
        assertThat(page.getContent())
                .extracting(AdminCustomerListItemResponse::getId)
                .doesNotContain(admin.getId());
    }

    @Test
    void listCustomers_searchByName_filtersResults() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User named = factory.createCustomer();
        named.setName("ZSpecial_" + uniqueSuffix);
        userRepository.save(named);

        Page<AdminCustomerListItemResponse> page =
                adminCustomerService.listCustomers("ZSpecial_" + uniqueSuffix, PageRequest.of(0, 20));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getId()).isEqualTo(named.getId());
    }

    @Test
    void listCustomers_searchByEmail_filtersResults() {
        Page<AdminCustomerListItemResponse> page =
                adminCustomerService.listCustomers(customer.getEmail(), PageRequest.of(0, 20));

        assertThat(page.getContent()).isNotEmpty();
        assertThat(page.getContent()).allMatch(c -> c.getId().equals(customer.getId()));
    }

    @Test
    void listCustomers_walletBalancePopulated() {
        Page<AdminCustomerListItemResponse> page =
                adminCustomerService.listCustomers(customer.getEmail(), PageRequest.of(0, 20));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getWalletBalancePaise()).isEqualTo(50_000L);
    }

    @Test
    void listCustomers_activeSubscriptionCount_countedCorrectly() {
        Product product = factory.createProduct(2500L);
        factory.createActiveSubscription(customer.getId(), product.getId(), 1);

        Page<AdminCustomerListItemResponse> page =
                adminCustomerService.listCustomers(customer.getEmail(), PageRequest.of(0, 20));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getActiveSubscriptionCount()).isEqualTo(1L);
    }

    // ── getCustomerDetail ─────────────────────────────────────────────────────

    @Test
    void getCustomerDetail_returnsProfileWithAddress() {
        AdminCustomerDetailResponse detail = adminCustomerService.getCustomerDetail(customer.getId());

        assertThat(detail.getId()).isEqualTo(customer.getId());
        assertThat(detail.getName()).isEqualTo(customer.getName());
        assertThat(detail.getEmail()).isEqualTo(customer.getEmail());
        assertThat(detail.getAddress()).isNotNull();
        assertThat(detail.getAddress().getCity()).isEqualTo("Bengaluru");
        assertThat(detail.getWalletBalancePaise()).isEqualTo(50_000L);
    }

    @Test
    void getCustomerDetail_onboardingIncomplete_addressIsNull() {
        User noOnboard = factory.createCustomer();
        noOnboard.setOnboardingCompleted(false);
        userRepository.save(noOnboard);

        AdminCustomerDetailResponse detail = adminCustomerService.getCustomerDetail(noOnboard.getId());

        assertThat(detail.getAddress()).isNull();
    }

    @Test
    void getCustomerDetail_unknownId_throws404() {
        assertThatThrownBy(() -> adminCustomerService.getCustomerDetail(UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("RESOURCE_NOT_FOUND");
    }

    @Test
    void getCustomerDetail_adminId_throws404() {
        // Admin users must not be accessible via customer detail endpoint
        assertThatThrownBy(() -> adminCustomerService.getCustomerDetail(admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("RESOURCE_NOT_FOUND");
    }

    // ── deactivateCustomer ────────────────────────────────────────────────────

    @Test
    void deactivateCustomer_activeCustomer_deactivatesAndPausesSubs() {
        Product product = factory.createProduct(2500L);
        Subscription sub = factory.createActiveSubscription(customer.getId(), product.getId(), 1);

        AdminCustomerStatusResponse response =
                adminCustomerService.deactivateCustomer(customer.getId(), admin.getId());

        assertThat(response.getMessage()).isEqualTo("Customer deactivated");

        // Customer should now be inactive
        User updated = userRepository.findById(customer.getId()).orElseThrow();
        assertThat(updated.getIsActive()).isFalse();

        // Subscription should be paused with CUSTOMER_DEACTIVATED reason
        Subscription updatedSub = subscriptionRepository.findById(sub.getId()).orElseThrow();
        assertThat(updatedSub.getStatus()).isEqualTo(Subscription.SubscriptionStatus.PAUSED);
        assertThat(updatedSub.getPauseReason()).isEqualTo(Subscription.PauseReason.CUSTOMER_DEACTIVATED);
    }

    @Test
    void deactivateCustomer_alreadyInactive_throws409() {
        customer.setIsActive(false);
        userRepository.save(customer);

        assertThatThrownBy(() -> adminCustomerService.deactivateCustomer(customer.getId(), admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("CUSTOMER_ALREADY_INACTIVE");
    }

    // ── reactivateCustomer ────────────────────────────────────────────────────

    @Test
    void reactivateCustomer_inactiveCustomer_reactivatesAndRestoresSubs() {
        // First deactivate
        Product product = factory.createProduct(2500L);
        factory.createActiveSubscription(customer.getId(), product.getId(), 1);
        adminCustomerService.deactivateCustomer(customer.getId(), admin.getId());

        // Now reactivate
        AdminCustomerStatusResponse response =
                adminCustomerService.reactivateCustomer(customer.getId(), admin.getId());

        assertThat(response.getMessage()).isEqualTo("Customer reactivated");

        User updated = userRepository.findById(customer.getId()).orElseThrow();
        assertThat(updated.getIsActive()).isTrue();

        // Subscription paused with CUSTOMER_DEACTIVATED should be ACTIVE again
        subscriptionRepository.findAllByCustomerIdAndStatusIn(
                customer.getId(), java.util.List.of(Subscription.SubscriptionStatus.ACTIVE))
                .forEach(s -> assertThat(s.getPauseReason()).isNull());
    }

    @Test
    void reactivateCustomer_alreadyActive_throws409() {
        assertThatThrownBy(() -> adminCustomerService.reactivateCustomer(customer.getId(), admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("CUSTOMER_ALREADY_ACTIVE");
    }
}
