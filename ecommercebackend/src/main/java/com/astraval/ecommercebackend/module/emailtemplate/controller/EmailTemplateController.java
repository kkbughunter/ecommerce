package com.astraval.ecommercebackend.module.emailtemplate.controller;

import com.astraval.ecommercebackend.module.emailtemplate.dto.EmailTemplateResponse;
import com.astraval.ecommercebackend.module.emailtemplate.service.EmailTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/email-templates")
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    public EmailTemplateController(EmailTemplateService emailTemplateService) {
        this.emailTemplateService = emailTemplateService;
    }

    @GetMapping
    public ResponseEntity<List<EmailTemplateResponse>> getAllTemplates() {
        return ResponseEntity.ok(emailTemplateService.getAll());
    }

    @GetMapping("/{name}")
    public ResponseEntity<EmailTemplateResponse> getTemplateByName(@PathVariable String name) {
        return ResponseEntity.ok(emailTemplateService.getByName(name));
    }
}
