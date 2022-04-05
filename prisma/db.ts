import { PrismaClient } from "@prisma/client"; // Prisma

// Export Prisma
const db = new PrismaClient();
export default db;
