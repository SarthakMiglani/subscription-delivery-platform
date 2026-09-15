-- V109: Add indexes on FK columns that PostgreSQL does not auto-index.
-- These improve performance of FK lookups, CASCADE/RESTRICT checks, and join queries.

-- refresh_tokens.user_id — looked up on token refresh/revoke
CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

-- subscriptions.customer_id — queried heavily by order generation and customer views
CREATE INDEX idx_subscriptions_customer_id
    ON subscriptions (customer_id);

-- subscriptions.product_id — queried when filtering subscriptions by product
CREATE INDEX idx_subscriptions_product_id
    ON subscriptions (product_id);

-- orders.product_id — no standalone index exists (customer_id and subscription_id already indexed)
CREATE INDEX idx_orders_product_id
    ON orders (product_id);

-- wallet_ledger.created_by_user_id — used for admin audit queries
CREATE INDEX idx_wallet_ledger_created_by_user_id
    ON wallet_ledger (created_by_user_id);

-- product_ingredients.ingredient_id — needed for lookups by ingredient (e.g. "which products use this ingredient?")
-- Note: the existing UNIQUE(product_id, ingredient_id, unit) index covers product_id-first queries only.
CREATE INDEX idx_product_ingredients_ingredient_id
    ON product_ingredients (ingredient_id);
