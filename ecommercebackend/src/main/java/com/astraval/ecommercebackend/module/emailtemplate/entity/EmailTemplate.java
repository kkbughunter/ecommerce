package com.astraval.ecommercebackend.module.emailtemplate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "email_templates")
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id", nullable = false, updatable = false)
    private Long templateId;

    @Column(name = "name", nullable = false, unique = true, length = 128)
    private String name;

    @Column(name = "from_email")
    private String fromEmail;

    @Column(name = "to_email")
    private String toEmail;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "body_html", nullable = false, columnDefinition = "text")
    private String bodyHtml;

    @Column(name = "body_text", nullable = false, columnDefinition = "text")
    private String bodyText;

    @Column(name = "description")
    private String description;

    @Column(name = "type", nullable = false, length = 64)
    private String type;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_dt")
    private OffsetDateTime createdDt;

    @Column(name = "modified_by")
    private Long modifiedBy;

    @Column(name = "modified_dt")
    private OffsetDateTime modifiedDt;

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdDt == null) {
            createdDt = now;
        }
        if (modifiedDt == null) {
            modifiedDt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        modifiedDt = OffsetDateTime.now();
    }
}
