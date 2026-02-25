package com.astraval.ecommercebackend.module.inventory.service;

import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.inventory.dto.StockResponse;
import com.astraval.ecommercebackend.module.inventory.entity.Inventory;
import com.astraval.ecommercebackend.module.inventory.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public StockResponse restock(UUID productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));
        inventory.setAvailableQty(inventory.getAvailableQty() + quantity);
        inventory.setLastRestockedAt(OffsetDateTime.now());
        Inventory saved = inventoryRepository.save(inventory);
        return new StockResponse(
                saved.getProductId(),
                saved.getAvailableQty(),
                saved.getReservedQty(),
                saved.getSafetyStock(),
                saved.getLastRestockedAt()
        );
    }
}
