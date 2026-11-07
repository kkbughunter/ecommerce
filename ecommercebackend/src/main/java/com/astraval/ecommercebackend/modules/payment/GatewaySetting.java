package com.astraval.ecommercebackend.modules.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payment_gateway_settings")
@Getter
@Setter
public class GatewaySetting {
    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentGateway gateway;
    @Column(nullable = false)
    private boolean enabled;
}
