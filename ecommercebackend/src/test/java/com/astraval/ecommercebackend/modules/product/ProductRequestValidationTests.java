package com.astraval.ecommercebackend.modules.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.astraval.ecommercebackend.modules.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.modules.product.dto.UpdateProductRequest;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;

class ProductRequestValidationTests {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();

    @AfterAll
    static void closeValidator() { FACTORY.close(); }

    @ParameterizedTest
    @CsvSource({
            "price,100000000", "price,1.001", "maxPrice,100000000", "maxPrice,1.001",
            "gstPercentage,5.001", "widthCm,100000000", "widthCm,1.001",
            "heightCm,100000000", "heightCm,1.001", "weightKg,10000000", "weightKg,1.0001"
    })
    void rejectsValuesThatOverflowOrWouldBeRoundedByTheDatabase(String field, String value) {
        for (Class<?> request : new Class<?>[] {CreateProductRequest.class, UpdateProductRequest.class}) {
            assertThat(FACTORY.getValidator().validateValue(request, field, new BigDecimal(value)))
                    .as("%s.%s must reject %s", request.getSimpleName(), field, value).isNotEmpty();
        }
    }

    @Test
    void acceptsValidBoundaryValues() {
        var request = new CreateProductRequest("Product", null, new BigDecimal("99999999.99"),
                null, new BigDecimal("100.00"), 0, new BigDecimal("99999999.99"),
                BigDecimal.ZERO, new BigDecimal("9999999.999"), null, null, null, true);
        assertThat(FACTORY.getValidator().validate(request)).isEmpty();
    }

    @Test
    void rejectsDescriptionsLongerThanTenThousandCharacters() {
        String tooLong = "x".repeat(10001);
        for (Class<?> request : new Class<?>[] {CreateProductRequest.class, UpdateProductRequest.class}) {
            assertThat(FACTORY.getValidator().validateValue(request, "description", tooLong)).isNotEmpty();
        }
    }
}
