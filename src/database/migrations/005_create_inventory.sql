-- Migration: Create inventory table
-- User-owned items (tractors, implements, seeds, etc.)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES game_items (id) ON DELETE RESTRICT,
    quantity NUMERIC(15, 2) DEFAULT 1, -- For stackable items like seeds (kg)
    instance_id UUID DEFAULT gen_random_uuid (), -- Unique ID for machinery
    attached_to UUID, -- If implement is attached to a tractor (instance_id) is stored here
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS inventory_user_idx ON inventory (user_id);

CREATE INDEX IF NOT EXISTS inventory_item_idx ON inventory (item_id);

CREATE INDEX IF NOT EXISTS inventory_instance_idx ON inventory (instance_id);