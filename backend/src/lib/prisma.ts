import { PrismaClient, Prisma } from "@prisma/client";

// Configure Prisma.Decimal to serialize as a standard JS number
(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

const prisma = new PrismaClient();

export default prisma;
