package com.astraval.ecommercebackend.module.inventory.controller;

import com.astraval.ecommercebackend.module.inventory.dto.RestockRequest;
import com.astraval.ecommercebackend.module.inventory.dto.StockResponse;
import com.astraval.ecommercebackend.module.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/{productId}/stock")
    public ResponseEntity<StockResponse> restock(
            @PathVariable UUID productId,
            @Valid @RequestBody RestockRequest request
    ) {
        return ResponseEntity.ok(inventoryService.restock(productId, request.quantity()));
    }
}
