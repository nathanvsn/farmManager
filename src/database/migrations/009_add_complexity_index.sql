-- Migration: Add complexity index to lands
-- Higher complexity = longer operation times

DO $$ 
BEGIN 
    -- Add complexity_index column (1.0 to 3.0 scale, default 1.0)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='complexity_index') THEN
        ALTER TABLE lands ADD COLUMN complexity_index DECIMAL(2,1) DEFAULT 1.0;
        RAISE NOTICE 'Column complexity_index added successfully';
    ELSE
        RAISE NOTICE 'Column complexity_index already exists';
    END IF;
END $$;

-- Update existing lands with random complexity based on area
-- Larger lands tend to be more complex
UPDATE lands 
SET complexity_index = ROUND(
    (1.0 + (RANDOM() * 1.5) + 
     CASE 
        WHEN area_sqm > 500000 THEN 0.5  -- >50ha bonus complexity
        WHEN area_sqm > 100000 THEN 0.3  -- >10ha bonus complexity
        ELSE 0
     END)::numeric, 
    1
)
WHERE complexity_index IS NULL OR complexity_index = 1.0;

-- Ensure values stay within 1.0-3.0 range
UPDATE lands 
SET complexity_index = LEAST(3.0, GREATEST(1.0, complexity_index));
