package com.astraval.ecommercebackend.modules.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import com.astraval.ecommercebackend.common.exception.BadRequestException;

class GatewaySettingsServiceTests {
    private final GatewaySettingRepository repository = mock(GatewaySettingRepository.class);
    private final RazorpayProperties razorpay = new RazorpayProperties();
    private final CashfreeProperties cashfree = new CashfreeProperties();

    @Test void missingCredentialsAreNotAvailableAndCannotBeEnabled() {
        var service = new GatewaySettingsService(repository, razorpay, cashfree);
        assertTrue(service.available().isEmpty());
        assertFalse(service.list().get(1).configured());
        assertThrows(BadRequestException.class, () -> service.update(PaymentGateway.CASHFREE, true));
        verify(repository, never()).save(any());
    }

    @Test void bothGatewaysCanBeAvailableAndDisabledGatewayIsRejected() {
        razorpay.setKeyId("test-id"); razorpay.setKeySecret("test-secret");
        cashfree.setClientId("test-id"); cashfree.setClientSecret("test-secret");
        var setting = new GatewaySetting();
        setting.setGateway(PaymentGateway.CASHFREE); setting.setEnabled(true);
        when(repository.findById(PaymentGateway.CASHFREE)).thenReturn(Optional.of(setting));
        var service = new GatewaySettingsService(repository, razorpay, cashfree);
        assertEquals(2, service.available().size());
        setting.setEnabled(false);
        assertThrows(BadRequestException.class, () -> service.requireAvailable(PaymentGateway.CASHFREE));
        assertEquals(1, service.available().size());
    }
}
