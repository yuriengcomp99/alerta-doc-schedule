import { PrismaClient } from "../generated/prisma-client/index.js";

const global = globalThis as { prisma?: PrismaClient };

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
