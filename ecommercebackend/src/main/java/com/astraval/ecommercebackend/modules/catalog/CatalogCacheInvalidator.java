package com.astraval.ecommercebackend.modules.catalog;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PostRemove;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/** Entity callbacks cover HTTP writes, stock reservations and asynchronous media processing. */
@Component
public class CatalogCacheInvalidator {
    private final ObjectProvider<CatalogCache> cache;
    public CatalogCacheInvalidator(ObjectProvider<CatalogCache> cache) { this.cache = cache; }
    @PostPersist @PostUpdate @PostRemove
    public void changed(Object entity) { cache.getObject().invalidateAfterCommit(); }
}
