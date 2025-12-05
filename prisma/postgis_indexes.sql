-- Create GIST index on Profile.location (geography(Point, 4326)) for efficient spatial queries
-- Run this once after enabling PostGIS extension
CREATE INDEX IF NOT EXISTS "Profile_location_gix"
ON "Profile"
USING GIST ((location::geometry));

-- Optional: direct geography index (recommended for ST_DWithin on geography)
CREATE INDEX IF NOT EXISTS "Profile_location_geog_gix"
ON "Profile"
USING GIST (location);

-- Create GIST index on Region.polygon for polygon containment performance
CREATE INDEX IF NOT EXISTS "Region_polygon_gix"
ON "Region"
USING GIST ("polygon");

-- Add generated geometry column on Booking for faster spatial filters (Point 4326)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Booking' AND column_name = 'geom'
  ) THEN
    ALTER TABLE "Booking"
    ADD COLUMN "geom" geometry(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint("longitude","latitude"), 4326)
    ) STORED;
  END IF;
END
$$;

-- GIST index on Booking.geom
CREATE INDEX IF NOT EXISTS "Booking_geom_gix"
ON "Booking"
USING GIST ("geom");

-- BTREE indexes to speed up admin/provider/customer queries
CREATE INDEX IF NOT EXISTS "Booking_scheduledAt_idx" ON "Booking" ("scheduledAt");
CREATE INDEX IF NOT EXISTS "Booking_providerId_idx"   ON "Booking" ("providerId");
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx"   ON "Booking" ("customerId");

-- Enforce lat/lng ranges (if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'Booking' AND constraint_name = 'booking_lat_range'
  ) THEN
    ALTER TABLE "Booking"
    ADD CONSTRAINT booking_lat_range CHECK ("latitude" BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'Booking' AND constraint_name = 'booking_lng_range'
  ) THEN
    ALTER TABLE "Booking"
    ADD CONSTRAINT booking_lng_range CHECK ("longitude" BETWEEN -180 AND 180);
  END IF;
END
$$;