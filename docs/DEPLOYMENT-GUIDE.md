
> Version: v0.2.0 | Last Updated: 2025-12-05
>
> # Mechanico – Deployment & Operations Guide

This document provides **step‑by‑step instructions** to deploy Mechanico across different environments:

- **Local Development** – Database setup, environment variables, local build
- **Vercel Deployment** – Step-by-step with environment variable mapping
- **Supabase Setup** – Database initialization, PostGIS enablement, SSL certificates
- **GitHub Integration** – Actions workflow, preview deployments, CI/CD pipeline

Mechanico is a **single Next.js App Router project** that serves both frontend and backend (tRPC API routes, NextAuth, etc.). You do **not** deploy a separate backend service; Vercel hosts everything.

---

## 1. Prerequisites

Before you start, you should have:

- A **GitHub** account.
- A **Vercel** account (you can sign in with GitHub).
- A **Supabase** project (PostgreSQL + PostGIS).
- A **Mapbox** account and public access token.
- Node.js **18+** installed locally.

---

## 2. Local Development

### 2.1 Clone the Repository

```bash
git clone <YOUR_MECHANICO_REPO_URL>
cd t3-fullstack-app-master   # or your repo directory name
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment Variables

Create `.env` and `.env.local` in the project root.

#### 2.3.1 `.env` – server‑side secrets

```env
# PostgreSQL / Supabase
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"

# NextAuth (example; adjust to your auth provider)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a-long-random-secret"

# S3 or object storage (if used)
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket"
S3_REGION="your-region"
S3_ENDPOINT="https://your-endpoint"  # optional, e.g. for MinIO or custom S3
```

Check [`src/server/auth/config.ts`](src/server/auth/config.ts:1) and [`src/server/storage/s3.ts`](src/server/storage/s3.ts:1) for any additional required variables.

#### 2.3.2 `.env.local` – client‑side tokens

```env
# Mapbox public token (client-side)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-public-mapbox-token"

# Any other NEXT_PUBLIC_* variables go here
```

**Important:** Never commit real secrets. `.env` and `.env.local` should be in `.gitignore`.

### 2.4 Database Setup

#### Option A: Using Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Enable PostGIS extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Initialize schema:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database and user
3. Apply migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

### 2.5 Run the App Locally

```bash
npm run dev
```

Then open:

- http://localhost:3000 – main entry
- http://localhost:3000/customer – customer app
- http://localhost:3000/provider – provider app
- http://localhost:3000/admin – admin panel

The dev server includes:

- Frontend (Next.js pages/components).
- API routes (tRPC, NextAuth, etc.).
- Hot reload for both client and server code.

---

## 3. Vercel Deployment

### 3.1 Prerequisites

- GitHub repository with your Mechanico code
- Vercel account connected to GitHub

### 3.2 Step-by-Step Deployment

1. **Import Project**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Click "Continue"

2. **Configure Project**
   - Framework Preset: "Next.js" (auto-detected)
   - Root Directory: `/` (project root)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

3. **Environment Variables**
   Add these environment variables in Vercel dashboard:

   **Production Variables:**
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   NEXTAUTH_URL="https://your-project.vercel.app"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-mapbox-token"
   ```

   **Optional Storage Variables:**
   ```env
   S3_ACCESS_KEY_ID="your-s3-key"
   S3_SECRET_ACCESS_KEY="your-s3-secret"
   S3_BUCKET_NAME="your-bucket"
   S3_REGION="us-east-1"
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Access your live application

### 3.3 Environment Variable Mapping

| Local Variable | Vercel Variable | Description |
|----------------|-----------------|-------------|
| `DATABASE_URL` | `DATABASE_URL` | Supabase connection string |
| `DIRECT_URL` | `DIRECT_URL` | Direct DB connection for migrations |
| `NEXTAUTH_URL` | `NEXTAUTH_URL` | Production URL for NextAuth |
| `NEXTAUTH_SECRET` | `NEXTAUTH_SECRET` | NextAuth encryption secret |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox client token |

---

## 4. Supabase Setup

### 4.1 Create Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project:
   - Name: `mechanico-prod`
   - Region: Choose closest to your users
   - Database Password: Set a strong password

### 4.2 Database Initialization

1. **Enable PostGIS**
   - Go to SQL Editor in Supabase dashboard
   - Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Initialize Schema**
   - Option A: Using Prisma
     ```bash
     npx prisma migrate deploy
     ```
   - Option B: Manual SQL
     - Run contents of [`schema.sql`](schema.sql)
     - Run contents of [`prisma/postgis_indexes.sql`](prisma/postgis_indexes.sql)

3. **Set up Row Level Security (RLS)**
   ```sql
   ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
   ```

### 4.3 SSL Configuration

Supabase enforces SSL by default. Use these connection string formats:

**Development:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
```

**Production:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full"
```

### 4.4 Database Monitoring

1. **Connection Pooling**
   - Supabase uses PgBouncer
   - Monitor connections in Database → Connection Pooling

2. **Performance Monitoring**
   - Go to Database → Settings → Monitoring
   - Set up alerts for:
     - Connection count
     - CPU usage
     - Storage usage

---

## 5. GitHub Integration

### 5.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.NEXT_PUBLIC_MAPBOX_TOKEN }}
```

### 5.2 Preview Deployments

Vercel automatically creates preview deployments for pull requests:

1. Connect your GitHub repository to Vercel
2. Enable "Preview Deployments" in project settings
3. Each PR will get a unique URL for testing

### 5.3 CI/CD Pipeline

**Development Workflow:**
1. Create feature branch
2. Push changes to GitHub
3. Open pull request
4. Vercel creates preview deployment
5. Test functionality
6. Merge to main
7. Vercel deploys to production

**Environment Variables in GitHub:**
- Go to Repository Settings → Secrets and Variables → Actions
- Add production secrets:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## 6. Production Checklist

### 6.1 Security

- [ ] Enable SSL verification in production
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Enable Row Level Security on sensitive tables
- [ ] Configure CORS policies
- [ ] Set up API rate limiting
- [ ] Review Supabase project permissions

### 6.2 Performance

- [ ] Enable Vercel Edge Network
- [ ] Configure image optimization
- [ ] Set up database connection pooling
- [ ] Enable query caching where appropriate
- [ ] Monitor bundle size

### 6.3 Monitoring

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure performance monitoring
- [ ] Set up database monitoring alerts
- [ ] Monitor Vercel deployment metrics
- [ ] Track user analytics (if needed)

### 6.4 Backup & Recovery

- [ ] Enable automated database backups in Supabase
- [ ] Set up manual backup procedures
- [ ] Test restore process
- [ ] Document disaster recovery plan

---

## 7. Troubleshooting

### 7.1 Common Issues

**Database Connection Errors:**
- Check `DATABASE_URL` format
- Verify SSL mode settings
- Ensure firewall allows connections

**Authentication Failures:**
- Verify `NEXTAUTH_URL` matches deployment URL
- Check `NEXTAUTH_SECRET` is set
- Ensure cookies are configured correctly

**Mapbox Not Loading:**
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is valid
- Check token permissions in Mapbox dashboard
- Ensure domain is whitelisted

**Build Failures:**
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for specific errors

### 7.2 Debugging Tools

- **Vercel Logs:** Project → Logs
- **Supabase Logs:** Database → Logs
- **Next.js Debug:** `NEXT_TELEMETRY_DISABLED=1`
- **Prisma Debug:** `DEBUG="prisma:*"`

### 7.3 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)