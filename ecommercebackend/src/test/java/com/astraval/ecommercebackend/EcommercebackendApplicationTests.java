package com.astraval.ecommercebackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:ecommerce;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.sql.init.mode=never",
		"spring.jpa.defer-datasource-initialization=false",
		"jwt.secret=test-secret-key-test-secret-key-123456"
})
class EcommercebackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
