# Comprehensive Vercel Deployment Guide for Mechanico

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Connect your GitHub repository
3. **Supabase Project**: With PostgreSQL + PostGIS enabled
4. **Mapbox Access Token**: Public token for mapping functionality
5. **Node.js v18+**: Required for local development

## Step 1: Prepare Your Repository
1. Ensure your code is pushed to a GitHub repository
2. Verify `vercel.json` configuration exists in project root
3. Confirm all required environment variables are documented in `.env.example`

## Step 2: Vercel Project Setup
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project" and select your Mechanico repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: /
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Configure advanced settings:
```json
{
  "regions": ["sfo1"],
  "functions": {
    "src/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

## Step 3: Environment Variables Configuration
Add these variables in Vercel dashboard under Settings > Environment Variables:

### Production Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=verify-full` | Supabase connection string |
| `DIRECT_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` | Direct DB connection |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production URL for NextAuth |
| `NEXTAUTH_SECRET` | `generate-with-openssl-rand-32-hex` | NextAuth encryption secret |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.your-mapbox-token` | Mapbox client token |

### Optional Storage Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `S3_ACCESS_KEY_ID` | `your-s3-key` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `your-s3-secret` | S3 secret key |
| `S3_BUCKET_NAME` | `your-bucket` | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |

## Step 4: Deployment Process
1. Click "Deploy" to start the deployment process
2. Monitor build logs for errors:
   - Success: "Build completed successfully"
   - Failure: Check for missing dependencies or environment variables
3. Verify deployment URL (e.g., `https://mechanico-app.vercel.app`)

## Step 5: Post-Deployment Verification
1. **Home Page**: Visit root URL to ensure application loads
2. **API Routes**: Test `/api/trpc` endpoints (e.g., `/api/trpc/service.list`)
3. **Authentication**: Test sign-up/login functionality
4. **Map Functionality**: Verify maps load correctly
5. **Database Connection**: Check for any connection errors in logs

## Step 6: Configure Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `app.mechanico.com`)
3. Follow DNS verification steps
4. Enable HTTPS automatically

## Step 7: PostGIS Configuration for Vercel
1. Ensure PostGIS is enabled in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
2. Verify spatial indexes are applied:
```sql
CREATE INDEX "Profile_location_gix" ON "Profile" USING GIST (location);
```

## Verification Checklist
- [ ] Home page loads without errors
- [ ] Authentication flows work (signup/login)
- [ ] Map functionality displays correctly
- [ ] API endpoints return expected responses
- [ ] Database connections are secure (SSL verified)
- [ ] All environment variables are properly set
- [ ] No sensitive data exposed in client bundles

## Troubleshooting Common Issues
1. **Build Failures**:
   - Check Node.js version compatibility (requires v18+)
   - Verify all dependencies are installed (`npm install`)
   - Ensure environment variables are properly configured

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` format and SSL parameters
   - Check Supabase network access rules
   - Test connection locally using same credentials

3. **Authentication Failures**:
   - Confirm `NEXTAUTH_URL` matches deployment URL
   - Verify `NEXTAUTH_SECRET` is set correctly
   - Check session cookie configuration

4. **Map Loading Issues**:
   - Validate Mapbox token has correct permissions
   - Ensure domain is whitelisted in Mapbox dashboard
   - Confirm token is prefixed with `pk.`

## Maintenance & Updates
1. **Redeploy**: Push changes to main branch triggers automatic redeployment
2. **Rollbacks**: Use Vercel's deployment history to revert if needed
3. **Monitoring**: Set up logging and monitoring in Vercel dashboard
4. **Scaling**: Adjust serverless function memory/timeout as needed

## Security Best Practices
1. Enable SSL enforcement in production
2. Rotate secrets regularly (especially `NEXTAUTH_SECRET`)
3. Use Vercel's security headers configuration
4. Implement rate limiting for API routes
5. Enable Row Level Security in Supabase

## Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Connection Troubleshooting](https://supabase.com/docs/guides/database/connecting-to-postgres)

This guide was last updated: 2025-12-05