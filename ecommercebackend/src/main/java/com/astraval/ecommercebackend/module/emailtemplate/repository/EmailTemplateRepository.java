package com.astraval.ecommercebackend.module.emailtemplate.repository;

import com.astraval.ecommercebackend.module.emailtemplate.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    Optional<EmailTemplate> findByName(String name);
}
