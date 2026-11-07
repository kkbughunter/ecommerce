package com.astraval.ecommercebackend.modules.catalog;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.HashMap;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.data.redis.core.*;
import org.springframework.transaction.support.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

class CatalogCacheTests {
    final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    final ValueOperations<String, String> values = mock(ValueOperations.class);
    final HashMap<String, String> store = new HashMap<>();
    final TypeReference<java.util.List<String>> type = new TypeReference<>() {};
    CatalogCache cache;
    @BeforeEach void setup() {
        when(redis.opsForValue()).thenReturn(values);
        when(values.get(anyString())).thenAnswer(i -> store.get(i.getArgument(0)));
        when(values.setIfAbsent(anyString(), anyString())).thenAnswer(i -> store.putIfAbsent(i.getArgument(0), i.getArgument(1)) == null);
        doAnswer(i -> { store.put(i.getArgument(0), i.getArgument(1)); return null; }).when(values).set(anyString(), anyString());
        doAnswer(i -> { store.put(i.getArgument(0), i.getArgument(1)); return null; }).when(values).set(anyString(), anyString(), any(Duration.class));
        cache = new CatalogCache(redis, new ObjectMapper(), true, Duration.ofSeconds(60), "test:catalog:");
    }
    @AfterEach void cleanup() { if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization(); }
    @Test void repeatedReadHitsCacheAndDifferentParametersStaySeparate() {
        var calls = new AtomicInteger();
        assertEquals(java.util.List.of("product"), cache.read("list:0", type, () -> { calls.incrementAndGet(); return java.util.List.of("product"); }));
        assertEquals(java.util.List.of("product"), cache.read("list:0", type, () -> { fail("Should use cached DTO"); return null; }));
        assertEquals(java.util.List.of("other"), cache.read("list:1", type, () -> java.util.List.of("other")));
        assertEquals(1, calls.get());
        verify(values, times(2)).set(anyString(), anyString(), eq(Duration.ofSeconds(60)));
    }
    @Test void invalidationIsDeferredUntilCommitAndRollbackLeavesCacheIntact() {
        cache.read("detail:1", type, () -> java.util.List.of("before"));
        TransactionSynchronizationManager.initSynchronization();
        cache.invalidateAfterCommit(); cache.invalidateAfterCommit();
        assertEquals(1, TransactionSynchronizationManager.getSynchronizations().size());
        assertEquals(java.util.List.of("before"), cache.read("detail:1", type, () -> java.util.List.of("uncommitted")));
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        TransactionSynchronizationManager.clearSynchronization();
        assertEquals(java.util.List.of("before"), cache.read("detail:1", type, () -> java.util.List.of("wrong")));
        TransactionSynchronizationManager.initSynchronization(); cache.invalidateAfterCommit();
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        TransactionSynchronizationManager.clearSynchronization();
        assertEquals(java.util.List.of("after"), cache.read("detail:1", type, () -> java.util.List.of("after")));
    }
    @Test void redisFailureFallsBackWithoutFailingCatalogRead() {
        when(values.get(anyString())).thenThrow(new org.springframework.data.redis.RedisConnectionFailureException("offline"));
        assertEquals(java.util.List.of("database"), cache.read("list", type, () -> java.util.List.of("database")));
    }
    @Test void disabledCacheDoesNotContactRedis() {
        var disabled = new CatalogCache(redis, new ObjectMapper(), false, Duration.ofSeconds(60), "test:");
        assertEquals(java.util.List.of("database"), disabled.read("list", type, () -> java.util.List.of("database")));
        disabled.invalidateAfterCommit();
        verifyNoInteractions(values);
    }
    record DatedResponse(String name, java.time.LocalDateTime updatedAt) {}
    @Test void typedDtoDatesSurviveRedisRoundTrip() {
        var dtoType = new TypeReference<DatedResponse>() {};
        var dto = new DatedResponse("Product", java.time.LocalDateTime.of(2026, 11, 7, 12, 0));
        cache.read("dated", dtoType, () -> dto);
        assertEquals(dto, cache.read("dated", dtoType, () -> { fail("Expected JSON cache hit"); return null; }));
    }
    @Test void invalidationDuringSlowLoadCannotRepopulateCurrentGeneration() {
        cache.read("slow", type, () -> {
            cache.invalidateAfterCommit();
            return java.util.List.of("stale");
        });
        assertEquals(java.util.List.of("fresh"), cache.read("slow", type, () -> java.util.List.of("fresh")));
    }
    @Test void writeTransactionReadsCannotPublishUncommittedData() {
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            assertEquals(java.util.List.of("uncommitted"), cache.read("list", type, () -> java.util.List.of("uncommitted")));
            verifyNoInteractions(values);
        } finally { TransactionSynchronizationManager.setActualTransactionActive(false); }
    }
}
