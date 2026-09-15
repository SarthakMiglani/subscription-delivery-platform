package com.juiceplatform.controller;

import com.juiceplatform.repository.SchedulerJobLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthCheckController {

    private static final Logger log = LoggerFactory.getLogger(HealthCheckController.class);

    private final SchedulerJobLogRepository schedulerJobLogRepository;

    /**
     * Health check — also touches the database on every call.
     * <p>
     * Doubles as the keep-alive target for external uptime pingers on free-tier
     * hosting: Render's free web service spins down after 15 minutes without
     * inbound HTTP traffic, and Supabase's free Postgres project pauses after
     * 7 days without database activity. A plain "return UP" response would only
     * solve the first problem — this endpoint runs a trivial read query so a
     * single periodic ping (e.g. every 10 minutes via a free cron pinger) keeps
     * both the app instance and the database awake.
     * <p>
     * The query itself is cheap (COUNT on an indexed, typically-small table) and
     * has no business meaning — it exists purely to generate real DB traffic.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        String dbStatus = "UP";
        try {
            schedulerJobLogRepository.count();
        } catch (Exception e) {
            log.warn("Health check DB probe failed: {}", e.getMessage());
            dbStatus = "DOWN";
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("status", "UP", "db", dbStatus)
        ));
    }
}
