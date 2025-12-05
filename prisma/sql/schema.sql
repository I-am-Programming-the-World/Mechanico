-- Mechanico Database Schema
-- =============================
-- This SQL file creates all tables, indexes, and constraints
-- based on the Prisma schema for the Mechanico platform.
--
-- Features:
-- - PostGIS extension for spatial data
-- - Comprehensive indexes for performance
-- - Proper foreign key constraints
-- - Enum types for data integrity

-- Removed empty_check table - not needed for schema
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create enum types for data integrity
DO $$
BEGIN
    -- UserRole enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
    END IF;
    
    -- BookingStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingstatus') THEN
        CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED');
    END IF;
    
    -- BookingType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingtype') THEN
        CREATE TYPE "BookingType" AS ENUM ('ON_DEMAND', 'SCHEDULED');
    END IF;
    
    -- AttachmentType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachmenttype') THEN
        CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
    END IF;
    
    -- OfferStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offerstatus') THEN
        CREATE TYPE "OfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'EXPIRED');
    END IF;
END
$$;

-- Create tables

-- Authentication tables (Next-Auth.js)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "expires" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core application tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE,
    "emailVerified" TIMESTAMP WITH TIME ZONE,
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" DEFAULT 'CUSTOMER',
    "isApproved" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "timezone" TEXT,
    "roleNote" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "location" GEOGRAPHY(POINT, 4326),
    "prefersAtHomeService" BOOLEAN DEFAULT TRUE,
    "prefersWorkshop" BOOLEAN DEFAULT FALSE,
    "yearsOfExperience" INTEGER,
    "bio" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "licensePlate" TEXT,
    "vin" TEXT UNIQUE,
    "color" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ServiceCategory" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "status" "BookingStatus" DEFAULT 'PENDING',
    "jobType" "BookingType" DEFAULT 'ON_DEMAND',
    "price" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    "problemDescription" TEXT,
    "addressLabel" TEXT,
    "cancellationFee" DOUBLE PRECISION,
    "declineReason" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "geom" GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)) STORED
);

CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "score" INTEGER NOT NULL CHECK ("score" >= 1 AND "score" <= 5),
    "comment" TEXT,
    "bookingId" TEXT UNIQUE NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorId" TEXT NOT NULL,
    "bookingId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SavedPlace" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "isRead" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "BookingItem" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BookingAttachment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AvailabilityWindow" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
    "startMinute" INTEGER NOT NULL CHECK ("startMinute" >= 0 AND "startMinute" <= 1439),
    "endMinute" INTEGER NOT NULL CHECK ("endMinute" >= 0 AND "endMinute" <= 1439),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AvailabilityException" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL CHECK ("startMinute" >= 0 AND "startMinute" <= 1439),
    "endMinute" INTEGER NOT NULL CHECK ("endMinute" >= 0 AND "endMinute" <= 1439),
    "isAvailable" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BookingOffer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "OfferStatus" DEFAULT 'SENT',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "respondedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "Region" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "polygon" GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes

-- Authentication indexes
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");
CREATE INDEX IF NOT EXISTS "VerificationToken_identifier_idx" ON "VerificationToken" ("identifier");

-- User and Profile indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role");
CREATE INDEX IF NOT EXISTS "User_isApproved_idx" ON "User" ("isApproved");

CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile" ("userId");
CREATE INDEX IF NOT EXISTS "Profile_location_gix" ON "Profile" USING GIST ((location::geometry));
CREATE INDEX IF NOT EXISTS "Profile_location_geog_gix" ON "Profile" USING GIST (location);

-- Vehicle indexes
CREATE INDEX IF NOT EXISTS "Vehicle_userId_idx" ON "Vehicle" ("userId");
CREATE INDEX IF NOT EXISTS "Vehicle_licensePlate_idx" ON "Vehicle" ("licensePlate");

-- Service indexes
CREATE INDEX IF NOT EXISTS "Service_providerId_idx" ON "Service" ("providerId");
CREATE INDEX IF NOT EXISTS "Service_categoryId_idx" ON "Service" ("categoryId");
CREATE INDEX IF NOT EXISTS "Service_isActive_idx" ON "Service" ("isActive");

-- Booking indexes
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking" ("customerId");
CREATE INDEX IF NOT EXISTS "Booking_providerId_idx" ON "Booking" ("providerId");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking" ("serviceId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking" ("status");
CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking" ("date");
CREATE INDEX IF NOT EXISTS "Booking_scheduledAt_idx" ON "Booking" ("scheduledAt");
CREATE INDEX IF NOT EXISTS "Booking_geom_gix" ON "Booking" USING GIST ("geom");
CREATE INDEX IF NOT EXISTS "Booking_lat_lng_check" ON "Booking" (("latitude" BETWEEN -90 AND 90), ("longitude" BETWEEN -180 AND 180));

-- Rating indexes
CREATE INDEX IF NOT EXISTS "Rating_bookingId_idx" ON "Rating" ("bookingId");
CREATE INDEX IF NOT EXISTS "Rating_customerId_idx" ON "Rating" ("customerId");
CREATE INDEX IF NOT EXISTS "Rating_providerId_idx" ON "Rating" ("providerId");

-- AuditLog indexes
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog" ("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_bookingId_idx" ON "AuditLog" ("bookingId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- SavedPlace indexes
CREATE INDEX IF NOT EXISTS "SavedPlace_userId_idx" ON "SavedPlace" ("userId");

-- ChatMessage indexes
CREATE INDEX IF NOT EXISTS "ChatMessage_bookingId_idx" ON "ChatMessage" ("bookingId");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx" ON "ChatMessage" ("senderId");
CREATE INDEX IF NOT EXISTS "ChatMessage_sentAt_idx" ON "ChatMessage" ("sentAt");

-- BookingItem indexes
CREATE INDEX IF NOT EXISTS "BookingItem_bookingId_idx" ON "BookingItem" ("bookingId");

-- BookingAttachment indexes
CREATE INDEX IF NOT EXISTS "BookingAttachment_bookingId_idx" ON "BookingAttachment" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAttachment_uploaderId_idx" ON "BookingAttachment" ("uploaderId");
CREATE INDEX IF NOT EXISTS "BookingAttachment_createdAt_idx" ON "BookingAttachment" ("createdAt");

-- Availability indexes
CREATE INDEX IF NOT EXISTS "AvailabilityWindow_providerId_idx" ON "AvailabilityWindow" ("providerId");
CREATE INDEX IF NOT EXISTS "AvailabilityWindow_dayOfWeek_idx" ON "AvailabilityWindow" ("dayOfWeek");

CREATE INDEX IF NOT EXISTS "AvailabilityException_providerId_idx" ON "AvailabilityException" ("providerId");
CREATE INDEX IF NOT EXISTS "AvailabilityException_dateKey_idx" ON "AvailabilityException" ("dateKey");

-- BookingOffer indexes
CREATE INDEX IF NOT EXISTS "BookingOffer_bookingId_idx" ON "BookingOffer" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingOffer_providerId_idx" ON "BookingOffer" ("providerId");
CREATE INDEX IF NOT EXISTS "BookingOffer_status_idx" ON "BookingOffer" ("status");
CREATE INDEX IF NOT EXISTS "BookingOffer_createdAt_idx" ON "BookingOffer" ("createdAt");

-- Region indexes
CREATE INDEX IF NOT EXISTS "Region_parentId_idx" ON "Region" ("parentId");
CREATE INDEX IF NOT EXISTS "Region_polygon_gix" ON "Region" USING GIST ("polygon");

-- Create foreign key constraints

-- Account foreign keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Session foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Profile foreign keys
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vehicle foreign keys
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Service foreign keys
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking foreign keys
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" 
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" 
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" 
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rating foreign keys
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_customerId_fkey" 
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuditLog foreign keys
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" 
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SavedPlace foreign keys
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage foreign keys
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingItem foreign keys
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingAttachment foreign keys
ALTER TABLE "BookingAttachment" ADD CONSTRAINT "BookingAttachment_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingAttachment" ADD CONSTRAINT "BookingAttachment_uploaderId_fkey" 
    FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AvailabilityWindow foreign keys
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AvailabilityException foreign keys
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingOffer foreign keys
ALTER TABLE "BookingOffer" ADD CONSTRAINT "BookingOffer_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingOffer" ADD CONSTRAINT "BookingOffer_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Region foreign keys
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraints for composite keys
ALTER TABLE "BookingOffer" ADD CONSTRAINT "BookingOffer_bookingId_providerId_key" 
    UNIQUE ("bookingId", "providerId");

-- Add check constraints for data integrity
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_latitude_check" 
    CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_longitude_check" 
    CHECK ("longitude" BETWEEN -180 AND 180);

-- Create sequences for auto-increment fields if needed
-- Note: Using gen_random_uuid() for UUID generation, but sequences can be added for integer IDs if needed

-- Grant permissions (adjust as needed for your security requirements)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Log completion (removed - will be added in sample_data.sql)