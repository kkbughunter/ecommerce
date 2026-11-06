package com.astraval.ecommercebackend.modules.upload;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Table(name = "image_deletions")
@Data
public class ImageDeletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "object_key", nullable = false, length = 500)
    private String objectKey;
}
