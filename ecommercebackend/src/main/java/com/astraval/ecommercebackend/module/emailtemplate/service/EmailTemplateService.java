package com.astraval.ecommercebackend.module.emailtemplate.service;

import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.emailtemplate.dto.EmailTemplateResponse;
import com.astraval.ecommercebackend.module.emailtemplate.entity.EmailTemplate;
import com.astraval.ecommercebackend.module.emailtemplate.repository.EmailTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    public EmailTemplateService(EmailTemplateRepository emailTemplateRepository) {
        this.emailTemplateRepository = emailTemplateRepository;
    }

    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> getAll() {
        return emailTemplateRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse getByName(String name) {
        EmailTemplate template = emailTemplateRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Email template not found: " + name));
        return toResponse(template);
    }

    private EmailTemplateResponse toResponse(EmailTemplate template) {
        return new EmailTemplateResponse(
                template.getTemplateId(),
                template.getName(),
                template.getSubject(),
                template.getBodyHtml(),
                template.getBodyText(),
                template.getDescription(),
                template.getType(),
                template.isActive()
        );
    }
}
