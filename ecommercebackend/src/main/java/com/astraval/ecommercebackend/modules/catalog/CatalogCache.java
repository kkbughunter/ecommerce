package com.astraval.ecommercebackend.modules.catalog;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

/** Public DTOs only: business decisions, orders and customer state always come from the database. */
@Component
@Slf4j
public class CatalogCache {
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final boolean enabled;
    private final Duration ttl;
    private final String prefix;
    private volatile long retryAfter;
    private volatile boolean invalidationPending;

    public CatalogCache(StringRedisTemplate redis, ObjectMapper mapper,
            @Value("${catalog.cache.enabled:false}") boolean enabled,
            @Value("${catalog.cache.ttl:60s}") Duration ttl,
            @Value("${catalog.cache.prefix:ecommerce:catalog:v1:}") String prefix) {
        this.redis = redis;
        this.mapper = mapper.copy().registerModule(new JavaTimeModule());
        this.enabled = enabled; this.ttl = ttl; this.prefix = prefix;
        if (ttl.isNegative() || ttl.isZero()) throw new IllegalArgumentException("Catalog cache TTL must be positive");
    }

    public <T> T read(String key, TypeReference<T> type, Supplier<T> loader) {
        if (!enabled || System.currentTimeMillis() < retryAfter
                || (TransactionSynchronizationManager.isActualTransactionActive()
                    && !TransactionSynchronizationManager.isCurrentTransactionReadOnly())) return loader.get();
        String cacheKey;
        try {
            if (invalidationPending) invalidate();
            var values = redis.opsForValue();
            String generation = values.get(prefix + "generation");
            if (generation == null) {
                values.setIfAbsent(prefix + "generation", UUID.randomUUID().toString());
                generation = values.get(prefix + "generation");
                if (generation == null) return loader.get();
            }
            cacheKey = prefix + generation + ":" + digest(key);
            String cached = values.get(cacheKey);
            if (cached != null) return mapper.readValue(cached, type);
        } catch (Exception ex) {
            unavailable();
            return loader.get();
        }
        // Do not catch database/validation failures or cache their results.
        T result = loader.get();
        try {
            if (result != null) redis.opsForValue().set(cacheKey, mapper.writeValueAsString(result), ttl);
        } catch (Exception ex) { unavailable(); }
        return result;
    }

    public void invalidateAfterCommit() {
        if (!enabled) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) { safeInvalidate(); return; }
        if (TransactionSynchronizationManager.getSynchronizations().stream().noneMatch(s -> s instanceof Invalidation)) {
            TransactionSynchronizationManager.registerSynchronization(new Invalidation());
        }
    }
    private final class Invalidation implements TransactionSynchronization {
        @Override public void afterCommit() { safeInvalidate(); }
    }
    private void safeInvalidate() {
        invalidationPending = true;
        if (System.currentTimeMillis() < retryAfter) return;
        try { invalidate(); } catch (Exception ex) { unavailable(); }
    }
    private void invalidate() {
        // Changing the generation prevents a concurrent stale read from repopulating the current cache.
        redis.opsForValue().set(prefix + "generation", UUID.randomUUID().toString());
        invalidationPending = false;
    }
    private void unavailable() {
        retryAfter = System.currentTimeMillis() + 5000;
        log.warn("Catalog cache unavailable; using database reads temporarily");
    }
    private String digest(String key) throws java.security.NoSuchAlgorithmException {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)));
    }
}
