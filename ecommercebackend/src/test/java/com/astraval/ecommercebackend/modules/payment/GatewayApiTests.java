package com.astraval.ecommercebackend.modules.payment;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:gateway-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
    "spring.jpa.defer-datasource-initialization=false", "r2.enabled=false",
    "jwt.secret=test-secret-key-test-secret-key-123456",
    "razorpay.key-id=test-public-id", "razorpay.key-secret=never-expose-this-secret",
    "cashfree.client-id=", "cashfree.client-secret="
})
class GatewayApiTests {
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean
    com.astraval.ecommercebackend.modules.catalog.CatalogCache catalogCache;
    @Autowired CashfreeProperties cashfree;
    @Autowired com.astraval.ecommercebackend.modules.user.UserRepository users;
    @Autowired com.astraval.ecommercebackend.modules.order.OrderRepository orders;
    @Autowired PaymentStatusTrackingRepository events;
    @org.springframework.test.context.bean.override.mockito.MockitoBean CashfreeGatewayClient client;
    @org.springframework.test.context.bean.override.mockito.MockitoBean
    com.astraval.ecommercebackend.modules.emailtemplate.EmailTemplateService email;
    @Autowired WebApplicationContext context;
    @Autowired GatewaySettingRepository settings;
    MockMvc mvc;
    @BeforeEach void setup() {
        cashfree.setClientId(""); cashfree.setClientSecret("");
        settings.deleteAll();
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @Test void onlySuperAdminCanManageGatewaysAndSecretsAreNeverReturned() throws Exception {
        mvc.perform(get("/api/admin/payment-gateways").with(user("1").roles("USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/payment-gateways").with(user("1").roles("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/payment-gateways").with(user("1").roles("SUPER_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].configured").value(true))
                .andExpect(jsonPath("$.data[1].configured").value(false))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("never-expose-this-secret"))))
                .andExpect(jsonPath("$.data[0].keyId").doesNotExist());
        mvc.perform(put("/api/admin/payment-gateways/RAZORPAY").with(user("1").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}")).andExpect(status().isForbidden());
    }
    @Test void disabledGatewayIsHiddenAndDirectApiCannotCreatePayments() throws Exception {
        mvc.perform(put("/api/admin/payment-gateways/RAZORPAY").with(user("1").roles("SUPER_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.enabled").value(false));
        mvc.perform(get("/api/payments/gateways").with(user("1").roles("USER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(post("/api/payments/razorpay/order").with(user("1").roles("USER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"orderId\":1}"))
                .andExpect(status().isBadRequest());
    }
    @Test void missingCredentialsCannotBeEnabled() throws Exception {
        mvc.perform(put("/api/admin/payment-gateways/CASHFREE").with(user("1").roles("SUPER_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
                .andExpect(status().isBadRequest());
    }
    @Test void fulfillmentAdminCannotManageCatalogOrFinancialDataButSuperAdminCan() throws Exception {
        String product = "{\"name\":\"Role test product\",\"price\":100,\"gstPercentage\":18,\"stockQuantity\":4,\"widthCm\":1,\"heightCm\":1,\"weightKg\":1}";
        mvc.perform(post("/api/products").with(user("1").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content(product))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/products").with(user("1").roles("SUPER_ADMIN")).contentType(MediaType.APPLICATION_JSON).content(product))
                .andExpect(status().isCreated());
        org.mockito.Mockito.verify(catalogCache, org.mockito.Mockito.atLeastOnce()).invalidateAfterCommit();
        for (String path : java.util.List.of("/api/admin/dashboard", "/api/admin/reports", "/api/products")) {
            mvc.perform(get(path).with(user("1").roles("ADMIN"))).andExpect(status().isForbidden());
            mvc.perform(get(path).with(user("1").roles("SUPER_ADMIN"))).andExpect(status().isOk());
        }
        mvc.perform(get("/api/payments/orders/999").with(user("1").roles("ADMIN"))).andExpect(status().isForbidden());
        for (String role : java.util.List.of("ADMIN", "SUPER_ADMIN")) {
            mvc.perform(get("/api/admin/orders").with(user("1").roles(role))).andExpect(status().isOk());
            mvc.perform(get("/api/orders/admin").with(user("1").roles(role))).andExpect(status().isOk());
        }
    }
    @Test void unsignedWebhookIsRejectedEvenWithoutLogin() throws Exception {
        mvc.perform(post("/api/payments/cashfree/webhook").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test void cashfreeCheckoutPersistsAndSignedDuplicateCallbacksSettleAfterDisabling() throws Exception {
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        cashfree.setClientId("test-id"); cashfree.setClientSecret("test-secret");
        var setting = new GatewaySetting(); setting.setGateway(PaymentGateway.CASHFREE); setting.setEnabled(true);
        settings.save(setting);
        var customer = new com.astraval.ecommercebackend.modules.user.User();
        customer.setEmail("cashfree-test@example.test"); customer.setPassword("test-hash"); customer = users.save(customer);
        var order = new com.astraval.ecommercebackend.modules.order.Order();
        order.setUser(customer); order.setOrderNumber("CF-TEST-1"); order.setContactPhone("9999999999");
        order.setTotalAmount(new java.math.BigDecimal("100.00")); order = orders.save(order);
        org.mockito.Mockito.when(client.create(org.mockito.ArgumentMatchers.anyMap())).thenAnswer(invocation -> {
            java.util.Map<?, ?> body = invocation.getArgument(0);
            return mapper.valueToTree(java.util.Map.of("order_id", body.get("order_id"), "payment_session_id", "session-test"));
        });
        String response = mvc.perform(post("/api/payments/cashfree/order").with(user(customer.getUserId().toString()).roles("USER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"orderId\":" + order.getOrderId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.paymentSessionId").value("session-test"))
                .andReturn().getResponse().getContentAsString();
        String gatewayOrderId = mapper.readTree(response).path("data").path("gatewayOrderId").asText();
        setting.setEnabled(false); settings.save(setting);
        org.mockito.Mockito.when(client.payments(gatewayOrderId)).thenReturn(mapper.readTree(
                "[{\"payment_status\":\"SUCCESS\",\"payment_amount\":100,\"payment_currency\":\"INR\",\"cf_payment_id\":456}]"));
        String payload = "{\"type\":\"PAYMENT_SUCCESS_WEBHOOK\",\"data\":{\"order\":{\"order_id\":\"" + gatewayOrderId + "\"}}}";
        String timestamp = "1234567890";
        var mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("test-secret".getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = java.util.Base64.getEncoder().encodeToString(mac.doFinal((timestamp + payload).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/payments/cashfree/webhook").header("x-webhook-signature", signature)
                    .header("x-webhook-timestamp", timestamp).contentType(MediaType.APPLICATION_JSON).content(payload))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.paid").value(true));
        }
        org.junit.jupiter.api.Assertions.assertEquals(com.astraval.ecommercebackend.modules.order.PaymentStatus.PAID,
                orders.findById(order.getOrderId()).orElseThrow().getPaymentStatus());
        org.junit.jupiter.api.Assertions.assertEquals(2, events.findByPaymentTransactionOrderOrderIdOrderByEventTimeAsc(order.getOrderId()).size());
        org.mockito.Mockito.verify(client, org.mockito.Mockito.times(1)).payments(gatewayOrderId);
    }
}
