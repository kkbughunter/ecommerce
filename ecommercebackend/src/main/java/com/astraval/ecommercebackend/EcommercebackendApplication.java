package com.astraval.ecommercebackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EcommercebackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcommercebackendApplication.class, args);
	}

}
