package com.astraval.ecommercebackend.modules.payment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface GatewaySettingRepository extends JpaRepository<GatewaySetting, PaymentGateway> {}
