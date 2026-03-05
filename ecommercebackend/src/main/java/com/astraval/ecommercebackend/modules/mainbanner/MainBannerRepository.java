package com.astraval.ecommercebackend.modules.mainbanner;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MainBannerRepository extends JpaRepository<MainBanner, Long> {

    List<MainBanner> findAllByOrderByDisplayOrderAscCreatedDtDesc();

    @Query("""
            select b from MainBanner b
            where b.isActive = true
              and (b.startDt is null or b.startDt <= :now)
              and (b.endDt is null or b.endDt >= :now)
            order by b.displayOrder asc, b.createdDt desc
            """)
    List<MainBanner> findActiveBanners(@Param("now") LocalDateTime now);
}
