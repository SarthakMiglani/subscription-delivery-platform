package com.juiceplatform.service;

import com.juiceplatform.AbstractIntegrationTest;
import com.juiceplatform.TestDataFactory;
import com.juiceplatform.dto.admin.AdminSubscriptionListItemResponse;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideRequest;
import com.juiceplatform.dto.admin.AdminSubscriptionOverrideResponse;
import com.juiceplatform.entity.Order;
import com.juiceplatform.entity.Product;
import com.juiceplatform.entity.Subscription;
import com.juiceplatform.entity.User;
import com.juiceplatform.exception.BusinessException;
import com.juiceplatform.repository.OrderRepository;
import com.juiceplatform.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AdminSubscriptionServiceTest extends AbstractIntegrationTest {

    @Autowired AdminSubscriptionService adminSubscriptionService;
    @Autowired TestDataFactory factory;
    @Autowired SubscriptionRepository subscriptionRepository;
    @Autowired OrderRepository orderRepository;

    User customer;
    User admin;
    Product product;
    Subscription subscription;

    @BeforeEach
    void setUp() {
        customer = factory.createCustomer();
        admin = factory.createAdmin();
        product = factory.createProduct(3000L);
        subscription = factory.createActiveSubscription(customer.getId(), product.getId(), 2);
    }

    // ── listSubscriptions ─────────────────────────────────────────────────────

    @Test
    void listSubscriptions_noFilter_returnsAll() {
        Page<AdminSubscriptionListItemResponse> page =
                adminSubscriptionService.listSubscriptions(null, PageRequest.of(0, 20));

        assertThat(page.getContent())
                .extracting(AdminSubscriptionListItemResponse::getId)
                .contains(subscription.getId());
    }

    @Test
    void listSubscriptions_filteredByStatus_returnsMatchingOnly() {
        // Create a paused subscription
        Product p2 = factory.createProduct(2000L);
        Subscription paused = factory.createActiveSubscription(customer.getId(), p2.getId(), 1);
        paused.setStatus(Subscription.SubscriptionStatus.PAUSED);
        paused.setPauseReason(Subscription.PauseReason.USER_PAUSED);
        subscriptionRepository.save(paused);

        Page<AdminSubscriptionListItemResponse> page =
                adminSubscriptionService.listSubscriptions("PAUSED", PageRequest.of(0, 20));

        assertThat(page.getContent())
                .extracting(AdminSubscriptionListItemResponse::getStatus)
                .allMatch(s -> s.equals("PAUSED"));
        assertThat(page.getContent())
                .extracting(AdminSubscriptionListItemResponse::getId)
                .contains(paused.getId())
                .doesNotContain(subscription.getId());
    }

    @Test
    void listSubscriptions_includesCustomerAndProductNames() {
        Page<AdminSubscriptionListItemResponse> page =
                adminSubscriptionService.listSubscriptions(null, PageRequest.of(0, 20));

        AdminSubscriptionListItemResponse entry = page.getContent().stream()
                .filter(s -> s.getId().equals(subscription.getId()))
                .findFirst().orElseThrow();

        assertThat(entry.getCustomerName()).isEqualTo(customer.getName());
        assertThat(entry.getProductName()).isEqualTo(product.getName());
    }

    @Test
    void listSubscriptions_invalidStatus_throws400() {
        assertThatThrownBy(() -> adminSubscriptionService.listSubscriptions("INVALID", PageRequest.of(0, 20)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_STATUS");
    }

    // ── overrideSubscription ─────────────────────────────────────────────────

    @Test
    void override_quantityChange_updatesQuantity() {
        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setQuantity(5);

        AdminSubscriptionOverrideResponse response =
                adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId());

        assertThat(response.getQuantity()).isEqualTo(5);
        assertThat(subscriptionRepository.findById(subscription.getId()).orElseThrow().getQuantity()).isEqualTo(5);
    }

    @Test
    void override_pauseStatus_cancelsScheduledOrders() {
        // Create a future scheduled order
        Order futureOrder = new Order();
        futureOrder.setCustomerId(customer.getId());
        futureOrder.setSubscriptionId(subscription.getId());
        futureOrder.setProductId(product.getId());
        futureOrder.setDeliveryLine1("Test");
        futureOrder.setDeliveryCity("City");
        futureOrder.setDeliveryState("State");
        futureOrder.setDeliveryPincode("123456");
        futureOrder.setDeliveryDate(LocalDate.now().plusDays(2));
        futureOrder.setQuantity(1);
        futureOrder.setUnitPricePaise(3000L);
        futureOrder.setTotalAmountPaise(3000L);
        futureOrder.setStatus(Order.OrderStatus.SCHEDULED);
        futureOrder.setIdempotencyKey("test-" + UUID.randomUUID());
        orderRepository.save(futureOrder);

        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setStatus("PAUSED");

        adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId());

        // Future scheduled orders should be cancelled
        Order updated = orderRepository.findById(futureOrder.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);

        // Subscription should be paused
        Subscription updatedSub = subscriptionRepository.findById(subscription.getId()).orElseThrow();
        assertThat(updatedSub.getStatus()).isEqualTo(Subscription.SubscriptionStatus.PAUSED);
        assertThat(updatedSub.getPauseReason()).isEqualTo(Subscription.PauseReason.USER_PAUSED);
    }

    @Test
    void override_activateFromPaused_clearsPauseReason() {
        subscription.setStatus(Subscription.SubscriptionStatus.PAUSED);
        subscription.setPauseReason(Subscription.PauseReason.USER_PAUSED);
        subscriptionRepository.save(subscription);

        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setStatus("ACTIVE");

        AdminSubscriptionOverrideResponse response =
                adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId());

        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        Subscription updatedSub = subscriptionRepository.findById(subscription.getId()).orElseThrow();
        assertThat(updatedSub.getPauseReason()).isNull();
    }

    @Test
    void override_cancelledSubscriptionToCancelled_throws409() {
        subscription.setStatus(Subscription.SubscriptionStatus.CANCELLED);
        subscriptionRepository.save(subscription);

        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setStatus("CANCELLED");

        assertThatThrownBy(() ->
                adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SUBSCRIPTION_ALREADY_CANCELLED");
    }

    @Test
    void override_productChange_updatesProductId() {
        Product newProduct = factory.createProduct(4000L);

        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setProductId(newProduct.getId());

        AdminSubscriptionOverrideResponse response =
                adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId());

        assertThat(response.getProductId()).isEqualTo(newProduct.getId());
        assertThat(response.getProductName()).isEqualTo(newProduct.getName());
    }

    @Test
    void override_productChange_disabledProduct_throws400() {
        Product disabled = factory.createProduct(1000L);
        disabled.setIsAvailable(false);

        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setProductId(disabled.getId());

        assertThatThrownBy(() ->
                adminSubscriptionService.overrideSubscription(subscription.getId(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("PRODUCT_UNAVAILABLE");
    }

    @Test
    void override_unknownSubscription_throws404() {
        AdminSubscriptionOverrideRequest request = new AdminSubscriptionOverrideRequest();
        request.setQuantity(3);

        assertThatThrownBy(() ->
                adminSubscriptionService.overrideSubscription(UUID.randomUUID(), request, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("RESOURCE_NOT_FOUND");
    }
}
