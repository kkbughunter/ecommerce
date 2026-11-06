package com.astraval.ecommercebackend.modules.upload;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ImageDeletionRepository extends JpaRepository<ImageDeletion, Long> {
    List<ImageDeletion> findTop100ByOrderByIdAsc();
}
