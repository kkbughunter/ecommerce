package com.astraval.ecommercebackend.module.emailtemplate.dto;

public record EmailTemplateResponse(
        Long templateId,
        String name,
        String subject,
        String bodyHtml,
        String bodyText,
        String description,
        String type,
        boolean active
) {
}
