-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 100,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(10,2) NOT NULL,
    "volume" DECIMAL(10,2) NOT NULL,
    "filledVolume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "question" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "thumbnail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "yesPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.5,
    "noPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.5,
    "volume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "shares" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgPrice" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_book_entries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT,
    "outcome" "Outcome" NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "volume" DECIMAL(10,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_book_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volume" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "outcome" "Outcome" NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_eventId_idx" ON "orders"("eventId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "events_isActive_idx" ON "events"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "positions_userId_eventId_outcome_key" ON "positions"("userId", "eventId", "outcome");

-- CreateIndex
CREATE INDEX "trades_userId_idx" ON "trades"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "order_book_entries_orderId_key" ON "order_book_entries"("orderId");

-- CreateIndex
CREATE INDEX "order_book_entries_eventId_price_idx" ON "order_book_entries"("eventId", "price");

-- CreateIndex
CREATE INDEX "order_book_entries_outcome_side_idx" ON "order_book_entries"("outcome", "side");

-- CreateIndex
CREATE INDEX "transactions_orderId_idx" ON "transactions"("orderId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_book_entries" ADD CONSTRAINT "order_book_entries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_book_entries" ADD CONSTRAINT "order_book_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
