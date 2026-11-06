package com.astraval.ecommercebackend.modules.product;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

import com.astraval.ecommercebackend.modules.product.dto.ProductDetailResponse;

/** HTML endpoint for social crawlers; people are redirected to the SPA product page. */
@RestController
public class ProductShareController {
    private final ProductService productService;
    private final String frontendUrl;

    public ProductShareController(ProductService productService, @Value("${frontend.url}") String frontendUrl) {
        this.productService = productService;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping(value = "/api/products/{productId}/share", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> sharePreview(@PathVariable Long productId) {
        ProductDetailResponse product = productService.getProductDetails(productId);
        String image = product.images().stream()
                .filter(imageItem -> product.mainImageUploadId() != null && product.mainImageUploadId().equals(imageItem.uploadId()))
                .map(imageItem -> imageItem.largeUrl() != null ? imageItem.largeUrl() : imageItem.mediumUrl())
                .findFirst().orElse("");
        String url = frontendUrl + "/products/" + productId;
        String title = HtmlUtils.htmlEscape(product.name());
        String description = HtmlUtils.htmlEscape(product.description() == null ? "" : product.description());
        String html = "<!doctype html><html><head><meta charset=\"utf-8\">"
                + "<meta property=\"og:type\" content=\"product\"><meta property=\"og:title\" content=\"" + title + "\">"
                + "<meta property=\"og:description\" content=\"" + description + "\"><meta property=\"og:url\" content=\"" + url + "\">"
                + "<meta property=\"og:image\" content=\"" + HtmlUtils.htmlEscape(image) + "\">"
                + "<meta http-equiv=\"refresh\" content=\"0;url=" + url + "\"></head><body><a href=\"" + url + "\">View product</a></body></html>";
        return ResponseEntity.ok(html);
    }
}
