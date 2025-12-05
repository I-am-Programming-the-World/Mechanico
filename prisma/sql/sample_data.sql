-- Mechanico Sample Data
-- ======================
-- This SQL file inserts sample data for testing and development.
-- Includes Persian/RTL content and spatial data for Tehran region.
--
-- Data includes:
-- - Users (customers and providers)
-- - Profiles with Persian names and addresses
-- - Vehicles with Iranian license plates
-- - Service categories and services
-- - Bookings with spatial coordinates
-- - Ratings and reviews
-- - Availability windows for providers

-- Check if tables are empty before inserting data
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "User";
    
    IF user_count > 0 THEN
        RAISE NOTICE 'Database already contains data. Skipping sample data insertion.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Inserting sample data...';
END
$$;

-- Insert Service Categories - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "ServiceCategory" ("slug", "name", "description", "icon") VALUES
('oil-change', 'تعویض روغن', 'تعویض روغن موتور و فیلترهای خودرو', 'oil-can'),
('brake-service', 'سرویس ترمز', 'تعمیر و نگهداری سیستم ترمز', 'brake'),
('engine-diagnosis', 'تشخیص موتور', 'تشخیص مشکلات موتور با دستگاه تخصصی', 'engine'),
('battery-service', 'سرویس باتری', 'تست و تعویض باتری خودرو', 'battery'),
('tire-service', 'سرویس تایر', 'تعویض و بالانس تایر', 'tire'),
('electrical-system', 'سیستم الکتریکی', 'تعمیرات الکتریکی خودرو', 'electrical'),
('ac-repair', 'تعمیرات کولر', 'سرویس و تعمیر سیستم تهویه مطبوع', 'ac');

-- Log Service Category insertion for debugging
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM "ServiceCategory";
    RAISE NOTICE 'ServiceCategory insertion completed. Total categories: %', category_count;
    
    -- Show the inserted categories with their IDs
    RAISE NOTICE 'Inserted Service Categories:';
    FOR rec IN SELECT "id", "slug", "name" FROM "ServiceCategory" LOOP
        RAISE NOTICE 'ID: %, Slug: %, Name: %', rec.id, rec.slug, rec.name;
    END LOOP;
END $$;

-- Insert Users (Customers) - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "User" ("email", "password", "role", "isApproved", "image") VALUES
('mohammad.rezaei@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/mohammad.jpg'),
('ali.mohammadi@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/ali.jpg'),
('sara.hosseini@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/sara.jpg'),
('reza.karimi@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/reza.jpg'),
('fatemeh.zarifi@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/fatemeh.jpg'),
('hossein.taheri@example.com', '$2b$10$example.hash.for.testing', 'CUSTOMER', true, 'https://avatar.example/hossein.jpg');

-- Insert Users (Providers) - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "User" ("email", "password", "role", "isApproved", "image") VALUES
('mehdi.garage@example.com', '$2b$10$example.hash.for.testing', 'PROVIDER', true, 'https://avatar.example/mehdi.jpg'),
('ahmad.mechanic@example.com', '$2b$10$example.hash.for.testing', 'PROVIDER', true, 'https://avatar.example/ahmad.jpg'),
('javad.workshop@example.com', '$2b$10$example.hash.for.testing', 'PROVIDER', true, 'https://avatar.example/javad.jpg'),
('mostafa.karshenas@example.com', '$2b$10$example.hash.for.testing', 'PROVIDER', true, 'https://avatar.example/mostafa.jpg'),
('reza.tamirkar@example.com', '$2b$10$example.hash.for.testing', 'PROVIDER', true, 'https://avatar.example/reza2.jpg');

-- Insert Users (Admin) - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "User" ("email", "password", "role", "isApproved", "image") VALUES
('admin@example.com', '$2b$10$example.hash.for.testing', 'ADMIN', true, 'https://avatar.example/admin.jpg');

-- Log User insertion for debugging
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "User";
    RAISE NOTICE 'User insertion completed. Total users: %', user_count;
END $$;

-- Insert Profiles for Customers - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Profile" (
    "userId", "fullName", "phone", "timezone", "addressLine1", "addressLine2",
    "city", "state", "postalCode", "country", "location", "prefersAtHomeService",
    "prefersWorkshop", "bio"
) VALUES
-- محمد رضایی
((SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'),
 'محمد رضایی', '+98 21 1234 5678', 'Asia/Tehran', 'خیابان کاج', 'پلاک 123',
 'تهران', 'تهران', '1234567890', 'ایران',
 ST_GeogFromText('POINT(51.4005 35.7047)'), true, false,
 'مشتری وفادار با سابقه 3 ساله'),
-- علی محمدی
((SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'),
 'علی محمدی', '+98 21 8765 4321', 'Asia/Tehran', 'خیابان فردوس', 'پلاک 456',
 'تهران', 'تهران', '0987654321', 'ایران',
 ST_GeogFromText('POINT(51.4215 35.7120)'), true, true,
 'دارای 2 خودرو شخصی'),
-- سارا حسینی
((SELECT "id" FROM "User" WHERE "email" = 'sara.hosseini@example.com'),
 'سارا حسینی', '+98 21 555 1234', 'Asia/Tehran', 'خیابان انقلاب', 'پلاک 789',
 'تهران', 'تهران', '1122334455', 'ایران',
 ST_GeogFromText('POINT(51.4320 35.7200)'), false, true,
 'نیاز به سرویس دوره ای'),
-- رضا کریمی
((SELECT "id" FROM "User" WHERE "email" = 'reza.karimi@example.com'),
 'رضا کریمی', '+98 21 777 8888', 'Asia/Tehran', 'خیابان ولیعصر', 'پلاک 321',
 'تهران', 'تهران', '9988776655', 'ایران',
 ST_GeogFromText('POINT(51.4090 35.6950)'), true, false,
 'تازه کار با ماشین'),
-- فاطمه ضریفی
((SELECT "id" FROM "User" WHERE "email" = 'fatemeh.zarifi@example.com'),
 'فاطمه ضریفی', '+98 21 999 0000', 'Asia/Tehran', 'خیابان شریعتی', 'پلاک 654',
 'تهران', 'تهران', '5566778899', 'ایران',
 ST_GeogFromText('POINT(51.4500 35.7300)'), false, true,
 'مالک نمایندگی خودرو'),
-- حسین طاهری
((SELECT "id" FROM "User" WHERE "email" = 'hossein.taheri@example.com'),
 'حسین طاهری', '+98 21 444 5555', 'Asia/Tehran', 'خیابان آزادی', 'پلاک 987',
 'تهران', 'تهران', '4433221100', 'ایران',
 ST_GeogFromText('POINT(51.3900 35.6800)'), true, true,
 'متخصص در ماشین های اروپایی');

-- Insert Profiles for Providers - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Profile" (
    "userId", "fullName", "phone", "timezone", "addressLine1", "addressLine2",
    "city", "state", "postalCode", "country", "location", "prefersAtHomeService",
    "prefersWorkshop", "yearsOfExperience", "bio"
) VALUES
-- مهدی گاراژ
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 'مهدی صبوری (گاراژ مهدی)', '+98 21 111 2222', 'Asia/Tehran', 'خیابان جم', 'ناحیه 3',
 'تهران', 'تهران', '1122334455', 'ایران',
 ST_GeogFromText('POINT(51.4100 35.7100)'), true, true, 15,
 'تعمیرات تخصصی پژو و سایر خودروهای فرانسوی'),
-- احمد مکانیک
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'),
 'احمد رضایی (تعمیرات احمد)', '+98 21 333 4444', 'Asia/Tehran', 'خیابان مطهری', 'کوچه 12',
 'تهران', 'تهران', '6677889900', 'ایران',
 ST_GeogFromText('POINT(51.4200 35.7000)'), true, false, 10,
 'تعمیرات موتور و برق کشی خودرو'),
-- جواد تعمیرگاه
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 'جواد حسینی (تعمیرگاه جواد)', '+98 21 555 6666', 'Asia/Tehran', 'خیابان ونک', 'پلاک 778',
 'تهران', 'تهران', '2233445566', 'ایران',
 ST_GeogFromText('POINT(51.4300 35.6900)'), false, true, 12,
 'تعمیرات تخصصی بنز و BMW'),
-- مصطفی کارشناس
((SELECT "id" FROM "User" WHERE "email" = 'mostafa.karshenas@example.com'),
 'مصطفی کریمی (کارشناس مصطفی)', '+98 21 777 8888', 'Asia/Tehran', 'خیابان قزوین', 'ناحیه 2',
 'تهران', 'تهران', '7788990011', 'ایران',
 ST_GeogFromText('POINT(51.4400 35.6800)'), true, true, 8,
 'تعمیرات کولر و سیستم تهویه'),
-- رضا تعمیرکار
((SELECT "id" FROM "User" WHERE "email" = 'reza.tamirkar@example.com'),
 'رضا محمدی (تعمیرکار رضا)', '+98 21 999 1111', 'Asia/Tehran', 'خیابان شهید بهشتی', 'پلاک 555',
 'تهران', 'تهران', '3344556677', 'ایران',
 ST_GeogFromText('POINT(51.4500 35.6700)'), false, true, 14,
 'تعمیرات تایر و سیستم تعلیق');

-- Log Profile insertion for debugging
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM "Profile";
    RAISE NOTICE 'Profile insertion completed. Total profiles: %', profile_count;
END $$;

-- Insert Vehicles - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Vehicle" ("userId", "make", "model", "year", "licensePlate", "vin", "color", "notes") VALUES
-- محمد رضایی's cars
((SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'), 'پژو', '206', 2015, '123-45-678', 'VF398989898989898', 'نقره ای', 'نیاز به تعویض روغن'),
((SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'), 'هیوندای', 'سوناتا', 2018, '234-56-789', '5YJ3E1EA0DF000000', 'مشکی', 'سرویس دوره ای'),
-- علی محمدی's car
((SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'), 'تویوتا', 'کامری', 2017, '345-67-890', '4T1BF1FKXEU000000', 'سفید', 'مشکل در سیستم تهویه'),
-- سارا حسینی's car
((SELECT "id" FROM "User" WHERE "email" = 'sara.hosseini@example.com'), 'نیسان', 'آلتیما', 2016, '456-78-901', '3N1CN5AP1FL000000', 'خاکستری', 'نیاز به تعویض تایر'),
-- رضا کریمی's car
((SELECT "id" FROM "User" WHERE "email" = 'reza.karimi@example.com'), 'بی ام و', '320i', 2019, '567-89-012', '5UXWX9C50F9F000000', 'آبی', 'تعمیرات برق کشی'),
-- فاطمه ضریفی's car
((SELECT "id" FROM "User" WHERE "email" = 'fatemeh.zarifi@example.com'), 'بنز', 'C200', 2020, '678-90-123', 'WDDHF8KB0FA000000', 'قرمز', 'نیاز به سرویس کامل'),
-- حسین طاهری's car
((SELECT "id" FROM "User" WHERE "email" = 'hossein.taheri@example.com'), 'Volkswagen', 'پاسات', 2018, '789-01-234', '1VWBA7A3XEC000000', 'نقره ای', 'مشکل در ترمز');

-- Log Vehicle insertion for debugging
DO $$
DECLARE
    vehicle_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM "Vehicle";
    RAISE NOTICE 'Vehicle insertion completed. Total vehicles: %', vehicle_count;
END $$;

-- Insert Services with explicit DEFAULT for ID column
-- Use CTEs to ensure ServiceCategory IDs are available
WITH service_categories AS (
    SELECT "id", "slug" FROM "ServiceCategory"
),
providers AS (
    SELECT "id", "email" FROM "User" WHERE "role" = 'PROVIDER'
)
INSERT INTO "Service" ("providerId", "categoryId", "name", "description", "basePrice", "minPrice", "maxPrice")
SELECT
    p."id" as providerId,
    sc."id" as categoryId,
    service_data.name,
    service_data.description,
    service_data.basePrice,
    service_data.minPrice,
    service_data.maxPrice
FROM providers p
CROSS JOIN (
    VALUES
    -- مهدی گاراژ services
    ('mehdi.garage@example.com', 'oil-change', 'تعویض روغن موتور', 'تعویض روغن و فیلتر موتور برای خودروهای پژو', 350000, 300000, 500000),
    ('mehdi.garage@example.com', 'brake-service', 'سرویس ترمز', 'تعمیر و تعویض لنت ترمز', 800000, 600000, 1200000),
    -- احمد مکانیک services
    ('ahmad.mechanic@example.com', 'engine-diagnosis', 'تشخیص موتور', 'تشخیص مشکلات موتور با دستگاه دیاگ', 500000, 400000, 800000),
    ('ahmad.mechanic@example.com', 'electrical-system', 'تعمیرات الکتریکی', 'تعمیر سیستم الکتریکی خودرو', 600000, 500000, 1000000),
    -- جواد تعمیرگاه services
    ('javad.workshop@example.com', 'ac-repair', 'تعمیر کولر', 'سرویس و تعمیر سیستم تهویه', 900000, 700000, 1500000),
    ('javad.workshop@example.com', 'tire-service', 'تعویض تایر', 'تعویض و بالانس تایر', 700000, 500000, 1200000),
    -- مصطفی کارشناس services
    ('mostafa.karshenas@example.com', 'ac-repair', 'تعمیرات تهویه', 'تعمیر و سرویس کولر و بخاری', 450000, 400000, 900000),
    -- رضا تعمیرکار services
    ('reza.tamirkar@example.com', 'tire-service', 'سرویس تایر', 'تعویض و چرخ کاری تایر', 400000, 350000, 800000),
    ('reza.tamirkar@example.com', 'brake-service', 'تعمیر ترمز', 'تعمیر و تعویض سیستم ترمز', 550000, 500000, 1000000)
) as service_data(email, slug, name, description, basePrice, minPrice, maxPrice)
JOIN service_categories sc ON sc."slug" = service_data.slug
WHERE p."email" = service_data.email;

-- Log Service insertion for debugging
DO $$
DECLARE
    service_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO service_count FROM "Service";
    RAISE NOTICE 'Service insertion completed. Total services: %', service_count;
END $$;

-- Insert Bookings - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Booking" (
    "status", "jobType", "price", "date", "scheduledAt", "problemDescription",
    "addressLabel", "latitude", "longitude", "customerId", "providerId",
    "vehicleId", "serviceId"
) VALUES
-- محمد رضایی's bookings
('COMPLETED', 'ON_DEMAND', 400000, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days',
 'نیاز به تعویض روغن موتور', 'خانه', 35.7047, 51.4005,
 (SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '123-45-678'),
 (SELECT "id" FROM "Service" WHERE "name" = 'تعویض روغن موتور' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'))),
-- علی محمدی's booking
('IN_PROGRESS', 'SCHEDULED', 1000000, NOW() - INTERVAL '3 days', NOW() + INTERVAL '1 day',
 'مشکل در سیستم تهویه', ' محل کار', 35.7120, 51.4215,
 (SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '234-56-789'),
 (SELECT "id" FROM "Service" WHERE "name" = 'تعمیر کولر' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'))),
-- سارا حسینی's booking
('PENDING', 'ON_DEMAND', 750000, NOW(), NULL,
 'نیاز به تعویض تایر جلو', 'خانه', 35.7200, 51.4320,
 (SELECT "id" FROM "User" WHERE "email" = 'sara.hosseini@example.com'),
 NULL,
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '345-67-890'),
 (SELECT "id" FROM "Service" WHERE "name" = 'تعویض تایر' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'))),
-- رضا کریمی's booking
('CONFIRMED', 'SCHEDULED', 650000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days',
 'مشکل در برق کشی ماشین', 'نمايندگی', 35.6950, 51.4090,
 (SELECT "id" FROM "User" WHERE "email" = 'reza.karimi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'),
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '456-78-901'),
 (SELECT "id" FROM "Service" WHERE "name" = 'تعمیرات الکتریکی' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'))),
-- فاطمه ضریفی's booking
('CANCELLED', 'ON_DEMAND', 1200000, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days',
 'سرویس کامل خودرو', 'خانه', 35.7300, 51.4500,
 (SELECT "id" FROM "User" WHERE "email" = 'fatemeh.zarifi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '567-89-012'),
 (SELECT "id" FROM "Service" WHERE "name" = 'تعمیر کولر' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'))),
-- حسین طاهری's booking
('DECLINED', 'ON_DEMAND', 850000, NOW() - INTERVAL '2 days', NULL,
 'لنت ترمز صدا می دهد', 'تعمیرگاه', 35.6800, 51.3900,
 (SELECT "id" FROM "User" WHERE "email" = 'hossein.taheri@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 (SELECT "id" FROM "Vehicle" WHERE "licensePlate" = '678-90-123'),
 (SELECT "id" FROM "Service" WHERE "name" = 'سرویس ترمز' AND "providerId" = (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com')));

-- Log Booking insertion for debugging
DO $$
DECLARE
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_count FROM "Booking";
    RAISE NOTICE 'Booking insertion completed. Total bookings: %', booking_count;
END $$;

-- Insert Ratings - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Rating" ("score", "comment", "bookingId", "customerId", "providerId") VALUES
(5, 'خدمات عالی و حرفه ای. مکانیک بسیار با تجربه و دقیق بود.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'),
 (SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com')),
(4, 'تعمیر کولر خوب انجام شد اما کمی دیرتر از موعد مقرر رسید.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'),
 (SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com')),
(3, 'تعویض تایر قیمت مناسبی داشت اما انتظار خدمات بهتری داشتم.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تایر%'),
 (SELECT "id" FROM "User" WHERE "email" = 'sara.hosseini@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com')),
(5, 'تعمیرات الکتریکی عالی انجام شد. مشکل کاملاً رفع شد.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%برق%'),
 (SELECT "id" FROM "User" WHERE "email" = 'reza.karimi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com')),
(2, 'متاسفانه نتوانستم با این تعمیرگاه هماهنگی لازم را انجام دهم.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%کامل%'),
 (SELECT "id" FROM "User" WHERE "email" = 'fatemeh.zarifi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com')),
(4, 'سرویس ترمز خوبی بود. فقط کمی زمان بیشتری طول کشید.',
 (SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%لنت%'),
 (SELECT "id" FROM "User" WHERE "email" = 'hossein.taheri@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'));

-- Log Rating insertion for debugging
DO $$
DECLARE
    rating_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rating_count FROM "Rating";
    RAISE NOTICE 'Rating insertion completed. Total ratings: %', rating_count;
END $$;

-- Insert Availability Windows for Providers with explicit DEFAULT for ID column
-- مهدی گاراژ: شنبه تا چهارشنبه 8-18
INSERT INTO "AvailabilityWindow" ("providerId", "dayOfWeek", "startMinute", "endMinute") VALUES
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 0, 480, 1080), -- شنبه
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 1, 480, 1080), -- یکشنبه
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 2, 480, 1080), -- دوشنبه
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 3, 480, 1080), -- سه شنبه
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 4, 480, 1080); -- چهارشنبه

-- احمد مکانیک: شنبه تا پنجشنبه 7-19
INSERT INTO "AvailabilityWindow" ("providerId", "dayOfWeek", "startMinute", "endMinute") VALUES
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 0, 420, 1140), -- شنبه
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 1, 420, 1140), -- یکشنبه
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 2, 420, 1140), -- دوشنبه
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 3, 420, 1140), -- سه شنبه
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 4, 420, 1140), -- چهارشنبه
((SELECT "id" FROM "User" WHERE "email" = 'ahmad.mechanic@example.com'), 5, 420, 1140); -- پنجشنبه

-- جواد تعمیرگاه: شنبه تا چهارشنبه 9-17
INSERT INTO "AvailabilityWindow" ("providerId", "dayOfWeek", "startMinute", "endMinute") VALUES
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 0, 540, 1020), -- شنبه
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 1, 540, 1020), -- یکشنبه
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 2, 540, 1020), -- دوشنبه
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 3, 540, 1020), -- سه شنبه
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 4, 540, 1020); -- چهارشنبه

-- Log AvailabilityWindow insertion for debugging
DO $$
DECLARE
    availability_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO availability_count FROM "AvailabilityWindow";
    RAISE NOTICE 'AvailabilityWindow insertion completed. Total windows: %', availability_count;
END $$;

-- Insert Saved Places - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "SavedPlace" ("userId", "label", "address", "latitude", "longitude") VALUES
((SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'), 'خانه', 'تهران، خیابان کاج، پلاک 123', 35.7047, 51.4005),
((SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'), 'محل کار', 'تهران، خیابان انقلاب', 35.7200, 51.4320),
((SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'), 'خانه', 'تهران، خیابان فردوس', 35.7120, 51.4215),
((SELECT "id" FROM "User" WHERE "email" = 'sara.hosseini@example.com'), 'خانه', 'تهران، خیابان انقلاب', 35.7200, 51.4320),
((SELECT "id" FROM "User" WHERE "email" = 'reza.karimi@example.com'), 'تعمیرگاه', 'تهران، خیابان ولیعصر', 35.6950, 51.4090);

-- Log SavedPlace insertion for debugging
DO $$
DECLARE
    saved_place_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO saved_place_count FROM "SavedPlace";
    RAISE NOTICE 'SavedPlace insertion completed. Total saved places: %', saved_place_count;
END $$;

-- Insert Chat Messages - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "ChatMessage" ("bookingId", "senderId", "receiverId", "content", "sentAt", "isRead") VALUES
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'),
 (SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 'سلام. وقتی میتونید برای تعویض روغن بیاید؟', NOW() - INTERVAL '7 days 2 hours', true),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'mohammad.rezaei@example.com'),
 'سلام. حدود ساعت 10 صبح می‌رسیم.', NOW() - INTERVAL '7 days 1 hour', true),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'),
 (SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 'سلام. مشکل کولر ماشینم رو فرستادم. چقدر طول میکشه درست بشه؟', NOW() - INTERVAL '3 days 3 hours', false),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 (SELECT "id" FROM "User" WHERE "email" = 'ali.mohammadi@example.com'),
 'حدود 2 ساعت زمان لازم داره. فردا ساعت 9 می‌رسم.', NOW() - INTERVAL '3 days 2 hours', false);

-- Log ChatMessage insertion for debugging
DO $$
DECLARE
    chat_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO chat_count FROM "ChatMessage";
    RAISE NOTICE 'ChatMessage insertion completed. Total messages: %', chat_count;
END $$;

-- Insert Booking Items - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "BookingItem" ("bookingId", "description", "quantity", "unitPrice", "totalPrice") VALUES
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'), 'روغن موتور 10W40', 1, 300000, 300000),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'), 'فیلتر روغن', 1, 100000, 100000),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'), 'گاز کولر', 1, 700000, 700000),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'), 'شستشو سیستم', 1, 300000, 300000),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تایر%'), 'تایر جلو', 2, 300000, 600000),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تایر%'), 'بالانس', 1, 150000, 150000);

-- Log BookingItem insertion for debugging
DO $$
DECLARE
    booking_item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_item_count FROM "BookingItem";
    RAISE NOTICE 'BookingItem insertion completed. Total items: %', booking_item_count;
END $$;

-- Insert Booking Attachments - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "BookingAttachment" ("bookingId", "uploaderId", "type", "url", "caption") VALUES
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 'IMAGE', 'https://example.com/images/booking1_before.jpg', 'عکس قبل از تعویض روغن'),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%روغن%'),
 (SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'),
 'IMAGE', 'https://example.com/images/booking1_after.jpg', 'عکس بعد از تعویض روغن'),
((SELECT "id" FROM "Booking" WHERE "problemDescription" LIKE '%تهویه%'),
 (SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'),
 'VIDEO', 'https://example.com/videos/booking2_diagnosis.mp4', 'ویدیو تشخیص مشکل کولر');

-- Log BookingAttachment insertion for debugging
DO $$
DECLARE
    attachment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attachment_count FROM "BookingAttachment";
    RAISE NOTICE 'BookingAttachment insertion completed. Total attachments: %', attachment_count;
END $$;

-- Insert Regions (Tehran areas) - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "Region" ("name", "polygon", "priority") VALUES
('منطقه 3 تهران',
 ST_GeomFromText('MULTIPOLYGON((51.4000 35.7000, 51.4100 35.7000, 51.4100 35.7100, 51.4000 35.7100, 51.4000 35.7000))', 4326),
 1),
('منطقه 6 تهران',
 ST_GeomFromText('MULTIPOLYGON((51.4200 35.6900, 51.4300 35.6900, 51.4300 35.7000, 51.4200 35.7000, 51.4200 35.6900))', 4326),
 1),
('منطقه مرکزی تهران',
 ST_GeomFromText('MULTIPOLYGON((51.4400 35.6800, 51.4500 35.6800, 51.4500 35.6900, 51.4400 35.6900, 51.4400 35.6800))', 4326),
 2);

-- Log Region insertion for debugging
DO $$
DECLARE
    region_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO region_count FROM "Region";
    RAISE NOTICE 'Region insertion completed. Total regions: %', region_count;
END $$;

-- Insert Audit Logs - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "AuditLog" ("actorId", "action", "details") VALUES
((SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'), 'SAMPLE_DATA_INSERTION', 'Inserted sample users, providers, and bookings'),
((SELECT "id" FROM "User" WHERE "email" = 'mehdi.garage@example.com'), 'BOOKING_CREATED', 'Created booking for oil change service'),
((SELECT "id" FROM "User" WHERE "email" = 'javad.workshop@example.com'), 'BOOKING_ACCEPTED', 'Accepted AC repair booking'),
((SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'), 'DATABASE_INITIALIZED', 'Database initialization completed successfully');

-- Log completion - exclude ID column to let PostgreSQL auto-generate UUID
INSERT INTO "AuditLog" ("actorId", "action", "details")
VALUES ((SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'), 'SAMPLE_DATA_LOADED', 'Sample data loaded successfully');

-- Log AuditLog insertion for debugging
DO $$
DECLARE
    audit_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO audit_count FROM "AuditLog";
    RAISE NOTICE 'AuditLog insertion completed. Total audit logs: %', audit_count;
END $$;

-- Display summary
SELECT 
    'Database initialization completed successfully!' as status,
    (SELECT COUNT(*) FROM "User") as total_users,
    (SELECT COUNT(*) FROM "Booking") as total_bookings,
    (SELECT COUNT(*) FROM "Service") as total_services;