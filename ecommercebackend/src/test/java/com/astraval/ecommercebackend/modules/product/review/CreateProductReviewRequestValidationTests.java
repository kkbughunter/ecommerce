package com.astraval.ecommercebackend.modules.product.review;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;

class CreateProductReviewRequestValidationTests {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();

    @AfterAll
    static void closeValidator() {
        FACTORY.close();
    }

    @Test
    void rejectsRatingsOutsideOneToFiveAndBlankReviewFields() throws Exception {
        Class<?> type = Class.forName("com.astraval.ecommercebackend.modules.product.review.dto.CreateProductReviewRequest");
        var constructor = type.getDeclaredConstructor(Integer.class, String.class, String.class);

        Object invalid = constructor.newInstance(0, "", "");

        assertThat(FACTORY.getValidator().validate(invalid)).isNotEmpty();
    }
}
