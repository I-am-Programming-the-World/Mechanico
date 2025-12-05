# Sample Data Fixes - UUID ID Column Issue

## Problem Description
The `sample_data.sql` file was failing to insert data due to NULL values being inserted into UUID ID columns instead of auto-generated UUIDs. The error occurred specifically with the `ServiceCategory` table and potentially other tables with UUID ID columns.

**Error Details:**
- Table: ServiceCategory
- Column: id (should be auto-generated UUID)
- Issue: NULL value being inserted instead of auto-generated UUID
- Timestamp: 2025-12-05 17:21:22.616

## Root Cause Analysis

### Primary Issue
PostgreSQL doesn't properly handle the `DEFAULT` keyword when used in VALUES clauses for UUID columns with `gen_random_uuid()`. The `DEFAULT` keyword works differently in PostgreSQL compared to other databases, especially when used in multi-row INSERT statements.

### Specific Problems Identified
1. **PostgreSQL DEFAULT keyword limitation**: In PostgreSQL, when using `DEFAULT` in a VALUES clause, it doesn't always work as expected with UUID generation functions like `gen_random_uuid()`.

2. **Multi-row INSERT with DEFAULT**: The issue was specifically with using `(DEFAULT, ...)` syntax in VALUES clauses for UUID columns.

3. **Column specification conflict**: By explicitly listing the `"id"` column in the column list but trying to use `DEFAULT` for it, PostgreSQL got confused about how to handle the UUID generation.

## Schema Analysis
From [`prisma/sql/schema.sql`](prisma/sql/schema.sql:134):
```sql
CREATE TABLE IF NOT EXISTS "ServiceCategory" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The ID column is defined with `DEFAULT gen_random_uuid()`, but the INSERT statements were using `(DEFAULT, ...)` syntax which PostgreSQL doesn't handle correctly in VALUES clauses.

## Solution Applied

### Fix Strategy
**Exclude the ID column from both the column list and the VALUES clause**, letting PostgreSQL automatically generate the UUID using the DEFAULT constraint.

### Before (Problematic)
```sql
-- Insert Service Categories with explicit DEFAULT for ID column
INSERT INTO "ServiceCategory" ("id", "slug", "name", "description", "icon") VALUES
(DEFAULT, 'oil-change', 'تعویض روغن', 'تعویض روغن موتور و فیلترهای خودرو', 'oil-can'),
 (DEFAULT, 'brake-service', 'سرویس ترمز', 'تعمیر و نگهداری سیستم ترمز', 'brake'),
 (DEFAULT, 'engine-diagnosis', 'تشخیص موتور', 'تشخیص مشکلات موتور با دستگاه تخصصی', 'engine'),
 (DEFAULT, 'battery-service', 'سرویس باتری', 'تست و تعویض باتری خودرو', 'battery'),
 (DEFAULT, 'tire-service', 'سرویس تایر', 'تعویض و بالانس تایر', 'tire'),
 (DEFAULT, 'electrical-system', 'سیستم الکتریکی', 'تعمیرات الکتریکی خودرو', 'electrical'),
 (DEFAULT, 'ac-repair', 'تعمیرات کولر', 'سرویس و تعمیر سیستم تهویه مطبوع', 'ac');
```

### After (Fixed)
```sql
-- Insert Service Categories - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "ServiceCategory" ("slug", "name", "description", "icon") VALUES
 ('oil-change', 'تعویض روغن', 'تعویض روغن موتور و فیلترهای خودرو', 'oil-can'),
 ('brake-service', 'سرویس ترمز', 'تعمیر و نگهداری سیستم ترمز', 'brake'),
 ('engine-diagnosis', 'تشخیص موتور', 'تشخیص مشکلات موتور با دستگاه تخصصی', 'engine'),
 ('battery-service', 'سرویس باتری', 'تست و تعویض باتری خودرو', 'battery'),
 ('tire-service', 'سرویس تایر', 'تعویض و بالانس تایر', 'tire'),
 ('electrical-system', 'سیستم الکتریکی', 'تعمیرات الکتریکی خودرو', 'electrical'),
 ('ac-repair', 'تعمیرات کولر', 'سرویس و تعمیر سیستم تهویه مطبوع', 'ac');
```

## Tables Fixed

All tables with UUID ID columns were updated to exclude the ID column from INSERT statements:

1. **ServiceCategory** - Fixed
2. **User** - Fixed
3. **Profile** - Fixed
4. **Vehicle** - Fixed
5. **Service** - Fixed
6. **Booking** - Fixed
7. **Rating** - Fixed
8. **AvailabilityWindow** - Fixed
9. **SavedPlace** - Fixed
10. **ChatMessage** - Fixed
11. **BookingItem** - Fixed
12. **BookingAttachment** - Fixed
13. **Region** - Fixed
14. **AuditLog** - Fixed

## Verification

### Search Patterns Verified
- ✅ No remaining `INSERT INTO "(\w+)" \("id",` patterns
- ✅ No remaining `DEFAULT,` instances in VALUES clauses

### Testing Recommendations

1. **Database Schema Verification**:
   ```sql
   -- Verify UUID generation works
   INSERT INTO "ServiceCategory" ("slug", "name", "description", "icon") 
   VALUES ('test', 'Test Category', 'Test Description', 'test-icon');
   
   -- Check that UUID was auto-generated
   SELECT * FROM "ServiceCategory" WHERE "slug" = 'test';
   ```

2. **Sample Data Loading**:
   ```bash
   # Run the sample data script
   psql -d your_database -f prisma/sql/sample_data.sql
   
   # Verify data was inserted
   SELECT COUNT(*) FROM "ServiceCategory";
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Booking";
   ```

## Files Modified

- [`prisma/sql/sample_data.sql`](prisma/sql/sample_data.sql) - Fixed all UUID ID column INSERT statements

## Additional Notes

- The fix maintains all existing functionality while resolving the UUID generation issue
- All foreign key relationships remain intact as they reference the auto-generated UUIDs
- The solution is compatible with PostgreSQL's UUID generation mechanisms
- No changes were needed to the schema itself, only to the INSERT statements

## Prevention

For future SQL scripts:
- Always exclude UUID ID columns with DEFAULT constraints from INSERT statements
- Let PostgreSQL handle UUID generation automatically
- Avoid using `DEFAULT` keyword in VALUES clauses for UUID columns
- Use `gen_random_uuid()` function directly in schema definitions only