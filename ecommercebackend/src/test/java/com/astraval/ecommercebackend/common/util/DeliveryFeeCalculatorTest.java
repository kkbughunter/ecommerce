package com.astraval.ecommercebackend.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class DeliveryFeeCalculatorTest {

    @Test
    void shouldReturnZeroWhenCartIsEmpty() {
        BigDecimal fee = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("10.00"), 0);
        assertEquals(new BigDecimal("0.00"), fee);  // delivery-fee
    }

    @Test
    void shouldApplyZeroToOneKgSlab() {
        BigDecimal fee = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("0.75"), 1);
        assertEquals(new BigDecimal("50.00"), fee);  // delivery-fee
    }

    @Test
    void shouldApplyOneToThreeKgSlab() {
        BigDecimal fee = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("2.20"), 2);
        assertEquals(new BigDecimal("80.00"), fee);  // delivery-fee
    }

    @Test
    void shouldApplyThreeToFiveKgSlab() {
        BigDecimal fee = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("4.80"), 2);
        assertEquals(new BigDecimal("120.00"), fee);  // delivery-fee
    }

    @Test
    void shouldApplyExtraPerStartedKgAfterFiveKg() {
        BigDecimal feeForFivePointOne = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("5.10"), 1);
        BigDecimal feeForSix = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("6.00"), 1);
        BigDecimal feeForSixPointOne = DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("6.10"), 1);

        assertEquals(new BigDecimal("130.00"), feeForFivePointOne);  // delivery-fee
        assertEquals(new BigDecimal("130.00"), feeForSix);           // delivery-fee
        assertEquals(new BigDecimal("140.00"), feeForSixPointOne);   // delivery-fee
    }

    @Test
    void shouldRejectNegativeWeight() {
        assertThrows(
                IllegalArgumentException.class,
                () -> DeliveryFeeCalculator.calculateShippingFee(new BigDecimal("-0.10"), 1));
    }
}
