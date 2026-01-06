-- Migration: Update lands table for ownership
-- Add ownership and marketplace features to lands

DO $$ 
BEGIN 
    -- owner_id (reference to users)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='owner_id') THEN
        ALTER TABLE lands ADD COLUMN owner_id INTEGER REFERENCES users(id);
    END IF;

    -- price (marketplace pricing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='price') THEN
        ALTER TABLE lands ADD COLUMN price NUMERIC(15, 2);
    END IF;

    -- condition (land quality)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='condition') THEN
        ALTER TABLE lands ADD COLUMN condition VARCHAR(20) CHECK (condition IN ('bruto', 'limpo', 'arado', 'growing', 'mature'));
    END IF;

    -- status (availability)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='status') THEN
        ALTER TABLE lands ADD COLUMN status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprado'));
    END IF;
END $$;

-- Create index for filtering available lands
CREATE INDEX IF NOT EXISTS lands_status_idx ON lands(status);
CREATE INDEX IF NOT EXISTS lands_owner_idx ON lands(owner_id);
