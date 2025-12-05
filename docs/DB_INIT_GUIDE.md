> Version: v0.2.0 | Last Updated: 2025-12-05
>
> # Mechanico Database Initialization Guide

This guide provides comprehensive instructions for initializing the Mechanico database with all necessary tables, indexes, constraints, and sample data including PostGIS spatial data.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Instructions](#detailed-instructions)
5. [Sample Data](#sample-data)
6. [PostGIS Setup](#postgis-setup)
7. [Safety Features](#safety-features)
8. [Troubleshooting](#troubleshooting)
9. [File Structure](#file-structure)

## Overview

The Mechanico database initialization includes:

- **PostGIS Extension**: For spatial data handling and geolocation queries
- **Complete Schema**: All tables based on the Prisma schema
- **Sample Data**: Realistic Persian/RTL data for Tehran region
- **Performance Indexes**: Optimized for common queries
- **Safety Mechanisms**: Preserves existing data when possible

### Key Features

- ✅ Safe execution on existing databases
- ✅ PostGIS spatial data support
- ✅ Persian/RTL sample data
- ✅ Comprehensive error handling
- ✅ Transaction rollback on errors
- ✅ Detailed logging and progress tracking

## Prerequisites

### Required Software

1. **PostgreSQL** (version 14 or higher)
2. **PostGIS** extension (version 3.0 or higher)
3. **psql** command-line tool
4. **Bash** (for the initialization script)

### Installation Commands

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-14-postgis-3
```

#### macOS (with Homebrew)
```bash
brew install postgresql postgis
```

#### Windows
Download and install from:
- [PostgreSQL](https://www.postgresql.org/download/windows/)
- [PostGIS](https://postgis.net/windows_downloads/)

## Quick Start

### 1. Make the script executable
```bash
chmod +x init-db.sh
```

### 2. Set environment variables
Create a `.env` file in the same directory as the script:
```bash
DATABASE_URL="postgres://username:password@localhost:5432/mechanico_dev"
```

### 3. Run the initialization script
```bash
./init-db.sh
```

### 4. Verify installation
```bash
psql -h localhost -U username -d mechanico_dev -c "SELECT COUNT(*) FROM \"User\";"
```

## Detailed Instructions

### Environment Setup

#### Option 1: Using .env file (Recommended)
Create a `.env` file in the script directory:
```bash
DATABASE_URL="postgres://username:password@localhost:5432/mechanico_dev"
DIRECT_URL="postgres://username:password@localhost:5432/mechanico_dev"
```

#### Option 2: Using command line arguments
```bash
./init-db.sh -u username -p password -h localhost -d mechanico_dev -P 5432
```

#### Option 3: Using environment variables
```bash
export DATABASE_URL="postgres://username:password@localhost:5432/mechanico_dev"
./init-db.sh
```

### Script Options

| Option | Description | Example |
|--------|-------------|---------|
| `-u, --user` | Database user | `-u postgres` |
| `-p, --password` | Database password | `-p mypassword` |
| `-h, --host` | Database host | `-h localhost` |
| `-d, --dbname` | Database name | `-d mechanico_dev` |
| `-P, --port` | Database port | `-P 5432` |
| `-f, --force` | Force re-initialization | `-f` |
| `-v, --verbose` | Verbose output | `-v` |
| `-h, --help` | Show help | `-h` |

### Examples

#### Basic initialization
```bash
./init-db.sh
```

#### With custom connection
```bash
./init-db.sh -u postgres -p password -h localhost -d mechanico_dev
```

#### Force initialization (use with caution)
```bash
./init-db.sh --force
```

#### Verbose mode for debugging
```bash
./init-db.sh --verbose
```

## Sample Data

The initialization script includes comprehensive sample data with:

### Users (12 total)
- **6 Customers**: محمد رضایی, علی محمدی, سارا حسینی, رضا کریمی, فاطمه ضریفی, حسین طاهری
- **5 Providers**: مهدی صبوری, احمد رضایی, جواد حسینی, مصطفی کریمی, رضا محمدی
- **1 Admin**: admin@example.com

### Vehicles (7 total)
- پژو 206 (2015)
- هیوندای سوناتا (2018)
- تویوتا کامری (2017)
- نیسان آلتیما (2016)
- بی ام و 320i (2019)
- بنز C200 (2020)
- Volkswagen پاسات (2018)

### Service Categories (7)
1. تعویض روغن (Oil Change)
2. سرویس ترمز (Brake Service)
3. تشخیص موتور (Engine Diagnosis)
4. سرویس باتری (Battery Service)
5. سرویس تایر (Tire Service)
6. سیستم الکتریکی (Electrical System)
7. تعمیرات کولر (AC Repair)

### Bookings (6)
- Completed oil change
- In-progress AC repair
- Pending tire replacement
- Confirmed electrical repair
- Cancelled full service
- Declined brake service

### Spatial Data
All locations are based in Tehran with coordinates:
- Latitude: 35.68° to 35.73°
- Longitude: 51.39° to 51.45°

## PostGIS Setup

### What Gets Installed

1. **PostGIS Extension**: Core spatial extension
2. **PostGIS Topology**: Topological data support
3. **Spatial Indexes**: For efficient geolocation queries
4. **Geometry Columns**: Computed columns for spatial operations

### Spatial Features

#### Geography vs Geometry
- **Profile.location**: Geography(Point, 4326) for accurate distance calculations
- **Booking.geom**: Geometry(Point, 4326) for efficient spatial queries
- **Region.polygon**: Geometry(MultiPolygon, 4326) for area containment

#### Indexes Created
```sql
-- Profile location indexes
CREATE INDEX "Profile_location_gix" ON "Profile" USING GIST ((location::geometry));
CREATE INDEX "Profile_location_geog_gix" ON "Profile" USING GIST (location);

-- Booking geometry index
CREATE INDEX "Booking_geom_gix" ON "Booking" USING GIST ("geom");

-- Region polygon index
CREATE INDEX "Region_polygon_gix" ON "Region" USING GIST ("polygon");
```

### Spatial Queries

#### Find providers within 5km
```sql
SELECT p."fullName", p."phone"
FROM "Profile" p
WHERE ST_DWithin(
    p.location, 
    ST_GeogFromText('POINT(51.4005 35.7047)'), 
    5000  -- 5km in meters
);
```

#### Find bookings in a region
```sql
SELECT b."id", b."addressLabel"
FROM "Booking" b
JOIN "Region" r ON r."name" = 'منطقه 3 تهران'
WHERE ST_Contains(r."polygon", b."geom");
```

## Safety Features

### Data Preservation
- **Conditional Creation**: Tables are only created if they don't exist
- **Safe Updates**: Existing data is never overwritten
- **Transaction Safety**: All operations are wrapped in transactions

### Error Handling
- **Connection Validation**: Script validates database connection before proceeding
- **Step-by-Step Execution**: Each step is executed and verified independently
- **Rollback on Error**: Failed operations are rolled back automatically

### Force Mode
Use `--force` flag only when:
- You want to re-initialize a development database
- You're sure you don't need existing data
- You're setting up a fresh environment

**Warning**: Force mode may cause conflicts with existing data.

## Troubleshooting

### Common Issues

#### 1. Connection Failed
```bash
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed
```
**Solution**: Check PostgreSQL is running and credentials are correct
```bash
sudo systemctl start postgresql  # Ubuntu/Debian
brew services start postgresql   # macOS
```

#### 2. PostGIS Extension Missing
```bash
ERROR:  extension "postgis" does not exist
```
**Solution**: Install PostGIS extension
```sql
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
```

#### 3. Permission Denied
```bash
ERROR:  permission denied for schema public
```
**Solution**: Grant necessary permissions to your user
```sql
GRANT ALL PRIVILEGES ON DATABASE mechanico_dev TO username;
GRANT ALL PRIVILEGES ON SCHEMA public TO username;
```

#### 4. Missing psql
```bash
bash: psql: command not found
```
**Solution**: Install PostgreSQL client tools
```bash
sudo apt install postgresql-client  # Ubuntu/Debian
brew install postgresql            # macOS
```

### Debug Mode
Use verbose mode to see detailed output:
```bash
./init-db.sh --verbose
```

### Manual Verification
Check if tables were created successfully:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Check sample data:
```sql
SELECT "fullName", "email" FROM "User" WHERE "role" = 'CUSTOMER';
SELECT "name", "basePrice" FROM "Service" LIMIT 5;
```

## File Structure

```
mechanico-database/
├── init-db.sh          # Main initialization script
├── schema.sql          # Database schema and tables
├── postgis_indexes.sql # PostGIS indexes and constraints
├── sample_data.sql     # Sample data with Persian content
├── DB_INIT_GUIDE.md    # This documentation file
└── .env                # Environment variables (optional)
```

### File Descriptions

#### `init-db.sh`
Bash script that orchestrates the entire initialization process:
- Parses command line arguments
- Validates database connection
- Executes SQL files in correct order
- Provides progress feedback
- Handles errors gracefully

#### `schema.sql`
Complete database schema including:
- Enum type definitions
- Table creation with proper constraints
- Foreign key relationships
- Index creation for performance
- Computed geometry columns

#### `postgis_indexes.sql`
PostGIS-specific optimizations:
- Spatial indexes for geography and geometry columns
- Performance indexes for common queries
- Constraint validation for spatial data

#### `sample_data.sql`
Comprehensive sample data:
- 12 users (customers, providers, admin)
- 7 vehicles with Iranian details
- 7 service categories
- 6 bookings with various statuses
- 6 ratings and reviews
- 5 saved places
- 4 chat messages
- 6 booking items
- 3 booking attachments
- 3 regions (Tehran areas)
- 4 audit log entries

## Performance Considerations

### Indexes
The script creates indexes on:
- User email and role
- Profile location (spatial)
- Booking status and dates
- Service provider and category
- Chat message timestamps
- Vehicle license plates

### Query Optimization
- Spatial queries use GIST indexes
- Common filter columns are indexed
- Foreign key relationships are optimized
- Computed columns reduce query complexity

## Security Notes

### Password Security
- Never commit passwords to version control
- Use environment variables for credentials
- Consider using PostgreSQL authentication methods

### Database Permissions
- Script assumes user has CREATE and INSERT privileges
- Restrict access to sensitive tables as needed
- Consider row-level security for production

## Next Steps

After successful database initialization:

1. **Update Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Verify Application**:
   - Check if users can log in
   - Test booking creation
   - Verify map functionality
   - Test search and filtering

4. **Production Deployment**:
   - Use production database credentials
   - Remove sample data
   - Configure proper backups
   - Set up monitoring

## Support

For issues or questions:
1. Check the troubleshooting section
2. Run with `--verbose` flag for detailed output
3. Verify PostgreSQL and PostGIS versions
4. Check database permissions and connectivity

## Contributing

To improve this initialization script:
1. Test on different PostgreSQL versions
2. Add more sample data scenarios
3. Improve error handling
4. Add more configuration options
5. Update documentation

---

**Note**: This script is designed for development and testing environments. For production deployments, review all settings and security considerations.