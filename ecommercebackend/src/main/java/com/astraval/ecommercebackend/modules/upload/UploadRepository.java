package com.astraval.ecommercebackend.modules.upload;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadRepository extends JpaRepository<Upload, String> {

    List<Upload> findByRelatedIdAndUploadTypeAndIsActiveTrueOrderByCreatedDtAsc(String relatedId, String uploadType);
}
