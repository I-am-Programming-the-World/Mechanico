# Mechanico – Database & Mapbox Guide

This document explains how the Mechanico MVP uses the database and Mapbox, and how to configure them for both local development and production.

Mechanico is built on:

- **Database**: PostgreSQL (Supabase) with PostGIS
- **ORM**: Prisma
- **API**: tRPC
- **Maps & Routing**: Mapbox (Maps + Directions + Geocoding)

All examples assume the project root is the repository root (where `package.json` and `prisma/schema.prisma` live).

---

## 1. Database Architecture Overview

Mechanico uses a fairly standard relational schema with some geo‑specific fields. The most important models for the MVP are:

- `User` / `Profile`
- `Vehicle`
- `ServiceCategory` / `Service`
- `Booking`
- `BookingOffer`
- `SavedPlace`
- `Region`

You can inspect the full schema in [`schema.prisma`](prisma/schema.prisma).

### 1.1 Key Models

#### 1.1.1 Booking

The `Booking` model represents a customer request for service.

Key fields (simplified):

- `id: String` – primary key (CUID)
- `status: BookingStatus` – e.g. `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `jobType: BookingJobType` – e.g. `ON_DEMAND`
- `price: Decimal` – base price for the job
- `date: DateTime` – creation time
- `scheduledAt: DateTime?` – optional scheduled time
- `problemDescription: String?`
- `addressLabel: String?`
- `latitude: Float`
- `longitude: Float`
- `customerId: String` – relation to `User`
- `providerId: String?` – relation to `User` (nullable; set when a provider accepts)
- `vehicleId: String`
- `serviceId: String`

Important notes:

- `providerId` is **nullable** in Prisma and in the DB. A booking is created without a provider and is assigned when a provider accepts an offer.
- `latitude` / `longitude` are simple numeric columns (not PostGIS types) for the booking location.

#### 1.1.2 BookingOffer

`BookingOffer` represents a broadcast offer of a booking to a provider.

Key fields:

- `id: String`
- `bookingId: String`
- `providerId: String`
- `status: BookingOfferStatus` – `SENT`, `ACCEPTED`, `EXPIRED`
- `createdAt: DateTime`
- `respondedAt: DateTime?`

When a booking is created, the backend creates `BookingOffer` rows for all providers that offer the selected service.

#### 1.1.3 SavedPlace

`SavedPlace` stores user‑saved locations (home, work, etc.):

- `id: String`
- `userId: String`
- `label: String`
- `latitude: Float`
- `longitude: Float`

These are used in the customer home Geocoder to quickly select common locations.

#### 1.1.4 Region (PostGIS)

`Region` is used for admin‑defined service regions and uses PostGIS:

- `id: String`
- `name: String`
- `polygon: Unsupported("geometry")` (or similar, depending on your Prisma/PostGIS mapping)

The project includes [`postgis_indexes.sql`](prisma/postgis_indexes.sql) to create spatial indexes.

---

## 2. Supabase / PostgreSQL Setup

Mechanico is designed to run against a Supabase PostgreSQL instance, but any PostgreSQL + PostGIS database will work.

### 2.1 Create a Supabase Project

1. Go to https://supabase.com and create a new project.
2. Choose a **strong password** for the database.
3. Once the project is created, go to:
   - **Project Settings → Database** to get:
     - `Host`
     - `Port`
     - `Database`
     - `User`
     - `Password`
   - **Project Settings → API** to get:
     - `Project URL`
     - `anon` and `service_role` keys (if needed later).

### 2.2 Initialize Database Schema

After creating your Supabase project, you need to initialize the database schema:

#### Option A: Using Prisma Migrate (Recommended)

1. Set up your environment variables:
   ```bash
   # Add to your .env file
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?schema=public"
   DIRECT_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?schema=public"
   ```

2. Run the initial migration:
   ```bash
   npx prisma migrate deploy
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

#### Option B: Manual SQL Execution

1. Download the schema files:
   - [`schema.sql`](schema.sql) - Complete database schema
   - [`postgis_indexes.sql`](prisma/postgis_indexes.sql) - Spatial indexes

2. In Supabase SQL Editor, run:
   ```sql
   -- Enable PostGIS extension
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   -- Run the complete schema
   -- (Paste contents of schema.sql here)
   ```

3. Apply spatial indexes:
   ```sql
   -- Run contents of postgis_indexes.sql
   ```

#### Option C: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g @supabase/supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push local schema:
   ```bash
   supabase db push
   ```

### 2.2 Enable PostGIS

Supabase usually ships with PostGIS enabled, but if not, run:

```sql
create extension if not exists postgis;
```

You can run this in the Supabase SQL editor.

### 2.3 Configure Prisma Connection URL

In your project root, set the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Example:

```env
DATABASE_URL="postgresql://postgres:my-strong-password@db.xxxxx.supabase.co:5432/postgres?schema=public"
```

Do **not** commit real credentials to Git.

### 2.3 SSL Configuration & Security

Supabase enforces SSL connections by default. Ensure your connection string includes SSL parameters:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
```

#### SSL Certificate Verification

For production deployments, enable SSL certificate verification:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
```

#### Security Best Practices

1. **Row Level Security (RLS)**: Enable RLS on sensitive tables:
   ```sql
   ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
   ```

2. **Service Role Key**: Use the service role key only for server-side operations that need to bypass RLS.

3. **Connection Pooling**: Supabase uses PgBouncer for connection pooling. Monitor connection usage in the dashboard.

---

## 3. Prisma Migrations and Drift

Mechanico uses Prisma migrations to manage schema changes. However, when working with a remote database (like Supabase), you must be careful not to drop data.

### 3.1 Basic Prisma Commands

From the project root:

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations in dev (local DB)
npx prisma migrate dev

# Inspect DB schema
npx prisma studio
```

For a remote production DB, you typically:

- Use `prisma migrate deploy` (not `migrate dev`).
- Avoid `prisma migrate reset` (it drops data).

### 3.2 Making `Booking.providerId` Nullable

The MVP requires `Booking.providerId` to be nullable so that bookings can be created without an assigned provider.

In `schema.prisma`, the `Booking` model should have:

```prisma
providerId String?
provider   User?   @relation("jobs", fields: [providerId], references: [id])
```

If your remote DB still has `providerId` as `NOT NULL`, you will see drift when running `prisma migrate dev` or `prisma migrate diff`.

#### 3.2.1 Safe Manual Fix on Remote DB

To fix this without dropping data:

1. Connect to your Supabase SQL editor.
2. Run:

```sql
ALTER TABLE "Booking"
  ALTER COLUMN "providerId" DROP NOT NULL;
```

3. If you previously stored empty strings (`''`) as a dummy provider ID, normalize them to `NULL`:

```sql
UPDATE "Booking"
SET "providerId" = NULL
WHERE "providerId" = '';
```

4. After this, run:

```bash
npx prisma generate
```

Now Prisma and the DB agree that `providerId` is nullable.

---

## 4. PostGIS and Regions

Mechanico uses PostGIS for region polygons and some region‑based queries.

### 4.1 Applying PostGIS Indexes

The file [`postgis_indexes.sql`](prisma/postgis_indexes.sql) contains recommended indexes. To apply them:

1. Open the file and review the statements.
2. Run them in your Supabase SQL editor.

Example (simplified):

```sql
-- Example: create a GIST index on Region polygon
CREATE INDEX IF NOT EXISTS "Region_polygon_gist"
ON "Region"
USING GIST ("polygon");
```

### 4.2 Region‑Based Queries

The `customerRouter.getBookingCounts` and some admin queries may use PostGIS functions like `ST_Contains` or `ST_Within` to filter bookings by region.

Ensure:

- `Region.polygon` is stored as a PostGIS geometry type.
- The SRID (spatial reference) is consistent (commonly 4326 for lat/lng).

---

## 5. Mapbox Integration

Mechanico uses Mapbox for:

- Map rendering (Mapbox GL JS via a React wrapper).
- Driving directions.
- Reverse geocoding (to show human‑readable addresses in Persian).

### 5.1 Create a Mapbox Account and Token

1. Go to https://account.mapbox.com.
2. Create an account and log in.
3. Go to **Tokens** and create a new **Public** token.
4. Restrict the token to your domains if desired (e.g. `localhost:3000`, `your-vercel-domain.vercel.app`).

### 5.2 Environment Variables

In `.env.local` (for local dev) and in your deployment environment (Vercel, etc.), set:

```env
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-public-token-here"
```

This token is used on the client side by the map components and helpers.

### 5.3 Map Container

The main map component is [`MapContainer`](src/components/map/map-container.tsx:1). It:

- Renders a full‑screen Mapbox map.
- Accepts:
  - `center` (lat/lng)
  - `markers`
  - `onMove` callback (for map move events)
  - `onClick` callback (for map clicks)
  - Optional `route` polyline for directions.

The customer home screen [`CustomerHomeContent`](src/app/customer/customer-home-content.tsx:1) uses `MapContainer` with:

- A fixed center pin overlay.
- `onMove` to update the center and pin when confirming location.
- `onClick` to optionally set the pin.

### 5.4 Directions Helper

File: [`directions.ts`](src/lib/mapbox/directions.ts:1)

This helper calls the Mapbox Directions API:

- Input: origin and destination `{ lat, lng }`.
- Output: route coordinates and duration in minutes.

Used in [`BookingDetailPage`](src/app/customer/bookings/%5Bid%5D/page.tsx:1) to show an approximate route and duration.

Ensure:

- `NEXT_PUBLIC_MAPBOX_TOKEN` is set.
- The Mapbox Directions API is enabled for your token.

### 5.5 Reverse Geocoding Helper

File: [`reverse-geocode.ts`](src/lib/mapbox/reverse-geocode.ts:1)

This helper calls the Mapbox Geocoding API:

- Input: `lat`, `lng`.
- Output: `place_name` (string) or `null`.

Mechanico uses:

- `language=fa` to get Persian addresses.
- `limit=1` to get the best match.

In [`CustomerHomeContent`](src/app/customer/customer-home-content.tsx:1):

- `reverseGeocode` is called whenever the center pin changes.
- The result is stored in `addressText`.
- The top bar and center pin bubble show this address, giving a Snapp/Uber‑like UX.

---

## 6. Booking Lifecycle and DB Interactions

This section summarizes how the backend uses the DB during the booking lifecycle.

### 6.1 Booking Creation

Router: [`bookingRouter.create`](src/server/api/routers/booking.ts:5)

Steps:

1. Validate input (serviceId, vehicleId, lat, lng, description, scheduledAt, addressLabel).
2. Fetch `Service` to get `basePrice`.
3. Create a `Booking` with:
   - `status = "PENDING"`
   - `jobType = "ON_DEMAND"`
   - `price = service.basePrice`
   - `date = now`
   - `scheduledAt` (if provided)
   - `problemDescription`, `addressLabel`
   - `latitude`, `longitude`
   - `customerId` from session
   - `vehicleId`, `serviceId`
   - `providerId = null`
4. Create `BookingOffer` rows for all providers that offer this service.

### 6.2 Provider Accepts / Declines Offer

Router: [`providerRouter.acceptOffer`](src/server/api/routers/provider.ts:96)

- Checks that a `BookingOffer` exists for this provider and booking with `status = "SENT"`.
- Updates `Booking`:
  - `providerId = current provider`
  - `status = "CONFIRMED"`
- Updates `BookingOffer`:
  - `status = "ACCEPTED"`
  - `respondedAt = now`

Router: [`providerRouter.declineOffer`](src/server/api/routers/provider.ts:172)

- Marks matching offers as `EXPIRED` with `respondedAt = now`.

### 6.3 Provider Starts / Completes Job

Router: [`bookingRouter.startJob`](src/server/api/routers/booking.ts:73)

- Ensures:
  - Booking exists.
  - `booking.providerId = current provider`.
  - `booking.status = "CONFIRMED"`.
- Updates `status = "IN_PROGRESS"`.

Router: [`bookingRouter.completeJob`](src/server/api/routers/booking.ts:97)

- Ensures:
  - Booking exists.
  - `booking.providerId = current provider`.
  - `booking.status = "IN_PROGRESS"`.
- Updates `status = "COMPLETED"`.

### 6.4 Customer Cancels Booking

Router: [`bookingRouter.cancel`](src/server/api/routers/booking.ts:97) (added for MVP)

- Ensures:
  - Booking exists.
  - `booking.customerId = current user`.
- If status is `COMPLETED` or `CANCELLED`, returns booking unchanged.
- Otherwise, updates `status = "CANCELLED"`.

The customer detail screen [`BookingDetailPage`](src/app/customer/bookings/%5Bid%5D/page.tsx:1) calls this mutation from the “Cancel booking” dialog.

---

## 7. Local Development Checklist

1. Create Supabase project and enable PostGIS.
2. Set `DATABASE_URL` in `.env`.
3. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`.
4. Run:

   ```bash
   npm install
   npx prisma generate
   npm run dev
   ```

5. Open http://localhost:3000.

For more detailed deployment and operations steps (including Vercel/GitHub), see `DEPLOYMENT-GUIDE.md`.
