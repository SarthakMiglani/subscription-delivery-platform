-- V110: Admin notification panel — stores all alert events for display in the admin UI.
-- Types: WALLET_RECHARGE_REQUESTED, LOW_BALANCE, ORDER_GENERATION_BLOCKED

CREATE TABLE admin_notifications (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    type           VARCHAR(80)  NOT NULL,
    customer_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name  VARCHAR(255) NOT NULL,
    message        TEXT         NOT NULL,
    amount_paise   BIGINT,
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_admin_notifications PRIMARY KEY (id)
);

-- Fast unread-count query
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications (is_read) WHERE is_read = FALSE;

-- Fast chronological list
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications (created_at DESC);
