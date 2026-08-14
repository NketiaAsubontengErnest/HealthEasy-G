-- Convert the date columns that were stored as text into real DATE/TIMESTAMP
-- columns.
--
-- Storing dates as strings meant every comparison was lexical: expiry checks,
-- "claims for this month" filters and sort order all depended on the text
-- happening to be ISO-formatted, and silently produced wrong results for any
-- value that was not. It also made "2026-9-1" and "" indistinguishable from
-- valid data to the database.
--
-- Each ALTER uses an explicit USING cast so existing rows are converted in
-- place rather than dropped and recreated. NULLIF guards the empty strings
-- that the old `@default("")` columns allowed.

BEGIN;

ALTER TABLE "FacilityBranch"
  ALTER COLUMN "hefraExpiryDate" TYPE DATE USING NULLIF("hefraExpiryDate", '')::date;

ALTER TABLE "UserStaff"
  ALTER COLUMN "licenseExpiry" TYPE DATE USING NULLIF("licenseExpiry", '')::date;

ALTER TABLE "Patient"
  ALTER COLUMN "dob"              TYPE DATE USING NULLIF("dob", '')::date,
  ALTER COLUMN "nhisExpiry"       TYPE DATE USING NULLIF("nhisExpiry", '')::date,
  ALTER COLUMN "registrationDate" TYPE DATE USING NULLIF("registrationDate", '')::date;

ALTER TABLE "Patient"
  ALTER COLUMN "registrationDate" SET DEFAULT CURRENT_DATE;

ALTER TABLE "InpatientBed"
  ALTER COLUMN "admissionDate" TYPE DATE USING NULLIF("admissionDate", '')::date;

ALTER TABLE "LabOrder"
  ALTER COLUMN "orderTimestamp"   TYPE TIMESTAMP(3) USING NULLIF("orderTimestamp", '')::timestamp(3),
  ALTER COLUMN "collectedAt"      TYPE TIMESTAMP(3) USING NULLIF("collectedAt", '')::timestamp(3),
  ALTER COLUMN "receivedAt"       TYPE TIMESTAMP(3) USING NULLIF("receivedAt", '')::timestamp(3),
  ALTER COLUMN "verificationTime" TYPE TIMESTAMP(3) USING NULLIF("verificationTime", '')::timestamp(3);

ALTER TABLE "LabOrder"
  ALTER COLUMN "orderTimestamp" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "RadiologyOrder"
  ALTER COLUMN "orderTimestamp"  TYPE TIMESTAMP(3) USING NULLIF("orderTimestamp", '')::timestamp(3),
  ALTER COLUMN "signedTimestamp" TYPE TIMESTAMP(3) USING NULLIF("signedTimestamp", '')::timestamp(3);

ALTER TABLE "RadiologyOrder"
  ALTER COLUMN "orderTimestamp" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "PharmacyBatch"
  ALTER COLUMN "expiryDate" TYPE DATE USING NULLIF("expiryDate", '')::date;

ALTER TABLE "NHISClaimLine"
  ALTER COLUMN "dob"            TYPE DATE USING NULLIF("dob", '')::date,
  ALTER COLUMN "attendanceDate" TYPE DATE USING NULLIF("attendanceDate", '')::date;

-- expiryDate becomes nullable: consumables such as printing paper genuinely
-- have no expiry, and the old `@default("")` encoded that as an empty string.
-- The NOT NULL constraint has to go before the cast, otherwise NULLIF turns
-- those empty strings into NULLs that the still-active constraint rejects.
ALTER TABLE "InventoryStoreItem"
  ALTER COLUMN "expiryDate" DROP DEFAULT,
  ALTER COLUMN "expiryDate" DROP NOT NULL;

ALTER TABLE "InventoryStoreItem"
  ALTER COLUMN "expiryDate"    TYPE DATE USING NULLIF("expiryDate", '')::date,
  ALTER COLUMN "lastRestocked" TYPE DATE USING NULLIF("lastRestocked", '')::date;

ALTER TABLE "InventoryStoreItem"
  ALTER COLUMN "lastRestocked" SET DEFAULT CURRENT_DATE;

COMMIT;
