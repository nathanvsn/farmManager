-- Migration: Update lands table for farming operations
-- Add farming gameplay mechanics to lands

DO $$ 
BEGIN 
    -- current_crop_id (what's growing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='current_crop_id') THEN
        ALTER TABLE lands ADD COLUMN current_crop_id INTEGER REFERENCES game_items(id);
    END IF;

    -- operation_start (when farming started)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_start') THEN
        ALTER TABLE lands ADD COLUMN operation_start TIMESTAMP;
    END IF;

    -- operation_end (when farming completes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_end') THEN
        ALTER TABLE lands ADD COLUMN operation_end TIMESTAMP;
    END IF;

    -- operation_type (cleaning, plowing, sowing, growing, harvesting)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='operation_type') THEN
        ALTER TABLE lands ADD COLUMN operation_type VARCHAR(50);
    END IF;
END $$;

-- Index for active operations
CREATE INDEX IF NOT EXISTS lands_operation_end_idx ON lands(operation_end);
