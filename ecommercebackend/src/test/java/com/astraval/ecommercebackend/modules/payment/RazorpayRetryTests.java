package com.astraval.ecommercebackend.modules.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.*;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.emailtemplate.EmailTemplateService;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;

class RazorpayRetryTests {
    @Test void lateFailureCannotOverwriteSuccessfulPaymentIdentity() throws Exception {
        var orders = mock(OrderRepository.class);
        var transactions = mock(PaymentTransactionRepository.class);
        var security = mock(SecurityUtil.class); when(security.getCurrentSub()).thenReturn("7");
        var user = new User(); user.setUserId(7L);
        var order = new Order(); order.setOrderId(1L); order.setUser(user); order.setPaymentStatus(PaymentStatus.PAID);
        var payment = new PaymentTransaction(); payment.setOrder(order); payment.setGatewayOrderId("order_test");
        payment.setGatewayPaymentId("pay_captured"); payment.setStatus(PaymentTransactionStatus.SUCCESS);
        when(transactions.findByGatewayAndGatewayOrderId(PaymentGateway.RAZORPAY, "order_test")).thenReturn(Optional.of(payment));
        var properties = new RazorpayProperties(); properties.setWebhookSecret("webhook-test-secret");
        var service = new RazorpayPaymentService(properties, orders, transactions,
                mock(PaymentStatusTrackingRepository.class), mock(EmailTemplateService.class), security,
                new ObjectMapper(), mock(GatewaySettingsService.class));
        org.springframework.test.util.ReflectionTestUtils.setField(service, "entityManager", mock(jakarta.persistence.EntityManager.class));
        service.markPaymentFailed(new com.astraval.ecommercebackend.modules.payment.dto.MarkPaymentFailedRequest(
                1L, "order_test", "pay_failed", "LATE_FAILURE", "Late failure"));
        assertEquals("pay_captured", payment.getGatewayPaymentId());
        assertNull(payment.getErrorCode());
        String failurePayload = "{\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_test\",\"id\":\"pay_failed\",\"error_code\":\"LATE\"}}}}";
        service.handleWebhook(signature(failurePayload), failurePayload);
        assertEquals("pay_captured", payment.getGatewayPaymentId());
        assertNull(payment.getErrorCode());
        String capturedPayload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_test\",\"id\":\"pay_captured\",\"fee\":200,\"tax\":36}}}}";
        payment.setPaymentTransactionId(1L);
        service.handleWebhook(signature(capturedPayload), capturedPayload);
        assertEquals(new BigDecimal("2.00"), payment.getGatewayFee());
    }
    private String signature(String payload) throws Exception {
        var mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("webhook-test-secret".getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
        return java.util.HexFormat.of().formatHex(mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    @Test void capturedPaymentIsReconciledAndExistingSessionIsReused() throws Exception {
        var props = new RazorpayProperties(); props.setKeyId("id"); props.setKeySecret("secret");
        var orders = mock(OrderRepository.class);
        var transactions = mock(PaymentTransactionRepository.class);
        var security = mock(SecurityUtil.class); when(security.getCurrentSub()).thenReturn("7");
        var user = new User(); user.setUserId(7L);
        var order = new Order(); order.setOrderId(1L); order.setUser(user); order.setTotalAmount(new BigDecimal("100"));
        var payment = new PaymentTransaction(); payment.setOrder(order); payment.setGatewayOrderId("order_test");
        payment.setAmount(new BigDecimal("100")); payment.setPaymentTransactionId(1L);
        when(orders.findForPaymentUpdate(1L)).thenReturn(Optional.of(order));
        when(transactions.findByOrderOrderIdOrderByCreatedDtDesc(1L)).thenReturn(List.of(payment));
        var mapper = new ObjectMapper();
        var service = spy(new RazorpayPaymentService(props, orders, transactions, mock(PaymentStatusTrackingRepository.class),
                mock(EmailTemplateService.class), security, mapper, mock(GatewaySettingsService.class)));
        doReturn(mapper.readTree("{\"items\":[{\"id\":\"pay_test\",\"order_id\":\"order_test\",\"status\":\"captured\",\"amount\":10000,\"currency\":\"INR\"}]}"))
                .when(service).fetchGatewayPayments("order_test");
        var response = service.createRazorpayOrder(new CreateRazorpayOrderRequest(1L));
        assertEquals("order_test", response.razorpayOrderId());
        assertEquals("SUCCESS", response.status());
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        verify(transactions, times(1)).save(payment);
    }

    @Test void switchingGatewayCannotCreateAnotherChargeableSession() {
        var repository = mock(PaymentTransactionRepository.class);
        var prior = new PaymentTransaction(); prior.setGateway(PaymentGateway.RAZORPAY);
        when(repository.findByOrderOrderIdOrderByCreatedDtDesc(1L)).thenReturn(List.of(prior));
        assertThrows(BadRequestException.class, () -> PaymentSessionGuard.existing(repository, 1L, PaymentGateway.CASHFREE));
    }
}
