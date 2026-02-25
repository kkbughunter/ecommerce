package com.astraval.ecommercebackend.common.utils;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class OrderNumberGenerator {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private final AtomicInteger sequence = new AtomicInteger(0);
    private LocalDate sequenceDate = LocalDate.now();

    public synchronized String nextOrderNumber() {
        LocalDate today = LocalDate.now();
        if (!today.equals(sequenceDate)) {
            sequenceDate = today;
            sequence.set(0);
        }
        int value = sequence.incrementAndGet();
        return "ORD-" + today.format(FORMATTER) + "-" + String.format("%04d", value);
    }
}
