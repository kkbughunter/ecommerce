package com.astraval.ecommercebackend.modules.order;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.modules.order.dto.UpdateOrderStatusRequest;

class OrderRoleTests {
    @Test void fulfillmentAdminCannotOverridePaymentsOrRefunds() {
        var security = mock(SecurityUtil.class); when(security.hasRole("ADMIN")).thenReturn(true);
        var repository = mock(OrderRepository.class);
        var service = new OrderService(repository, null, null, null, null, null, security);
        assertThrows(UnauthorizedException.class, () -> service.updateOrderStatusForAdmin(1L,
                new UpdateOrderStatusRequest(OrderStatus.CONFIRMED, PaymentStatus.PAID, null, null, null)));
        assertThrows(UnauthorizedException.class, () -> service.updateOrderStatusForAdmin(1L,
                new UpdateOrderStatusRequest(OrderStatus.REFUNDED, null, null, null, null)));
        verifyNoInteractions(repository);
    }
}
