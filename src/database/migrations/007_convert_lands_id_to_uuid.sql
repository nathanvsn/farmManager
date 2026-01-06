-- Migration: Convert lands.id from SERIAL to UUID
-- This resolves conflicts with frontend passing UUIDs as strings

DO $$ 
BEGIN
    -- Check if id is already UUID type
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'lands' AND column_name = 'id') != 'uuid' THEN
        
        -- Add uuid-ossp extension for gen_random_uuid()
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Add new UUID column temporarily
        ALTER TABLE lands ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
        
        -- Update existing rows with generated UUIDs
        UPDATE lands SET id_new = gen_random_uuid() WHERE id_new IS NULL;
        
        -- Drop old id column (this will also drop the sequence)
        ALTER TABLE lands DROP COLUMN id CASCADE;
        
        -- Rename new column to id
        ALTER TABLE lands RENAME COLUMN id_new TO id;
        
        -- Set as primary key
        ALTER TABLE lands ADD PRIMARY KEY (id);
        
        -- Set default for future inserts
        ALTER TABLE lands ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;
