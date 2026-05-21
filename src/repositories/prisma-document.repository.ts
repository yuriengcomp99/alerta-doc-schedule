import { prisma } from "../lib/prisma.js";
import type {
  ExpiringDocumentRecord,
  IDocumentRepository,
} from "./document.repository.js";

export class PrismaDocumentRepository implements IDocumentRepository {
  async findExpiringOnDate(expiresOn: Date): Promise<ExpiringDocumentRecord[]> {
    const rows = await prisma.document.findMany({
      where: { expiresAt: expiresOn },
      select: {
        id: true,
        title: true,
        expiresAt: true,
        ownerId: true,
        owner: { select: { email: true } },
      },
    });

    return rows
      .filter((row): row is typeof row & { expiresAt: Date } => row.expiresAt != null)
      .map((row) => ({
        id: row.id,
        title: row.title,
        ownerId: row.ownerId,
        ownerEmail: row.owner.email,
        expiresAt: row.expiresAt,
      }));
  }
}
