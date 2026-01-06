-- Migration: Create base tables (PostGIS extension and lands table)
-- This is the foundation for the mapping system

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create lands table with geographic data
CREATE TABLE IF NOT EXISTS lands (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    area_sqm NUMERIC(15, 2),
    land_type VARCHAR(50) DEFAULT 'fertile_land',
    is_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for performance
CREATE INDEX IF NOT EXISTS lands_geom_idx ON lands USING GIST (geom);
