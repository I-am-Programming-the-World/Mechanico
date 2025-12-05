# Mechanico – Comprehensive Deployment Guide

This guide covers all deployment scenarios for the Mechanico platform, from local development to production environments. It provides detailed, actionable steps for each platform and scenario.

## Table of Contents

1. [Local Development](#local-development)
2. [Vercel Deployment](#vercel-deployment)
3. [Supabase Setup](#supabase-setup)
4. [GitHub Integration](#github-integration)
5. [Production Checklist](#production-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Database Setup

#### Option A: Supabase Local Development

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/supabase
   
   # Start local Supabase instance
   supabase start
   ```

2. **Initialize Database**
   ```bash
   # Link to local project
   supabase link --project-ref your-project-ref
   
   # Push schema
   supabase db push
   
   # Enable PostGIS
   supabase sql -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

3. **Set Environment Variables**
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
   DIRECT_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="development-secret-key"
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-mapbox-token"
   ```

#### Option B: Docker PostgreSQL with PostGIS

1. **Start PostgreSQL with PostGIS**
   ```bash
   docker run -d \
     --name mechanico-db \
     -e POSTGRES_DB=mechanico \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     postgis/postgis:15-3.4
   ```

2. **Initialize Schema**
   ```bash
   # Apply migrations
   npx prisma migrate dev
   
   # Generate client
   npx prisma generate
   
   # Apply PostGIS indexes
   psql postgresql://postgres:password@localhost:5432/mechanico -f prisma/postgis_indexes.sql
   ```

### Environment Variables

Create `.env.example` template:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-mapbox-token"

# Storage (Optional)
S3_ACCESS_KEY_ID="your-s3-key"
S3_SECRET_ACCESS_KEY="your-s3-secret"
S3_BUCKET_NAME="your-bucket"
S3_REGION="us-east-1"
S3_PUBLIC_URL_BASE="https://your-bucket.s3.amazonaws.com"

# Development
NODE_ENV="development"
```

### Local Build Process

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

4. **Access Applications**
   - Main: http://localhost:3000
   - Customer: http://localhost:3000/customer
   - Provider: http://localhost:3000/provider
   - Admin: http://localhost:3000/admin

### Local Development Best Practices

- Use Docker for consistent database environments
- Enable hot reload for faster development
- Use environment variable validation
- Set up ESLint and Prettier for code consistency

---

## Vercel Deployment

### Step-by-Step with Screenshots

#### Step 1: Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub
4. Select your Mechanico repository

![Vercel Import](https://assets.vercel.com/images/docs/v2/git/introduction/connect-repository.png)

#### Step 2: Configure Project Settings

```
Project Name: mechanico-app
Framework Preset: Next.js
Root Directory: /
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### Step 3: Environment Variable Mapping

Add these environment variables in Vercel dashboard:

**Production Variables:**

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full` | Supabase connection |
| `DIRECT_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` | Direct DB connection |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production URL |
| `NEXTAUTH_SECRET` | `your-nextauth-secret` | NextAuth encryption |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.your-token` | Mapbox client token |

**Optional Variables:**

| Variable | Value | Description |
|----------|-------|-------------|
| `S3_ACCESS_KEY_ID` | `your-key` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `your-secret` | S3 secret key |
| `S3_BUCKET_NAME` | `your-bucket` | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Access your live application

### Vercel-Specific Configurations

Create `vercel.json`:

```json
{
  "version": 2,
  "regions": ["sfo1"],
  "functions": {
    "src/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### Vercel Environment Templates

**Development Environment:**
```env
NODE_ENV="development"
NEXTAUTH_URL="https://dev-your-project.vercel.app"
```

**Preview Environment:**
```env
NODE_ENV="production"
NEXTAUTH_URL="https://pr-xx-your-project.vercel.app"
```

**Production Environment:**
```env
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"
```

### Vercel Performance Optimization

1. **Enable Edge Network**
   - Configure `next.config.js` for edge runtime
   - Use `export const runtime = 'edge'` for API routes

2. **Image Optimization**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       remotePatterns: [
         {
           protocol: 'https',
           hostname: '**.supabase.co',
         },
       ],
     },
   }
   ```

3. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

---

## Supabase Setup

### Database Initialization

#### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Configure:
   - Name: `mechanico-prod`
   - Region: Choose closest to users
   - Database Password: Set strong password

#### Step 2: Enable PostGIS

In SQL Editor, run:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
SELECT PostGIS_Version();
```

#### Step 3: Initialize Schema

**Option A: Using Prisma Migrate**

```bash
# Set environment variables
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
export DIRECT_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

**Option B: Manual SQL**

```sql
-- Run schema.sql content
-- Run postgis_indexes.sql content
```

#### Step 4: Set up Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY "Users can view own profile" ON "Profile"
  FOR ALL USING (auth.uid() = "userId");

CREATE POLICY "Users can view own bookings" ON "Booking"
  FOR ALL USING (auth.uid() = "customerId" OR auth.uid() = "providerId");
```

### PostGIS Enablement

#### Spatial Indexes

```sql
-- Create GIST indexes for spatial queries
CREATE INDEX IF NOT EXISTS "Profile_location_gix"
  ON "Profile" USING GIST (location);

CREATE INDEX IF NOT EXISTS "Region_polygon_gix"
  ON "Region" USING GIST (polygon);

CREATE INDEX IF NOT EXISTS "Booking_geom_gix"
  ON "Booking" USING GIST (geom);
```

#### Spatial Functions

```sql
-- Example: Find bookings within 5km of a point
SELECT * FROM "Booking"
WHERE ST_DWithin(
  geom,
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
  5000 -- 5km in meters
);
```

### SSL Certificates

#### SSL Configuration

**Development (Require SSL):**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
```

**Production (Verify Full):**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
```

#### Certificate Verification

1. **Download Supabase Root Certificate**
   ```bash
   curl -o root.crt https://app.supabase.com/rest/v1/
   ```

2. **Configure Connection**
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full&sslrootcert=root.crt"
   ```

### Supabase Security Best Practices

1. **Service Role Key Management**
   - Use service role key only for server-side operations
   - Never expose in client-side code
   - Rotate keys regularly

2. **Authentication Policies**
   ```sql
   -- Create secure policies
   CREATE POLICY "Users can insert own profiles" ON "Profile"
     FOR INSERT WITH CHECK (auth.uid() = "userId");
   ```

3. **Database Monitoring**
   - Enable audit logging
   - Monitor connection usage
   - Set up performance alerts

---

## GitHub Integration

### Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.NEXT_PUBLIC_MAPBOX_TOKEN }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

### Preview Deployments

#### Branch Protection Rules

1. Go to GitHub Repository Settings
2. Navigate to "Branches"
3. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

#### Preview Environment Variables

```yaml
# .github/workflows/preview.yml
name: Preview Deployment
on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--preivew'
```

### CI/CD Pipeline

#### Development Workflow

```mermaid
graph TD
    A[Feature Branch] --> B[Push to GitHub]
    B --> C[Pull Request]
    C --> D[Run Tests]
    D --> E[Preview Deployment]
    E --> F[Code Review]
    F --> G[Merge to Main]
    G --> H[Production Deployment]
    H --> I[Post-Deploy Tests]
```

#### Pipeline Stages

1. **Code Quality Checks**
   ```yaml
   - name: Lint
     run: npm run lint
   
   - name: Type Check
     run: npm run typecheck
   
   - name: Format Check
     run: npm run format:check
   ```

2. **Testing**
   ```yaml
   - name: Unit Tests
     run: npm test
   
   - name: E2E Tests
     run: npm run test:e2e
   ```

3. **Build Verification**
   ```yaml
   - name: Build
     run: npm run build
   ```

4. **Deployment**
   ```yaml
   - name: Deploy to Staging
     if: github.ref != 'refs/heads/main'
   
   - name: Deploy to Production
     if: github.ref == 'refs/heads/main'
   ```

#### GitHub Secrets Configuration

Required secrets for CI/CD:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel deployment token | `your-vercel-token` |
| `VERCEL_ORG_ID` | Vercel organization ID | `org-12345` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `proj-12345` |
| `DATABASE_URL` | Production database URL | `postgresql://...` |
| `DIRECT_URL` | Direct database URL | `postgresql://...` |
| `NEXTAUTH_SECRET` | NextAuth secret | `your-secret` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token | `pk.your-token` |

---

## Production Checklist

### Security

#### Authentication & Authorization

- [ ] **NextAuth Configuration**
  ```env
  NEXTAUTH_SECRET="generate-with-openssl-rand-32-hex"
  NEXTAUTH_URL="https://your-domain.com"
  ```

- [ ] **Database Security**
  - Enable Row Level Security (RLS)
  - Create minimal permission policies
  - Audit existing policies

- [ ] **API Security**
  - Implement rate limiting
  - Add CORS configuration
  - Validate all inputs with Zod

- [ ] **Environment Variables**
  - Use strong, unique values
  - Never commit secrets to repository
  - Use different secrets for each environment

#### SSL/TLS Configuration

- [ ] **Certificate Management**
  - Enable SSL verification
  - Use `sslmode=verify-full` in production
  - Configure certificate pinning if needed

- [ ] **HTTPS Enforcement**
  ```javascript
  // middleware.ts
  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  }

  export default async function middleware(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
      if (request.headers.get('x-forwarded-proto') !== 'https') {
        return Response.redirect(
          `https://${request.headers.get('host')}${request.nextUrl.pathname}`
        )
      }
    }
  }
  ```

#### Data Protection

- [ ] **Backup Strategy**
  - Enable automated Supabase backups
  - Test restore procedures
  - Document disaster recovery plan

- [ ] **Data Encryption**
  - Encrypt sensitive fields at application level
  - Use Supabase column-level encryption for PII
  - Implement secure file storage

### Performance

#### Database Optimization

- [ ] **Connection Pooling**
  ```env
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require&pgbouncer=true"
  ```

- [ ] **Query Optimization**
  - Add appropriate indexes
  - Use connection pooling
  - Implement query caching

- [ ] **Spatial Query Performance**
  ```sql
  -- Ensure spatial indexes are used
  EXPLAIN ANALYZE
  SELECT * FROM "Booking"
  WHERE ST_DWithin(geom, point, distance);
  ```

#### Application Performance

- [ ] **Bundle Optimization**
  ```javascript
  // next.config.js
  module.exports = {
    experimental: {
      appDir: true,
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
      formats: ['image/webp', 'image/avif'],
    },
  }
  ```

- [ ] **Caching Strategy**
  - Implement Redis for session storage
  - Use Vercel Edge Cache for static content
  - Add API response caching

- [ ] **Monitoring**
  - Set up performance monitoring
  - Track Core Web Vitals
  - Monitor database query performance

#### CDN & Asset Optimization

- [ ] **Static Assets**
  - Use Vercel Edge Network
  - Optimize images with Next.js Image component
  - Enable gzip/brotli compression

- [ ] **Map Tiles Optimization**
  ```javascript
  // Use Mapbox CDN with appropriate caching
  const mapStyle = {
    version: 8,
    sources: {
      'mapbox': {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'mapbox',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  };
  ```

### Monitoring

#### Application Monitoring

- [ ] **Error Tracking**
  - Set up Sentry or similar service
  - Configure error alerts
  - Monitor error rates and trends

- [ ] **Performance Monitoring**
  - Track API response times
  - Monitor database query performance
  - Set up alerting for slow queries

- [ ] **User Analytics**
  - Implement usage tracking
  - Monitor user engagement metrics
  - Track conversion funnels

#### Infrastructure Monitoring

- [ ] **Database Monitoring**
  - Monitor connection counts
  - Track query performance
  - Set up alerts for high CPU/memory usage

- [ ] **Application Monitoring**
  - Monitor Vercel deployment metrics
  - Track error rates
  - Set up uptime monitoring

- [ ] **Security Monitoring**
  - Monitor authentication attempts
  - Track suspicious activity
  - Set up security alerts

#### Logging Strategy

```javascript
// src/lib/logger.ts
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

export default logger;
```

---

## Troubleshooting

### Common Errors and Solutions

#### Local Development Issues

**Error: Database connection failed**
```bash
# Check if PostgreSQL is running
pg_ctl status

# Check connection string format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Solution:**
- Ensure PostgreSQL is running
- Verify connection string format
- Check firewall settings

**Error: Prisma migration failed**
```bash
# Reset database (development only)
npx prisma migrate reset

# Or fix migration manually
npx prisma migrate dev --name fix-migration
```

**Error: Port already in use**
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Vercel Deployment Issues

**Error: Build failed**
```
Error: Cannot find module 'prisma'
```

**Solution:**
```yaml
# vercel.json
{
  "functions": {
    "src/**/*.ts": {
      "includeFiles": ["**/*.prisma"]
    }
  }
}
```

**Error: Environment variables not found**
- Check Vercel dashboard → Settings → Environment Variables
- Ensure variables are set for the correct environment
- Verify variable names match code references

**Error: API routes not working**
```javascript
// api/trpc/[trpc]/route.ts
export const runtime = 'edge'; // Add this for Vercel
```

#### Supabase Issues

**Error: SSL connection failed**
```env
# Use correct SSL mode
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
```

**Error: Row Level Security violations**
```sql
-- Check existing policies
SELECT * FROM pg_policy WHERE polrelid = '"Booking"'::regclass;

-- Create missing policy
CREATE POLICY "Users can view own bookings" ON "Booking"
  FOR ALL USING (auth.uid() = "customerId" OR auth.uid() = "providerId");
```

**Error: PostGIS functions not available**
```sql
-- Verify PostGIS is enabled
SELECT PostGIS_Version();

-- Re-enable if needed
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### Authentication Issues

**Error: NextAuth callback failed**
```env
# Ensure NEXTAUTH_URL matches deployment URL
NEXTAUTH_URL="https://your-domain.vercel.app"
```

**Error: Session not persisting**
```javascript
// src/server/auth/config.ts
export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**Error: CSRF token mismatch**
- Ensure `NEXTAUTH_SECRET` is set
- Check domain configuration
- Verify HTTPS enforcement

#### Mapbox Issues

**Error: Map not loading**
```javascript
// Check token validity
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!token) {
  console.error('Mapbox token not found');
}
```

**Error: Geocoding failed**
- Verify token has geocoding permissions
- Check domain whitelist in Mapbox dashboard
- Ensure API key is not rate limited

**Error: Directions API not working**
```javascript
// Check API response
fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${token}`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
```

### Platform-Specific Debugging

#### Vercel-Specific Issues

**Cold Start Problems**
```javascript
// Optimize API routes for cold starts
export const config = {
  maxDuration: 30, // 30 seconds max
  memory: '1GB',   // 1GB memory
};
```

**Edge Runtime Issues**
```javascript
// api/example/route.ts
export const runtime = 'edge'; // Use edge runtime

export async function GET() {
  // Edge-compatible code
  return Response.json({ message: 'Hello from edge' });
}
```

**Build Time Optimization**
```json
// package.json
{
  "scripts": {
    "build": "next build --profile",
    "analyze": "next build --analyze"
  }
}
```

#### Supabase-Specific Issues

**Connection Pool Exhaustion**
```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - INTERVAL '5 minutes';
```

**Query Performance Issues**
```sql
-- Analyze slow queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "Booking" WHERE status = 'PENDING';

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_booking_status ON "Booking"(status);
```

**Storage Issues**
```javascript
// Check bucket permissions
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('user-uploads', {
    search: 'user-id'
  });
```

#### Local Development Issues

**Hot Reload Not Working**
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.watchOptions.poll = 300;
    return config;
  },
}
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix type errors
npx tsc --noEmit --pretty
```

**ESLint/Prettier Conflicts**
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@vercel/style-guide/eslint"
  ]
}
```

### Debugging Techniques

#### Logging and Monitoring

```javascript
// src/lib/debug.ts
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Usage in components
debugLog('Booking created', bookingData);
```

#### Performance Profiling

```javascript
// Performance monitoring
export function measurePerformance(name: string) {
  if (typeof window !== 'undefined') {
    performance.mark(`${name}-start`);
    
    return () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration}ms`);
    };
  }
}
```

#### Error Boundaries

```tsx
// components/ErrorBoundary.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong:</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

#### Database Debugging

```javascript
// src/lib/db-debug.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', e.duration);
});
```

### Getting Help

#### Documentation Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

#### Community Support

- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://supabase.com/discord)
- [Vercel Community](https://vercel.com/community)
- [GitHub Discussions](https://github.com/your-repo/discussions)

#### Professional Support

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Next.js Enterprise**: https://nextjs.org/enterprise

---

## Quick Reference

### Command Cheatsheet

```bash
# Local Development
npm install              # Install dependencies
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Apply migrations (local)
npm run dev              # Start development server

# Production Deployment
npx prisma migrate deploy # Apply migrations (production)
npm run build            # Build for production
npm start                # Start production server

# Database Management
npx prisma studio        # Open Prisma Studio
npx prisma db pull       # Pull schema from database
npx prisma format        # Format Prisma schema

# Testing & Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript check
npm run format:check     # Check code formatting
npm test                 # Run tests
```

### Environment Variable Templates

**Development (.env.local):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mechanico"
DIRECT_URL="postgresql://postgres:password@localhost:5432/mechanico"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-development-token"
```

**Production (.env.production):**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret-key"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-production-token"
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL verification
- [ ] Set up Row Level Security
- [ ] Configure environment variables
- [ ] Enable monitoring and logging
- [ ] Set up backup procedures
- [ ] Test disaster recovery
- [ ] Review access permissions
- [ ] Enable rate limiting
- [ ] Configure CORS policies

### Performance Checklist

- [ ] Enable compression
- [ ] Optimize images
- [ ] Configure caching
- [ ] Monitor Core Web Vitals
- [ ] Optimize database queries
- [ ] Enable connection pooling
- [ ] Use CDN for static assets
- [ ] Implement lazy loading
- [ ] Monitor resource usage
- [ ] Set up performance alerts

---

This comprehensive guide covers all aspects of deploying and maintaining the Mechanico platform across different environments. For specific issues or questions, refer to the troubleshooting section or consult the platform-specific documentation.