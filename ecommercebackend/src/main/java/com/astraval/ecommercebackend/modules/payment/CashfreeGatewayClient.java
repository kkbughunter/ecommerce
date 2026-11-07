package com.astraval.ecommercebackend.modules.payment;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.*;
import com.astraval.ecommercebackend.common.exception.BadRequestException;

@Component
public class CashfreeGatewayClient {
    private final CashfreeProperties properties;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    public CashfreeGatewayClient(CashfreeProperties properties, ObjectMapper mapper) {
        this.properties = properties; this.mapper = mapper;
    }
    public JsonNode create(Map<String, Object> body) { return request("/orders", body); }
    public JsonNode order(String orderId) {
        if (!orderId.matches("[a-zA-Z0-9_-]{3,45}")) throw new BadRequestException("Invalid Cashfree order id");
        return request("/orders/" + orderId, null);
    }
    public JsonNode payments(String orderId) {
        if (!orderId.matches("[a-zA-Z0-9_-]{3,45}")) throw new BadRequestException("Invalid Cashfree order id");
        return request("/orders/" + orderId + "/payments", null);
    }
    private JsonNode request(String path, Map<String, Object> body) {
        if (properties.getClientId() == null || properties.getClientId().isBlank()
                || properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            throw new BadRequestException("Cashfree credentials are not configured. Please contact the development team.");
        }
        try {
            var builder = HttpRequest.newBuilder(URI.create(properties.apiBaseUrl() + path))
                    .timeout(Duration.ofSeconds(20))
                    .header("x-client-id", properties.getClientId())
                    .header("x-client-secret", properties.getClientSecret())
                    .header("x-api-version", properties.getApiVersion())
                    .header("Content-Type", "application/json");
            if (body == null) builder.GET();
            else builder.POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)));
            var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                // Do not expose provider responses, customer data or credentials in errors.
                throw new BadRequestException("Cashfree request failed. Please try again or contact support.");
            }
            return mapper.readTree(response.body());
        } catch (BadRequestException ex) { throw ex; }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Cashfree request interrupted. Please check your order payment status.");
        } catch (Exception ex) {
            throw new BadRequestException("Unable to reach Cashfree. Please check your order payment status before retrying.");
        }
    }
}
