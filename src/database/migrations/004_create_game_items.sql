-- Migration: Create game items table
-- Catalog of all purchasable items (tractors, implements, seeds, etc.)

CREATE TABLE IF NOT EXISTS game_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tractor', 'implement', 'heavy', 'seed', 'produce')),
    category VARCHAR(50), -- e.g., 'plow', 'seeder', 'soybean'
    price NUMERIC(15, 2) NOT NULL,
    image_url TEXT,
    description TEXT,
    stats JSONB DEFAULT '{}'::jsonb
);

-- Index for filtering by type and category
CREATE INDEX IF NOT EXISTS game_items_type_idx ON game_items(type);
CREATE INDEX IF NOT EXISTS game_items_category_idx ON game_items(category);
