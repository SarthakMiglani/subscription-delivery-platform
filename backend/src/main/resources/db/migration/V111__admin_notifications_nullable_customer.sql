-- V111: Allow admin_notifications to represent non-customer events (e.g. scheduler job
-- failures, which have no associated customer). customer_id and customer_name become
-- nullable; the FK is kept but with a matching ON DELETE behavior for the nullable case.

ALTER TABLE admin_notifications
    ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE admin_notifications
    ALTER COLUMN customer_name DROP NOT NULL;
