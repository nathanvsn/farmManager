-- Migration: Add silo capacity to users
-- Limits how much the silo can store in kg

DO $$ 
BEGIN 
    -- Add silo_capacity column (default 50,000 kg)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='silo_capacity') THEN
        ALTER TABLE users ADD COLUMN silo_capacity INTEGER DEFAULT 50000;
        RAISE NOTICE 'Column silo_capacity added successfully';
    ELSE
        RAISE NOTICE 'Column silo_capacity already exists';
    END IF;
END $$;
