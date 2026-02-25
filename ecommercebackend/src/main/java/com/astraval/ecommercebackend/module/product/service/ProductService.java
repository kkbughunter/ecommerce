package com.astraval.ecommercebackend.module.product.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.inventory.entity.Inventory;
import com.astraval.ecommercebackend.module.product.dto.CreateProductRequest;
import com.astraval.ecommercebackend.module.product.dto.ProductImageResponse;
import com.astraval.ecommercebackend.module.product.dto.ProductResponse;
import com.astraval.ecommercebackend.module.product.entity.Category;
import com.astraval.ecommercebackend.module.product.entity.Product;
import com.astraval.ecommercebackend.module.product.entity.ProductImage;
import com.astraval.ecommercebackend.module.product.repository.CategoryRepository;
import com.astraval.ecommercebackend.module.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        if (productRepository.existsBySku(request.sku())) {
            throw new BadRequestException("Product SKU already exists");
        }
        if (productRepository.existsBySlug(request.slug())) {
            throw new BadRequestException("Product slug already exists");
        }

        Product product = new Product();
        product.setSku(request.sku());
        product.setName(request.name());
        product.setSlug(request.slug());
        product.setShortDescription(request.shortDescription());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCurrency(request.currency() == null || request.currency().isBlank() ? "INR" : request.currency());
        product.setTaxPercent(request.taxPercent());
        product.setActive(request.active());
        product.setMeta(request.meta());

        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            List<Category> categories = categoryRepository.findAllById(request.categoryIds());
            if (categories.size() != request.categoryIds().size()) {
                throw new BadRequestException("One or more category IDs are invalid");
            }
            product.getCategories().addAll(categories);
        }

        Product savedProduct = productRepository.save(product);
        int position = 0;
        if (request.images() != null) {
            for (var imageRequest : request.images()) {
                ProductImage image = new ProductImage();
                image.setProduct(savedProduct);
                image.setUrl(imageRequest.url());
                image.setAltText(imageRequest.altText());
                image.setPosition(imageRequest.position() == null ? position : imageRequest.position());
                savedProduct.getImages().add(image);
                position++;
            }
        }

        Inventory inventory = new Inventory();
        inventory.setProduct(savedProduct);
        inventory.setProductId(savedProduct.getProductId());
        inventory.setAvailableQty(request.availableQty() == null ? 0 : request.availableQty());
        inventory.setReservedQty(0);
        inventory.setSafetyStock(request.safetyStock() == null ? 0 : request.safetyStock());
        savedProduct.setInventory(inventory);

        Product persisted = productRepository.save(savedProduct);
        return toResponse(persisted);
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found for slug: " + slug));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public Product getProduct(UUID productId) {
        return productRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
    }

    private ProductResponse toResponse(Product product) {
        List<ProductImageResponse> images = product.getImages().stream()
                .sorted(Comparator.comparingInt(ProductImage::getPosition))
                .map(image -> new ProductImageResponse(
                        image.getImageId(),
                        image.getUrl(),
                        image.getAltText(),
                        image.getPosition()
                ))
                .toList();
        Set<Category> categories = product.getCategories();
        int availableQty = product.getInventory() != null ? product.getInventory().getAvailableQty() : 0;
        int reservedQty = product.getInventory() != null ? product.getInventory().getReservedQty() : 0;
        int safetyStock = product.getInventory() != null ? product.getInventory().getSafetyStock() : 0;
        return new ProductResponse(
                product.getProductId(),
                product.getSku(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getCurrency(),
                product.getTaxPercent(),
                product.isActive(),
                product.getMeta(),
                availableQty,
                reservedQty,
                safetyStock,
                categories.stream().map(Category::getName).sorted().toList(),
                images,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
