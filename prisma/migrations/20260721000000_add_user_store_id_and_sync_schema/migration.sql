-- Add storeId to User table for multi-user store membership
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storeId" TEXT;

-- Backfill storeId for existing OWNER users from Store.ownerId
UPDATE "User" u SET "storeId" = s.id FROM "Store" s WHERE u.id = s."ownerId" AND u."storeId" IS NULL;

-- Add FK constraint
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
