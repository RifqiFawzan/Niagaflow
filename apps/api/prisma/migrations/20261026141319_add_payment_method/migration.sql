-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TUNAI', 'QRIS', 'TRANSFER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "amount_paid" DECIMAL(12,2),
ADD COLUMN     "payment_method" "PaymentMethod";
