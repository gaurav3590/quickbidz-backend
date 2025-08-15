-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "bidIncrements" DOUBLE PRECISION DEFAULT 1,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "reservePrice" DOUBLE PRECISION,
ADD COLUMN     "returnPolicy" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION,
ADD COLUMN     "shippingLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false;
