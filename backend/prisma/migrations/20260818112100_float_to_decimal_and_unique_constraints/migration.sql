-- AlterTable
ALTER TABLE "Holding" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_symbol_key" ON "Holding"("portfolioId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistStock_watchlistId_symbol_key" ON "WatchlistStock"("watchlistId", "symbol");
