package com.juiceplatform.repository;

import com.juiceplatform.entity.AdminNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AdminNotificationRepository extends JpaRepository<AdminNotification, UUID> {

    Page<AdminNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AdminNotification> findByReadFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByReadFalse();

    @Modifying
    @Query("UPDATE AdminNotification n SET n.read = true WHERE n.read = false")
    void markAllAsRead();
}
