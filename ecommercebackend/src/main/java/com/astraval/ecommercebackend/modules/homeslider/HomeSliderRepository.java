package com.astraval.ecommercebackend.modules.homeslider;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HomeSliderRepository extends JpaRepository<HomeSlider, Long> {

    @Query("""
            select s from HomeSlider s
            where (:tag is null or s.placementTag = :tag)
            order by s.displayOrder asc, s.createdDt desc
            """)
    List<HomeSlider> findAllByTag(@Param("tag") HomeSliderPlacementTag tag);

    @Query("""
            select s from HomeSlider s
            where s.isActive = true
              and (:tag is null or s.placementTag = :tag)
              and (s.startDt is null or s.startDt <= :now)
              and (s.endDt is null or s.endDt >= :now)
            order by s.displayOrder asc, s.createdDt desc
            """)
    List<HomeSlider> findActiveByTagAndSchedule(
            @Param("tag") HomeSliderPlacementTag tag,
            @Param("now") LocalDateTime now);
}
