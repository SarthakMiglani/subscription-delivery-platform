-- V100: Seed the single admin user and credentials.
-- The hash below corresponds to the password: "admin123" (bcrypt, cost 10)
-- This default is intentionally kept so the admin panel is usable immediately after a
-- fresh deploy or local setup, for testing purposes.
--
-- IMPORTANT — for staging/production: do NOT edit this migration file (migrations are
-- append-only). Instead set the ADMIN_BOOTSTRAP_PASSWORD environment variable before
-- starting the app — AdminPasswordBootstrap.java will safely override this seeded
-- password hash on startup. See application.properties (admin.bootstrap-password).

-- Insert admin user only if phone does not already exist
INSERT INTO users (
    id, name, email, phone, role, auth_provider, google_id,
    phone_verified, email_verified, is_active, onboarding_completed,
    created_at, updated_at
) VALUES (
    'cccccccc-dddd-eeee-ffff-000000000001',
    'Admin',
    NULL,
    '9999999999',
    'ADMIN',
    'ADMIN_PASSWORD',
    NULL,
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Insert admin credentials using the actual user id looked up by phone
-- This handles the case where the user row already existed with a different UUID
INSERT INTO admin_credentials (
    id, user_id, password_hash, created_at, updated_at
)
SELECT
    'cccccccc-dddd-eeee-ffff-000000000002',
    u.id,
    '$2y$10$M4LG3dWX9FFTbwp/JXSg.uP0idpNVhtB5JJbzNhbnnLbu5hw2hpn6',
    NOW(),
    NOW()
FROM users u
WHERE u.phone = '9999999999'
ON CONFLICT (user_id) DO NOTHING;
