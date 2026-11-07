package com.astraval.ecommercebackend.modules.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.*;
import com.astraval.ecommercebackend.modules.user.User;

class CashfreePaymentServiceTests {
    final OrderRepository orders = mock(OrderRepository.class);
    final PaymentTransactionRepository transactions = mock(PaymentTransactionRepository.class);
    final CashfreeGatewayClient client = mock(CashfreeGatewayClient.class);
    final RazorpayPaymentService tracking = mock(RazorpayPaymentService.class);
    final SecurityUtil security = mock(SecurityUtil.class);
    final CashfreeProperties properties = new CashfreeProperties();
    final ObjectMapper mapper = new ObjectMapper();
    CashfreePaymentService service;
    PaymentTransaction transaction;

    @BeforeEach void setup() {
        service = new CashfreePaymentService(orders, transactions, mock(GatewaySettingsService.class),
                client, properties, security, tracking, mapper);
        var user = new User(); user.setUserId(7L);
        var order = new Order(); order.setOrderId(1L); order.setUser(user);
        order.setTotalAmount(new BigDecimal("100.00"));
        transaction = new PaymentTransaction(); transaction.setOrder(order);
        transaction.setGateway(PaymentGateway.CASHFREE); transaction.setGatewayOrderId("cf_test");
        transaction.setAmount(new BigDecimal("100.00"));
        when(orders.findForPaymentUpdate(1L)).thenReturn(Optional.of(order));
        when(transactions.findByGatewayAndGatewayOrderId(PaymentGateway.CASHFREE, "cf_test"))
                .thenReturn(Optional.of(transaction));
        when(security.getCurrentSub()).thenReturn("7");
    }

    @Test void otherCustomersCannotVerifyPayment() {
        when(security.getCurrentSub()).thenReturn("8");
        assertThrows(UnauthorizedException.class, () -> service.verify(1L, "cf_test"));
        verifyNoInteractions(client);
    }

    @Test void pendingPaymentDoesNotMarkOrderPaid() throws Exception {
        when(client.payments("cf_test")).thenReturn(mapper.readTree("[{\"payment_status\":\"PENDING\"}]"));
        assertFalse(service.verify(1L, "cf_test").paid());
        verifyNoInteractions(tracking);
    }

    @Test void mismatchedAmountIsRejected() throws Exception {
        when(client.payments("cf_test")).thenReturn(mapper.readTree("[{\"payment_status\":\"SUCCESS\",\"payment_amount\":1,\"payment_currency\":\"INR\",\"cf_payment_id\":123}]"));
        assertThrows(BadRequestException.class, () -> service.verify(1L, "cf_test"));
        verifyNoInteractions(tracking);
    }

    @Test void verifiedSuccessIsAppliedOnlyOnce() throws Exception {
        when(client.payments("cf_test")).thenReturn(mapper.readTree("[{\"payment_status\":\"SUCCESS\",\"payment_amount\":100,\"payment_currency\":\"INR\",\"cf_payment_id\":123}]"));
        assertTrue(service.verify(1L, "cf_test").paid());
        transaction.setStatus(PaymentTransactionStatus.SUCCESS);
        assertTrue(service.verify(1L, "cf_test").paid());
        verify(tracking, times(1)).applyStatusChange(eq(transaction), eq(PaymentTransactionStatus.SUCCESS),
                eq(PaymentEventSource.API), eq(PaymentEventType.PAYMENT_VERIFIED), eq("123"), anyString(), isNull(), eq(7L));
    }

    @Test void forgedWebhooksAreRejectedBeforeLookingUpOrders() {
        properties.setClientSecret("test-secret");
        assertThrows(UnauthorizedException.class, () -> service.webhook("fake", "123", "{}"));
        verifyNoInteractions(client, orders, transactions);
    }
}
