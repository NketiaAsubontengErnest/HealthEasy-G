-- Apply to existing HealthEasy-G databases after the initial schema baseline.
ALTER TABLE "UserStaff" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "UserStaff" ADD COLUMN IF NOT EXISTS "facilityId" TEXT NOT NULL DEFAULT 'fac-1';

-- Convert legacy text date columns to native PostgreSQL types.
ALTER TABLE "FacilityBranch" ALTER COLUMN "hefraExpiryDate" TYPE DATE USING NULLIF("hefraExpiryDate"::text, '')::date;
ALTER TABLE "UserStaff" ALTER COLUMN "licenseExpiry" TYPE DATE USING NULLIF("licenseExpiry"::text, '')::date;
ALTER TABLE "Patient" ALTER COLUMN "dob" TYPE DATE USING NULLIF("dob"::text, '')::date;
ALTER TABLE "Patient" ALTER COLUMN "nhisExpiry" TYPE DATE USING NULLIF("nhisExpiry"::text, '')::date;
ALTER TABLE "Patient" ALTER COLUMN "registrationDate" TYPE DATE USING NULLIF("registrationDate"::text, '')::date;
ALTER TABLE "InpatientBed" ALTER COLUMN "admissionDate" TYPE DATE USING NULLIF("admissionDate"::text, '')::date;
ALTER TABLE "PharmacyBatch" ALTER COLUMN "expiryDate" TYPE DATE USING NULLIF("expiryDate"::text, '')::date;
