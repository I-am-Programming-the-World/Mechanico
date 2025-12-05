> Version: v0.2.0 | Last Updated: 2025-12-05
>
> # Mechanico Database Initialization - Quick Reference

## Files Created

### 1. `init-db.sh` - Main Initialization Script
**Purpose**: Orchestrates the entire database initialization process
**Features**:
- Command-line argument parsing
- Database connection validation
- Step-by-step execution with progress feedback
- Comprehensive error handling
- Safety checks to preserve existing data

**Usage**:
```bash
chmod +x init-db.sh
./init-db.sh
```

### 2. `schema.sql` - Complete Database Schema
**Purpose**: Creates all tables, indexes, constraints, and enum types
**Includes**:
- PostGIS extension enabling
- All 16 tables from Prisma schema
- 16 enum types for data integrity
- 40+ indexes for performance
- Foreign key constraints
- Check constraints for data validation

**Key Tables**:
- Authentication: Account, Session, VerificationToken
- Core: User, Profile, Vehicle, ServiceCategory, Service
- Business: Booking, Rating, AuditLog, ChatMessage
- Support: SavedPlace, BookingItem, BookingAttachment
- Scheduling: AvailabilityWindow, AvailabilityException, BookingOffer
- Geography: Region

### 3. `sample_data.sql` - Comprehensive Sample Data
**Purpose**: Inserts realistic Persian/RTL data for testing and development
**Includes**:
- **12 Users**: 6 customers, 5 providers, 1 admin
- **7 Vehicles**: Iranian license plates and common models
- **7 Service Categories**: With Persian descriptions
- **6 Bookings**: Various statuses and types
- **6 Ratings**: 1-5 star reviews with Persian comments
- **5 Saved Places**: Tehran addresses
- **4 Chat Messages**: Customer-provider communication
- **6 Booking Items**: Service line items
- **3 Booking Attachments**: Images and videos
- **3 Regions**: Tehran area polygons
- **4 Audit Logs**: System events

**Sample Data Highlights**:
- Persian names: محمد رضایی, سارا حسینی, مهدی صبوری
- Tehran coordinates: 35.7047°N, 51.4005°E
- Iranian vehicle models: پژو 206, هیوندای سوناتا
- Local service descriptions in Persian

### 4. `postgis_indexes.sql` - Spatial Optimization
**Purpose**: Creates PostGIS-specific indexes and constraints
**Includes**:
- Geography and geometry indexes
- Spatial containment indexes
- Performance optimization for geolocation queries
- Constraint validation for lat/lng ranges

### 5. `DB_INIT_GUIDE.md` - Comprehensive Documentation
**Purpose**: Complete guide for database initialization
**Includes**:
- Step-by-step instructions
- Troubleshooting guide
- Performance considerations
- Security notes
- Examples and best practices

## Key Features Implemented

### ✅ Safety Mechanisms
- **Conditional Creation**: Tables only created if they don't exist
- **Data Preservation**: Existing data is never overwritten
- **Force Mode**: Optional re-initialization with `--force` flag
- **Transaction Safety**: Rollback on errors

### ✅ PostGIS Integration
- **Extension Setup**: Automatic PostGIS enabling
- **Spatial Data**: Geography and geometry columns
- **Performance Indexes**: GIST indexes for spatial queries
- **Computed Columns**: Automatic geometry generation

### ✅ Persian/RTL Support
- **Unicode Support**: Full UTF-8 encoding
- **RTL Text**: Right-to-left Persian text
- **Local Content**: Tehran addresses and Iranian names
- **Cultural Context**: Local service descriptions

### ✅ Performance Optimization
- **40+ Indexes**: Optimized for common queries
- **Spatial Indexes**: Efficient geolocation operations
- **Foreign Key Indexes**: Fast relationship queries
- **Composite Indexes**: Multi-column search optimization

### ✅ Error Handling
- **Connection Validation**: Pre-execution checks
- **Step-by-Step Verification**: Independent step execution
- **Detailed Logging**: Progress and error reporting
- **Graceful Rollback**: Automatic cleanup on failure

## Usage Examples

### Basic Initialization
```bash
./init-db.sh
```

### With Custom Connection
```bash
./init-db.sh -u postgres -p password -h localhost -d mechanico_dev
```

### Force Re-initialization
```bash
./init-db.sh --force
```

### Verbose Mode
```bash
./init-db.sh --verbose
```

## Verification Commands

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Sample Data
```sql
SELECT "fullName", "email", "role" FROM "User";
SELECT "name", "basePrice" FROM "Service";
SELECT COUNT(*) FROM "Booking";
```

### Test Spatial Data
```sql
SELECT "fullName", "addressLine1" 
FROM "Profile" 
WHERE location IS NOT NULL;
```

## File Structure
```
mechanico-database/
├── init-db.sh          # Main initialization script
├── schema.sql          # Database schema and tables
├── postgis_indexes.sql # PostGIS indexes and constraints
├── sample_data.sql     # Sample data with Persian content
├── DB_INIT_GUIDE.md    # Comprehensive documentation
└── README-INIT.md      # This quick reference
```

## Next Steps

1. **Set Permissions**:
   ```bash
   chmod +x init-db.sh
   ```

2. **Configure Environment**:
   ```bash
   echo 'DATABASE_URL="postgres://user:pass@host:port/db"' > .env
   ```

3. **Run Initialization**:
   ```bash
   ./init-db.sh
   ```

4. **Verify Installation**:
   ```bash
   psql -h localhost -U user -d db -c "SELECT COUNT(*) FROM \"User\";"
   ```

5. **Update Prisma Client**:
   ```bash
   npx prisma generate
   ```

6. **Start Application**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check PostgreSQL is running
2. **PostGIS Missing**: Install PostGIS extension
3. **Permission Denied**: Grant database privileges
4. **Missing psql**: Install PostgreSQL client

### Debug Mode
```bash
./init-db.sh --verbose
```

### Manual Verification
See `DB_INIT_GUIDE.md` for detailed troubleshooting steps.

---

**Note**: This initialization script is designed for development and testing. For production, review all security settings and remove sample data.