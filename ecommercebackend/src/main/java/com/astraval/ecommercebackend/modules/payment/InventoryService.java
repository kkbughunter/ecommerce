package com.astraval.ecommercebackend.modules.payment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderItem;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class InventoryService {

    private final ProductRepository productRepository;

    public InventoryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public void reserveStock(Long productId, int quantity) {
        Product product = productRepository.findByIdWithLock(productId)
                .orElseThrow(() -> new BadRequestException("Product not found: " + productId));

        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (availableStock < quantity) {
            throw new BadRequestException("Insufficient stock for product: " + product.getName());
        }

        product.setStockQuantity(availableStock - quantity);
        product.setReservedQuantity((product.getReservedQuantity() != null ? product.getReservedQuantity() : 0) + quantity);
        productRepository.save(product);

        log.info("Reserved stock: productId={}, quantity={}, remainingStock={}", 
                productId, quantity, product.getStockQuantity());
    }

    @Transactional
    public void commitReservation(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int reservedQty = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
            product.setReservedQuantity(reservedQty - item.getQuantity());
            productRepository.save(product);

            log.info("Committed reservation: productId={}, quantity={}", 
                    product.getProductId(), item.getQuantity());
        }
    }

    @Transactional
    public void releaseStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            int reservedQty = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;

            product.setStockQuantity(currentStock + item.getQuantity());
            product.setReservedQuantity(reservedQty - item.getQuantity());
            productRepository.save(product);

            log.info("Released stock: productId={}, quantity={}, newStock={}", 
                    product.getProductId(), item.getQuantity(), product.getStockQuantity());
        }
    }
}
