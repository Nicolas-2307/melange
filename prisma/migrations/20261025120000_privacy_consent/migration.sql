-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "privacyAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "privacyAccepted" BOOLEAN NOT NULL DEFAULT false;

