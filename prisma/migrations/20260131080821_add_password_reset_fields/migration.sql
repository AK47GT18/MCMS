-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expires" TIMESTAMPTZ,
ADD COLUMN     "password_reset_token" VARCHAR(100);
