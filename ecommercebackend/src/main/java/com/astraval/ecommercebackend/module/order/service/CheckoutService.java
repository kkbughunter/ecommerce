package com.astraval.ecommercebackend.module.order.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.utils.OrderNumberGenerator;
import com.astraval.ecommercebackend.module.inventory.entity.Inventory;
import com.astraval.ecommercebackend.module.inventory.repository.InventoryRepository;
import com.astraval.ecommercebackend.module.order.dto.CheckoutRequest;
import com.astraval.ecommercebackend.module.order.dto.CheckoutResponse;
import com.astraval.ecommercebackend.module.order.entity.Order;
import com.astraval.ecommercebackend.module.order.entity.OrderItem;
import com.astraval.ecommercebackend.module.order.entity.OrderPaymentStatus;
import com.astraval.ecommercebackend.module.order.entity.OrderStatus;
import com.astraval.ecommercebackend.module.order.repository.OrderRepository;
import com.astraval.ecommercebackend.module.payment.entity.Payment;
import com.astraval.ecommercebackend.module.payment.entity.PaymentStatus;
import com.astraval.ecommercebackend.module.payment.repository.PaymentRepository;
import com.astraval.ecommercebackend.module.product.entity.Product;
import com.astraval.ecommercebackend.module.product.repository.ProductRepository;
import com.astraval.ecommercebackend.module.user.entity.Customer;
import com.astraval.ecommercebackend.module.user.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderNumberGenerator orderNumberGenerator;

    public CheckoutService(
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            OrderNumberGenerator orderNumberGenerator
    ) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderNumberGenerator = orderNumberGenerator;
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.customerId()));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        List<PreparedItem> preparedItems = new ArrayList<>();
        String currency = null;

        for (var item : request.items()) {
            Product product = productRepository.findByProductId(item.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.productId()));
            if (!product.isActive()) {
                throw new BadRequestException("Inactive product cannot be checked out: " + product.getName());
            }
            Inventory inventory = inventoryRepository.findByProductIdForUpdate(item.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + item.productId()));

            int sellableQty = inventory.getAvailableQty() - inventory.getReservedQty();
            if (sellableQty < item.quantity()) {
                throw new BadRequestException("Insufficient stock for SKU: " + product.getSku());
            }

            inventory.setReservedQty(inventory.getReservedQty() + item.quantity());

            BigDecimal lineSubtotal = product.getPrice().multiply(BigDecimal.valueOf(item.quantity()));
            BigDecimal lineTax = lineSubtotal
                    .multiply(product.getTaxPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(lineTax);
            if (currency == null) {
                currency = product.getCurrency();
            } else if (!currency.equals(product.getCurrency())) {
                throw new BadRequestException("All checkout items must have the same currency");
            }

            preparedItems.add(new PreparedItem(product, item.quantity(), lineTax, lineTotal));
        }

        BigDecimal shippingAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(taxTotal).add(shippingAmount);

        Order order = new Order();
        order.setOrderNumber(generateUniqueOrderNumber());
        order.setCustomer(customer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(OrderPaymentStatus.UNPAID);
        order.setSubtotalAmount(subtotal);
        order.setTaxAmount(taxTotal);
        order.setShippingAmount(shippingAmount);
        order.setTotalAmount(totalAmount);
        order.setCurrency(currency == null ? "INR" : currency);
        order.setShippingAddress(request.shippingAddress());
        order.setBillingAddress(request.billingAddress());

        for (PreparedItem preparedItem : preparedItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(preparedItem.product());
            orderItem.setSku(preparedItem.product().getSku());
            orderItem.setProductName(preparedItem.product().getName());
            orderItem.setQuantity(preparedItem.quantity());
            orderItem.setUnitPrice(preparedItem.product().getPrice());
            orderItem.setTaxAmount(preparedItem.lineTax());
            orderItem.setTotalPrice(preparedItem.lineTotal());
            order.getItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setProvider("razorpay");
        payment.setAmount(savedOrder.getTotalAmount());
        payment.setCurrency(savedOrder.getCurrency());
        payment.setStatus(PaymentStatus.INITIATED);
        Payment savedPayment = paymentRepository.save(payment);

        return new CheckoutResponse(
                savedOrder.getOrderId(),
                savedOrder.getOrderNumber(),
                savedOrder.getStatus(),
                savedOrder.getPaymentStatus(),
                savedOrder.getTotalAmount(),
                savedOrder.getCurrency(),
                savedPayment.getPaymentId()
        );
    }

    private String generateUniqueOrderNumber() {
        String orderNumber = orderNumberGenerator.nextOrderNumber();
        while (orderRepository.existsByOrderNumber(orderNumber)) {
            orderNumber = orderNumberGenerator.nextOrderNumber();
        }
        return orderNumber;
    }

    private record PreparedItem(
            Product product,
            int quantity,
            BigDecimal lineTax,
            BigDecimal lineTotal
    ) {
    }
}
