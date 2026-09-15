package com.juiceplatform.service;

import com.juiceplatform.entity.SchedulerJobLog;
import com.juiceplatform.entity.Subscription;
import com.juiceplatform.repository.SchedulerJobLogRepository;
import com.juiceplatform.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Activates PENDING_START subscriptions whose effective start date has been reached.
 * The PENDING_START → ACTIVE transition is scheduler-driven only.
 * Job status is tracked in scheduler_job_log.
 */
@Service
@RequiredArgsConstructor
public class SubscriptionActivationService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionActivationService.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    public static final String JOB_NAME = "SubscriptionActivationJob";

    private final SubscriptionRepository subscriptionRepository;
    private final SchedulerJobLogRepository schedulerJobLogRepository;

    /**
     * Activates all PENDING_START subscriptions whose start_date has become eligible
     * for the next operational delivery date (BR-ORD-07 / BR-SUB-05).
     * <p>
     * This job runs at 22:04 IST, one minute before OrderGenerationJob (22:05 IST),
     * which always generates orders for TOMORROW (today + 1 day). A subscription created
     * before today's 22:00 cutoff has start_date = tomorrow, and must already be ACTIVE
     * by the time OrderGenerationJob runs tonight so its first order is generated for
     * tomorrow as promised (BR-CUT-03). Comparing against "today" instead of "tomorrow"
     * would activate it one full day late.
     * <p>
     * Idempotent: already-ACTIVE subscriptions are not re-processed.
     * Concurrent RUNNING guard: rejects if a RUNNING entry already exists for today.
     */
    @Transactional
    public ActivationResult activateEligibleSubscriptions() {
        LocalDate today = LocalDate.now(IST);
        // Eligibility is evaluated against tomorrow's delivery date, not today —
        // see method Javadoc. The job_log entry itself remains keyed by "today" (run date).
        LocalDate activationTargetDate = today.plusDays(1);

        // Acquire scheduler_job_log entry — rejects concurrent RUNNING, allows rerun
        SchedulerJobLog jobLog = acquireJobLog(today);
        if (jobLog == null) {
            log.warn("SubscriptionActivationJob rejected for {} — another instance is RUNNING", today);
            return new ActivationResult(today, 0);
        }

        log.info("Starting subscription activation for date: {} (eligibility target: {})",
                today, activationTargetDate);

        List<Subscription> pendingSubscriptions = subscriptionRepository
                .findAllByStatusAndStartDateLessThanEqual(
                        Subscription.SubscriptionStatus.PENDING_START, activationTargetDate);

        int activated = 0;
        try {
            for (Subscription subscription : pendingSubscriptions) {
                subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                subscriptionRepository.save(subscription);
                activated++;
                log.debug("Activated subscription: {} (customer: {}, product: {})",
                        subscription.getId(), subscription.getCustomerId(), subscription.getProductId());
            }

            // Mark job COMPLETED
            jobLog.setStatus(SchedulerJobLog.JobStatus.COMPLETED);
            jobLog.setFinishedAt(OffsetDateTime.now(IST));
            jobLog.setRowsProcessed(activated);
            schedulerJobLogRepository.save(jobLog);

            log.info("Subscription activation complete: {} subscriptions activated", activated);

        } catch (Exception e) {
            // Mark job FAILED
            jobLog.setStatus(SchedulerJobLog.JobStatus.FAILED);
            jobLog.setFinishedAt(OffsetDateTime.now(IST));
            jobLog.setErrorMessage(e.getMessage());
            schedulerJobLogRepository.save(jobLog);

            log.error("SubscriptionActivationJob failed for {}: {}", today, e.getMessage(), e);
            throw e;
        }

        return new ActivationResult(today, activated);
    }

    /**
     * Acquires a scheduler_job_log entry for this job run.
     * Returns null if a RUNNING entry already exists (concurrent guard).
     * Deletes and recreates if COMPLETED or FAILED (allows rerun).
     */
    private SchedulerJobLog acquireJobLog(LocalDate date) {
        try {
            schedulerJobLogRepository.findByJobNameAndJobDate(JOB_NAME, date)
                    .ifPresent(existing -> {
                        if (existing.getStatus() == SchedulerJobLog.JobStatus.RUNNING) {
                            throw new IllegalStateException(
                                    "SubscriptionActivationJob is already RUNNING for " + date);
                        }
                        schedulerJobLogRepository.delete(existing);
                        schedulerJobLogRepository.flush();
                    });
        } catch (IllegalStateException e) {
            return null;
        }

        SchedulerJobLog jobLog = new SchedulerJobLog();
        jobLog.setJobName(JOB_NAME);
        jobLog.setJobDate(date);
        jobLog.setStatus(SchedulerJobLog.JobStatus.RUNNING);
        return schedulerJobLogRepository.save(jobLog);
    }

    public record ActivationResult(LocalDate date, int subscriptionsActivated) {}
}
