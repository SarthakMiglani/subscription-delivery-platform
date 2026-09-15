-- V108: Add ingredients catalog and product_ingredients recipe junction table

CREATE TABLE ingredients (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    default_unit VARCHAR(30)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_ingredients      PRIMARY KEY (id),
    CONSTRAINT uq_ingredients_name UNIQUE (name)
);

CREATE TABLE product_ingredients (
    id                UUID          NOT NULL DEFAULT gen_random_uuid(),
    product_id        UUID          NOT NULL,
    ingredient_id     UUID          NOT NULL,
    quantity_per_unit DECIMAL(10,3) NOT NULL,
    unit              VARCHAR(30)   NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_product_ingredients        PRIMARY KEY (id),
    CONSTRAINT fk_pi_product                 FOREIGN KEY (product_id)    REFERENCES products(id)     ON DELETE CASCADE,
    CONSTRAINT fk_pi_ingredient              FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)  ON DELETE RESTRICT,
    CONSTRAINT uq_product_ingredient_unit    UNIQUE (product_id, ingredient_id, unit),
    CONSTRAINT chk_pi_quantity_positive      CHECK (quantity_per_unit > 0)
);
