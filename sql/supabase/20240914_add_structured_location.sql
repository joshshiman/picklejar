BEGIN;

-- 1. Add new columns (all nullable for backward compatibility)
ALTER TABLE public.suggestions
    ADD COLUMN structured_location JSONB,
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION,
    ADD COLUMN map_bounds JSONB,
    ADD COLUMN geo_source TEXT,
    ADD COLUMN location_confidence INTEGER,
    ADD COLUMN location_last_verified_at TIMESTAMPTZ;

-- 2. Seed structured_location with existing free-text value when possible
UPDATE public.suggestions
SET structured_location = jsonb_build_object('name', location)
WHERE structured_location IS NULL
  AND COALESCE(TRIM(location), '') <> '';

-- 3. Enforce valid latitude/longitude pairs
ALTER TABLE public.suggestions
    ADD CONSTRAINT suggestions_lat_lng_bounds CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (
            latitude BETWEEN -90 AND 90
            AND longitude BETWEEN -180 AND 180
        )
    );

-- 4. Partial index to accelerate map lookups
CREATE INDEX IF NOT EXISTS idx_suggestions_picklejar_lat_lng
    ON public.suggestions (picklejar_id, latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMIT;
