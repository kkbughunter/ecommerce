package com.astraval.ecommercebackend.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class DeliveryFeeCalculator {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal ONE_KG = new BigDecimal("1.00");
    private static final BigDecimal THREE_KG = new BigDecimal("3.00");
    private static final BigDecimal FIVE_KG = new BigDecimal("5.00");

    private static final BigDecimal FEE_0_TO_1_KG = new BigDecimal("50.00"); // delivery-fee
    private static final BigDecimal FEE_1_TO_3_KG = new BigDecimal("80.00"); // delivery-fee
    private static final BigDecimal FEE_3_TO_5_KG = new BigDecimal("120.00"); // delivery-fee
    private static final BigDecimal EXTRA_PER_KG_AFTER_5 = new BigDecimal("10.00"); // delivery-fee

    private DeliveryFeeCalculator() {
    }

    public static BigDecimal calculateShippingFee(BigDecimal totalWeightKg, int totalItems) {
        if (totalItems <= 0) {
            return ZERO;
        }

        BigDecimal normalizedWeight = normalizeWeight(totalWeightKg);
        if (normalizedWeight.compareTo(ONE_KG) <= 0) {
            return FEE_0_TO_1_KG;
        }
        if (normalizedWeight.compareTo(THREE_KG) <= 0) {
            return FEE_1_TO_3_KG;
        }
        if (normalizedWeight.compareTo(FIVE_KG) <= 0) {
            return FEE_3_TO_5_KG;
        }

        BigDecimal excessWeight = normalizedWeight.subtract(FIVE_KG);
        BigDecimal extraKgUnits = excessWeight.setScale(0, RoundingMode.CEILING);
        return FEE_3_TO_5_KG
                .add(EXTRA_PER_KG_AFTER_5.multiply(extraKgUnits))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeWeight(BigDecimal totalWeightKg) {
        if (totalWeightKg == null) {
            return BigDecimal.ZERO;
        }
        if (totalWeightKg.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total weight cannot be negative");
        }
        return totalWeightKg;
    }
}
