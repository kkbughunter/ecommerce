package com.astraval.ecommercebackend.modules.payment;

import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.astraval.ecommercebackend.common.exception.BadRequestException;

@Service
public class GatewaySettingsService {
    private final GatewaySettingRepository repository;
    private final RazorpayProperties razorpay;
    private final CashfreeProperties cashfree;

    public GatewaySettingsService(GatewaySettingRepository repository, RazorpayProperties razorpay, CashfreeProperties cashfree) {
        this.repository = repository; this.razorpay = razorpay; this.cashfree = cashfree;
    }

    public record GatewayStatus(PaymentGateway gateway, boolean enabled, boolean configured, boolean available) {}

    public List<GatewayStatus> list() {
        return Arrays.stream(PaymentGateway.values()).map(this::status).toList();
    }

    public List<PaymentGateway> available() {
        return list().stream().filter(GatewayStatus::available).map(GatewayStatus::gateway).toList();
    }

    public void requireAvailable(PaymentGateway gateway) {
        if (gateway == null || !status(gateway).available()) {
            throw new BadRequestException("Selected payment gateway is unavailable. Please choose another gateway.");
        }
    }

    @Transactional
    public GatewayStatus update(PaymentGateway gateway, boolean enabled) {
        if (enabled && !configured(gateway)) {
            throw new BadRequestException("Credentials are not configured. Please contact the development team.");
        }
        GatewaySetting setting = repository.findById(gateway).orElseGet(GatewaySetting::new);
        setting.setGateway(gateway);
        setting.setEnabled(enabled);
        repository.save(setting);
        return new GatewayStatus(gateway, enabled, configured(gateway), enabled && configured(gateway));
    }

    private GatewayStatus status(PaymentGateway gateway) {
        boolean enabled = repository.findById(gateway).map(GatewaySetting::isEnabled).orElse(gateway == PaymentGateway.RAZORPAY);
        boolean configured = configured(gateway);
        return new GatewayStatus(gateway, enabled, configured, enabled && configured);
    }

    private boolean configured(PaymentGateway gateway) {
        return switch (gateway) {
            case RAZORPAY -> present(razorpay.getKeyId()) && present(razorpay.getKeySecret());
            case CASHFREE -> present(cashfree.getClientId()) && present(cashfree.getClientSecret())
                    && List.of("sandbox", "production").contains(cashfree.getMode());
        };
    }
    private boolean present(String value) { return value != null && !value.isBlank(); }
}
