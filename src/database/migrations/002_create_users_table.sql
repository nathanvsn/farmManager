-- Migration: Create users table
-- User authentication and game economy
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    money NUMERIC(15, 2) DEFAULT 200000,
    diamonds INTEGER DEFAULT 200,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    silo_inventory JSONB DEFAULT '{"seeds": {}, "produce": {}}'::jsonb
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE INDEX IF NOT EXISTS users_nickname_idx ON users (nickname);