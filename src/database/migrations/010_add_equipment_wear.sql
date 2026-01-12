-- Migration: Add wear system to equipment
-- Machines degrade with use (0.00 = new, 1.00 = broken)

DO $$ 
BEGIN 
    -- Add wear column to inventory (for tractors, implements, heavy machinery)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='wear') THEN
        ALTER TABLE inventory ADD COLUMN wear DECIMAL(3,2) DEFAULT 0.00;
        RAISE NOTICE 'Column wear added successfully';
    ELSE
        RAISE NOTICE 'Column wear already exists';
    END IF;
END $$;

-- Create index for quick lookup of equipment needing repair
CREATE INDEX IF NOT EXISTS inventory_wear_idx ON inventory(wear) WHERE wear > 0.5;
