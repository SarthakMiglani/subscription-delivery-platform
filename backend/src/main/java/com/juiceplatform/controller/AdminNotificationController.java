package com.juiceplatform.controller;

import com.juiceplatform.dto.common.ApiResponse;
import com.juiceplatform.dto.common.PagedResponse;
import com.juiceplatform.dto.common.PaginationMeta;
import com.juiceplatform.dto.notification.AdminNotificationResponse;
import com.juiceplatform.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Admin-only endpoints for the notification panel.
 * All routes under /api/v1/admin/** are secured by ADMIN role in SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService notificationService;

    /** List notifications — paginated, optionally filtered to unread only. */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminNotificationResponse>>> list(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @ParameterObject Pageable pageable) {

        Page<AdminNotificationResponse> page = notificationService.list(unreadOnly, pageable);
        PagedResponse<AdminNotificationResponse> data = new PagedResponse<>(page.getContent());
        PaginationMeta meta = new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data, meta));
    }

    /** Fast unread count — used by the bell badge, polled every 30 s. */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", notificationService.countUnread())));
    }

    /** Mark a single notification as read. */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<AdminNotificationResponse>> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAsRead(id)));
    }

    /** Mark all notifications as read. */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
