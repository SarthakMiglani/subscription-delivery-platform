package com.juiceplatform.security;

import com.juiceplatform.entity.AdminCredentials;
import com.juiceplatform.entity.User;
import com.juiceplatform.repository.AdminCredentialsRepository;
import com.juiceplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Optional startup step that overwrites the seeded admin account's password hash.
 * <p>
 * V100__seed_admin.sql ships a fixed bcrypt hash for the password "admin123" so the
 * admin panel is usable immediately after a fresh deploy / local setup, without
 * requiring a manual DB edit. That default is intentionally kept for local development
 * and testing.
 * <p>
 * For any environment where the default should NOT be used (staging, production), set
 * the {@code ADMIN_BOOTSTRAP_PASSWORD} environment variable before starting the app.
 * On every startup, if this variable is present, the admin's password hash is
 * recomputed from it and persisted — safely overriding the seeded default without
 * ever editing a Flyway migration (migrations are append-only and never touch
 * environment-specific secrets).
 * <p>
 * If the variable is unset, this is a complete no-op and the seeded/current hash is
 * left untouched. Safe to run on every startup — always idempotent.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class AdminPasswordBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminPasswordBootstrap.class);

    private final UserRepository userRepository;
    private final AdminCredentialsRepository adminCredentialsRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap-password:}")
    private String bootstrapPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (bootstrapPassword == null || bootstrapPassword.isBlank()) {
            // No override requested — the seeded/current admin password hash is left as-is.
            return;
        }

        userRepository.findAllByRoleAndAuthProvider(User.UserRole.ADMIN, User.AuthProvider.ADMIN_PASSWORD)
                .forEach(admin -> adminCredentialsRepository.findByUserId(admin.getId())
                        .ifPresentOrElse(
                                credentials -> {
                                    credentials.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
                                    adminCredentialsRepository.save(credentials);
                                    log.warn("Admin password for user {} was overridden from ADMIN_BOOTSTRAP_PASSWORD " +
                                            "at startup. Unset this environment variable once the password has " +
                                            "been set to avoid resetting it on every restart.", admin.getId());
                                },
                                () -> log.warn("Admin user {} has no admin_credentials row — " +
                                        "ADMIN_BOOTSTRAP_PASSWORD was not applied.", admin.getId())
                        ));
    }
}
