> Version: v0.2.0 | Last Updated: 2025-12-05
>
> # Mechanico — Map‑centric On‑Demand Vehicle Services Platform

Mechanico is a full‑stack, mobile‑first web application that connects customers with vehicle service providers (mechanics) in real time. It delivers an app‑like experience (similar to ride‑hailing apps) for requesting on‑demand vehicle services, tracking jobs, and managing provider workflows, with a strong focus on RTL and Persian UX.

---

## Introduction

### What is Mechanico?

Mechanico is an on‑demand vehicle services platform for the Iranian market that helps customers quickly find reliable nearby mechanics and manage their service requests end‑to‑end.

The platform provides:

- Real‑time, map‑centric booking for roadside and workshop services
- A mobile‑first, app‑shell layout with bottom navigation and bottom sheets
- A fully RTL, Persian interface across all screens
- Dedicated experiences for:
  - Customers (requesting and tracking services)
  - Providers (accepting jobs and managing offers)
  - Admins (configuring regions and system data)

### High‑Level Architecture

Mechanico is built on a modern TypeScript‑first stack:

- **Next.js App Router (v15.x)** for full‑stack React and routing
- **React + TypeScript** for strongly‑typed UI and logic
- **Tailwind CSS** for utility‑first styling and app‑shell layout
- **Vaul** for mobile bottom‑sheet booking flows
- **Mapbox** via [`react-map-gl`](https://visgl.github.io/react-map-gl/) for interactive maps and geocoding
- **tRPC** for end‑to‑end type‑safe APIs
- **NextAuth** for authentication and session management
- **Prisma ORM** for database access
- **Supabase Postgres** as the hosted database
- **PostGIS** for spatial data and geospatial queries

### Design Principles

The UI is designed as a mobile app that happens to run in the browser:

- **Mobile‑first app shell**
  - Max‑width mobile container with full‑height layout
  - Safe‑area padding for notches and rounded corners
- **RTL + Persian everywhere**
  - Root layout configured with `lang="fa"` and `dir="rtl"`
  - All user‑facing copy in Persian
  - Icons and layout mirrored for RTL
- **App shell layout**
  - Top safe‑area header
  - Full‑screen content (map or lists)
  - Bottom navigation and/or Vaul bottom sheet
- **Map‑centric interaction**
  - Fixed center pin; the user drags the map, not the marker
  - Location selection is the first step of the booking flow

---

## Tech Stack

### Frontend

- **Next.js 15 (App Router)** — routing and server components
- **React 18 + TypeScript**
- **Tailwind CSS v4** — styling and layout
- **Vaul** — bottom sheet for booking flows
- **Radix UI** (e.g. AlertDialog, Tabs) for accessible primitives
- **Lucide React** — icon set
- **Mapbox GL + [`react-map-gl`](https://visgl.github.io/react-map-gl/)** — interactive maps and camera control

Key UI primitives and layout components:

- [`Button`](src/components/ui/button.tsx:1) — shared button with variants and sizes
- [`Skeleton`](src/components/ui/skeleton.tsx:1) — loading skeletons
- [`BottomNav`](src/components/nav/bottom-nav.tsx:1) — mobile bottom navigation for customer flows
- [`TopNav`](src/components/nav/top-nav.tsx:1) — desktop‑only header

### Backend & Data

- **tRPC 11** — type‑safe API layer
  - Routers under [`src/server/api/routers`](src/server/api/routers)
- **Prisma ORM** — schema and migrations
  - [`schema.prisma`](prisma/schema.prisma:1)
- **Supabase Postgres** — managed Postgres database
- **PostGIS** — spatial extension for location queries
  - Additional indexes in [`postgis_indexes.sql`](prisma/postgis_indexes.sql:1)
- **NextAuth v5** — authentication and sessions
  - Config under [`src/server/auth`](src/server/auth)
- **Prisma client singleton** — [`db.ts`](src/server/db.ts:1)

### Tooling

- **ESLint + TypeScript ESLint** — linting
- **Prettier + Tailwind plugin** — formatting
- **TypeScript** — strict typing
- **npm** — package manager

See [`package.json`](package.json:1) for scripts and versions.

---

## Features / Screens

### Customer Experience

#### 1. Customer Home (`/customer`)

Map‑centric home screen with a fixed center pin and booking drawer.

- **Full‑screen Mapbox map**
  - Implemented via [`MapContainer`](src/components/map/map-container.tsx:1)
  - User drags the map; the center pin stays fixed
- **Top bar with dynamic Persian label**
  - Label reflects booking state, e.g.:
    - `در حال تعیین موقعیت...`
    - `موقعیت انتخاب‌شده`
    - `انتخاب آدرس`
- **Geocoder overlay**
  - Address search overlay using [`Geocoder`](src/components/map/geocoder.tsx:1)
- **Booking drawer (Vaul bottom sheet)**
  - Implemented by [`BookingDrawer`](src/components/booking/booking-drawer.tsx:1)
  - Multi‑step flow with collapsed / medium / full snap states
  - Step indicator: `مرحله X از Y`
  - Booking states (conceptual):
    - `SELECTING_SERVICE`
    - `CONFIRMING_LOCATION`
    - `ADD_DETAILS`
    - `SELECTING_VEHICLE`
    - `SELECTING_PROVIDER`
    - `AWAITING_CONFIRMATION`
    - `TRACKING`

Key entry point:

- [`customer-home-content.tsx`](src/app/customer/customer-home-content.tsx:1) — orchestrates map, geocoder, and booking drawer.

#### 2. Bookings List (`/customer/bookings`)

Mobile list of customer bookings.

- Status badges (e.g. pending, in progress, completed)
- Summary info:
  - Date/time
  - Price
  - Provider name
  - Address label
- Tap to open booking detail

Page:

- [`/customer/bookings/page.tsx`](src/app/customer/bookings/page.tsx:1)

#### 3. Booking Detail (`/customer/bookings/[id]`)

Detailed view of a single booking.

- **Summary card**
  - Status
  - Times (created, scheduled, completed)
  - Price
  - Description
  - Address label
- **Tracker**
  - Visual status/timeline via [`BookingTracker`](src/components/booking/booking-tracker.tsx:1)
- **Map section**
  - Route and ETA visualization (via Mapbox utilities such as [`directions.ts`](src/lib/mapbox/directions.ts:1))
- **Bottom actions**
  - Active bookings:
    - Chat with provider
    - Cancel booking (Radix `AlertDialog` confirmation)
  - Completed bookings:
    - `سفارش مجدد` (rebook)
    - `ثبت نظر` (leave a rating/review)

Page:

- [`/customer/bookings/[id]/page.tsx`](src/app/customer/bookings/[id]/page.tsx:1)

#### 4. Profile (`/customer/profile`)

Basic customer profile shell.

- High‑level purpose:
  - Manage personal info and preferences
  - Manage vehicles and saved places (conceptually aligned with models in [`schema.prisma`](prisma/schema.prisma:59))
- Implementation entry:
  - [`/customer/profile/page.tsx`](src/app/customer/profile/page.tsx:1)

### Provider Experience

#### Provider Panel (`/provider`)

Mobile provider dashboard for managing jobs and offers.

- **Online banner**
  - Shows provider status and region, e.g.:
    - `وضعیت شما: آنلاین`
    - `منطقه: تهران`
- **Active job card (demo)**
  - Current job summary
  - CTAs:
    - `شروع مسیر`
    - `تماس با مشتری`
- **Tabs**
  - `سفارش‌ها` (Jobs)
  - `پیشنهادها` (Offers)
- **Jobs tab**
  - List of jobs with status badges
  - CTAs:
    - `قبول درخواست`
    - `رد درخواست`
    - `شروع مسیر`
    - `اتمام کار`
- **Offers tab**
  - List of offers with:
    - TTL / countdown
    - Problem summary
    - Price
  - CTAs:
    - `قبول`
    - `رد کردن`

Main client component:

- [`provider.client.tsx`](src/app/provider/provider.client.tsx:1)

### Admin Experience

#### Admin Shell (`/admin`)

High‑level admin dashboard entry.

- Used for:
  - Viewing system status
  - Navigating to admin tools (e.g. regions, configuration)

Page:

- [`/admin/page.tsx`](src/app/admin/page.tsx:1)

#### Regions Management (`/admin/regions`)

Basic admin view for managing service regions.

- High‑level capabilities:
  - View and manage regions used for provider matching and coverage
  - Regions are backed by spatial models and PostGIS polygons (see `Region` model and indexes in [`schema.prisma`](prisma/schema.prisma:1) and [`postgis_indexes.sql`](prisma/postgis_indexes.sql:12))

Page:

- [`/admin/regions/page.tsx`](src/app/admin/regions/page.tsx:1)

---

## Architecture

### App Shell & Layout

- Root layout: [`src/app/layout.tsx`](src/app/layout.tsx:1)
  - Sets `lang="fa"` and `dir="rtl"`
  - Provides global app shell and theming
- Customer layout: [`src/app/customer/layout.tsx`](src/app/customer/layout.tsx:1)
  - Wraps customer pages in a mobile app shell
  - Integrates [`BottomNav`](src/components/nav/bottom-nav.tsx:1)
- Global styles: [`globals.css`](src/styles/globals.css:1)
  - Tailwind base and custom utilities
  - RTL helpers
  - Safe‑area padding and app‑shell layout classes

### Navigation

- **Bottom navigation** — [`BottomNav`](src/components/nav/bottom-nav.tsx:1)
  - Fixed at the bottom of the mobile shell
  - Used in customer flows
- **Top navigation** — [`TopNav`](src/components/nav/top-nav.tsx:1)
  - Desktop‑only header for navigation and branding

### Map & Geocoding

- **Map container** — [`MapContainer`](src/components/map/map-container.tsx:1)
  - Wraps `react-map-gl` and Mapbox GL
  - Handles viewport, center pin, and map events
- **Geocoder overlay** — [`Geocoder`](src/components/map/geocoder.tsx:1)
  - Address search and selection
  - Updates map center and booking location
- **Directions utilities** — [`directions.ts`](src/lib/mapbox/directions.ts:1)
  - Route and ETA calculations

### Booking Components

- **Booking drawer** — [`BookingDrawer`](src/components/booking/booking-drawer.tsx:1)
  - Vaul bottom sheet with multiple snap points
  - Manages the booking state machine (service, location, details, vehicle, provider, confirmation, tracking)
- **Booking tracker** — [`BookingTracker`](src/components/booking/booking-tracker.tsx:1)
  - Visual timeline of booking status
- **Selectors**
  - [`service-selector.tsx`](src/components/booking/service-selector.tsx:1)
  - [`vehicle-selector.tsx`](src/components/booking/vehicle-selector.tsx:1)
  - [`provider-list.tsx`](src/components/booking/provider-list.tsx:1)

### Backend & API

- **Prisma client singleton** — [`db.ts`](src/server/db.ts:1)
  - Ensures a single Prisma client instance across Next.js hot reloads
- **tRPC root & setup**
  - [`root.ts`](src/server/api/root.ts:1) — combines routers
  - [`trpc.ts`](src/server/api/trpc.ts:1) — tRPC context and helpers
  - API route handler: [`[trpc]/route.ts`](src/app/api/trpc/[trpc]/route.ts:1)
- **Routers** — [`src/server/api/routers`](src/server/api/routers)
  - [`admin.ts`](src/server/api/routers/admin.ts:1) — admin operations (regions, configuration, etc.)
  - [`booking.ts`](src/server/api/routers/booking.ts:1) — booking lifecycle and tracking
  - [`customer.ts`](src/server/api/routers/customer.ts:1) — customer‑facing data (bookings, profile, saved places)
  - [`provider.ts`](src/server/api/routers/provider.ts:1) — provider jobs, offers, and status
  - [`service.ts`](src/server/api/routers/service.ts:1) — service catalog and categories
- **Auth**
  - Config: [`config.ts`](src/server/auth/config.ts:1)
  - Helpers: [`index.ts`](src/server/auth/index.ts:1)
  - NextAuth route: [`route.ts`](src/app/api/auth/[...nextauth]/route.ts:1)
- **Real‑time / events**
  - [`events.ts`](src/server/events.ts:1) — event helpers
  - [`ws.ts`](src/server/ws.ts:1) — WebSocket server (optional dev/infra)

---

## Deployment

Mechanico supports multiple deployment scenarios:

### Local Development
- **Database**: PostgreSQL with PostGIS
- **Setup**: Run `npm install && npx prisma generate && npm run dev`
- **Environment**: See [DB-MAPBOX-GUIDE.md](DB-MAPBOX-GUIDE.md) for database setup
- **Frontend**: http://localhost:3000

### Production Deployment
- **Platform**: Vercel (recommended) or any Node.js hosting
- **Database**: Supabase PostgreSQL with PostGIS
- **Guide**: See [DEPLOYMENT-SCENARIOS.md](DEPLOYMENT-SCENARIOS.md) for comprehensive deployment instructions

### Quick Start
1. Clone repository: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Initialize database: `npx prisma migrate deploy`
5. Start development server: `npm run dev`

For detailed deployment instructions, see:
- [Local Development](DEPLOYMENT-SCENARIOS.md#local-development)
- [Vercel Deployment](DEPLOYMENT-SCENARIOS.md#vercel-deployment)
- [Supabase Setup](DEPLOYMENT-SCENARIOS.md#supabase-setup)
- [Production Checklist](DEPLOYMENT-SCENARIOS.md#production-checklist)

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm**: 10+ (bundled with Node 18+)
- **Supabase project**:
  - Postgres database
  - PostGIS extension enabled
- **Mapbox account**:
  - Access token for Mapbox GL

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd t3-fullstack-app-master
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `.env` or `.env.local` and set the variables described in the next section.

### Running the App

- **Development**

  ```bash
  npm run dev
  ```

  This starts the Next.js dev server (default: `http://localhost:3000`).

- **Type‑checking and linting**

  ```bash
  npm run check      # next lint + tsc --noEmit
  npm run lint       # ESLint only
  npm run typecheck  # TypeScript only
  ```

- **Production build**

  ```bash
  npm run build
  npm start          # or: npm run preview (build + start)
  ```

---

## Environment Variables

Environment variables are validated via [`src/env.js`](src/env.js:1) using `@t3-oss/env-nextjs` and `zod`.

### Server‑side

Required / optional server‑side variables:

- `AUTH_SECRET`
  - Required in production (optional in development)
  - Used by NextAuth for signing/encryption
- `DATABASE_URL`
  - **Required**
  - Pooled connection string to Supabase Postgres (often port `6543`)
  - Used by Prisma at runtime
- `DIRECT_URL`
  - **Required**
  - Direct connection string to Supabase Postgres (often port `5432`)
  - Used by Prisma Migrate and `prisma db push`
- `NODE_ENV`
  - `development` | `test` | `production`
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL_BASE`
  - Optional
  - Used by S3 storage integration in [`s3.ts`](src/server/storage/s3.ts:1)

### Client‑side

Client‑exposed variables (must be prefixed with `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_MAPBOX_TOKEN`
  - Mapbox access token for [`MapContainer`](src/components/map/map-container.tsx:1) and related components
- `NEXT_PUBLIC_WS_URL`
  - Optional WebSocket URL for real‑time features (if using [`ws.ts`](src/server/ws.ts:1))

### Example `.env.local`

```env
# Auth
AUTH_SECRET=your-auth-secret

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:6543/postgres?schema=public
DIRECT_URL=postgresql://user:password@host:5432/postgres?schema=public

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Optional: WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Optional: S3 storage
S3_ACCESS_KEY_ID=your-s3-key
S3_SECRET_ACCESS_KEY=your-s3-secret
S3_BUCKET=your-bucket-name
S3_REGION=your-region
S3_PUBLIC_URL_BASE=https://your-bucket.s3.amazonaws.com
```

Do **not** commit real secrets to version control.

---

## Database & Migrations

### Prisma + Supabase

The Prisma schema is defined in [`schema.prisma`](prisma/schema.prisma:1):

- `datasource db`:
  - `provider = "postgresql"`
  - `url = env("DATABASE_URL")`
  - `directUrl = env("DIRECT_URL")`
  - `extensions = [postgis]`
- `generator client`:
  - `provider = "prisma-client-js"`
  - `previewFeatures = ["postgresqlExtensions"]`

Key model groups:

- **Authentication models** (NextAuth):
  - `User`, `Account`, `Session`, `VerificationToken`
- **Core domain models**:
  - `Vehicle`, `ServiceCategory`, `Service`, `Booking`, `Rating`, `SavedPlace`, `AuditLog`, `ChatMessage`, etc.
- **Spatial fields**:
  - `Profile.location` — `Unsupported("geography(Point,4326)")`
  - `Region.polygon` — polygon geometry (see indexes below)
  - `Booking` — derived `geom` column for spatial queries

### PostGIS & Spatial Indexes

Additional spatial indexes and constraints are defined in [`postgis_indexes.sql`](prisma/postgis_indexes.sql:1):

- GIST indexes on:
  - `Profile.location` (geometry and geography)
  - `Region.polygon`
  - `Booking.geom`
- Generated `geom` column on `Booking`:
  - `ST_SetSRID(ST_MakePoint("longitude","latitude"), 4326)`
- BTREE indexes for common filters:
  - `Booking.scheduledAt`
  - `Booking.providerId`
  - `Booking.customerId`
- Latitude/longitude range constraints on `Booking`

To apply these indexes (after enabling PostGIS and running migrations):

```bash
psql "$DATABASE_URL" -f prisma/postgis_indexes.sql
```

### Prisma Commands

Common Prisma commands (see [`package.json`](package.json:6)):

```bash
# Generate Prisma client
npm run db:generate   # prisma migrate dev (also generates client)

# Push schema to database (development)
npm run db:push       # prisma db push

# Apply migrations (production / CI)
npm run db:migrate    # prisma migrate deploy

# Open Prisma Studio
npm run db:studio     # prisma studio
```

---

## Development Guidelines

### UI & UX

#### App Shell & Layout

- Use the existing app shell patterns from:
  - [`layout.tsx`](src/app/layout.tsx:1)
  - [`customer/layout.tsx`](src/app/customer/layout.tsx:1)
- Keep layouts:
  - `min-h-dvh` for full viewport height
  - `max-w-md` (or similar) for mobile‑first width
  - Safe‑area padding for top and bottom
- Prefer bottom navigation and bottom sheets over sidebars or complex desktop dashboards.

#### RTL & Persian

- All user‑facing copy must be in Persian.
- Ensure `lang="fa"` and `dir="rtl"` remain set in the root layout.
- Right‑align text where appropriate and mirror icon positions for RTL.
- Use RTL‑aware utilities from [`globals.css`](src/styles/globals.css:1).

#### Shared Components

- **Buttons**
  - Use [`Button`](src/components/ui/button.tsx:1) for all primary/secondary actions.
  - Reuse existing variants and sizes instead of ad‑hoc Tailwind classes.
- **Skeletons**
  - Use [`Skeleton`](src/components/ui/skeleton.tsx:1) for loading states.
- **Map**
  - Use [`MapContainer`](src/components/map/map-container.tsx:1) for any map view.
  - Follow the fixed center‑pin pattern; do not move the pin directly.
- **Booking flows**
  - Use [`BookingDrawer`](src/components/booking/booking-drawer.tsx:1) and related components for new booking steps.
  - Maintain the step indicator pattern (`مرحله X از Y`).

### Code Style

- Language: **TypeScript** everywhere (`.ts` / `.tsx`).
- Linting and formatting:
  - `npm run lint` — Next.js + ESLint
  - `npm run check` — lint + TypeScript
  - `npm run format:check` / `npm run format:write` — Prettier (see [`prettier.config.js`](prettier.config.js:1))
- General guidelines:
  - Prefer small, focused components.
  - Use descriptive names for components, hooks, and variables.
  - Keep business logic in hooks or server functions, not in JSX trees.

### tRPC & Backend

- All app data should flow through tRPC routers under [`src/server/api/routers`](src/server/api/routers).
- When adding new features:
  - Define or extend a router (e.g. `customer`, `provider`, `booking`, `service`, `admin`).
  - Use `zod` schemas for input validation.
  - Access the database via the Prisma client from [`db.ts`](src/server/db.ts:1).
- On the client:
  - Use tRPC hooks from [`src/trpc/react.tsx`](src/trpc/react.tsx:1) and [`query-client.ts`](src/trpc/query-client.ts:1).

### Auth

- NextAuth configuration lives in:
  - [`config.ts`](src/server/auth/config.ts:1)
  - [`index.ts`](src/server/auth/index.ts:1)
  - API route: [`route.ts`](src/app/api/auth/[...nextauth]/route.ts:1)
- High‑level behavior:
  - Credentials‑based login with hashed passwords
  - Role‑based access (`CUSTOMER`, `PROVIDER`, `ADMIN`)
  - Prisma adapter for persistence
- When adding new protected routes or pages:
  - Check the user session and role server‑side.
  - Enforce role‑based access in tRPC procedures.

---

## Summary

Mechanico is a map‑centric, mobile‑first, RTL‑native platform for on‑demand vehicle services. It combines a modern Next.js App Router frontend with a tRPC + Prisma + Supabase/PostGIS backend, and uses Vaul bottom sheets and Mapbox maps to deliver an app‑like booking and tracking experience for customers, providers, and admins.

Use this README as the source of truth for:

- Project architecture and tech stack
- Core flows and screens
- Environment and database configuration
- Development and contribution guidelines
