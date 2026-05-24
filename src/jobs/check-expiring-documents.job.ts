import { notifyAdminJobFinished } from "../lib/admin-console.js";
import { withRetry } from "../lib/retry.js";
import type { PublishExpiringDocumentsUseCase } from "../use-cases/publish-expiring-documents.use-case.js";

export class CheckExpiringDocumentsJob {
  constructor(
    private readonly publishExpiring: PublishExpiringDocumentsUseCase,
    private readonly maxAttempts: number,
  ) {}

  async run(): Promise<void> {
    const result = await withRetry(
      () => this.publishExpiring.execute(),
      this.maxAttempts,
      "check-expiring-documents",
    );

    console.log(
      `[job:check-expiring-documents] ref=${result.referenceDate} ` +
        `docs hoje=${result.documentsToday} amanhã=${result.documentsTomorrow} ` +
        `msgs hoje=${result.batchMessagesToday} amanhã=${result.batchMessagesTomorrow}`,
    );

    const adminMessage =
      `Alerta Doc: job vencimentos OK (${result.referenceDate}). ` +
      `Hoje: ${result.documentsToday} doc(s) em ${result.batchMessagesToday} aviso(s). ` +
      `Amanhã: ${result.documentsTomorrow} doc(s) em ${result.batchMessagesTomorrow} aviso(s).`;

    notifyAdminJobFinished(adminMessage);
  }
}
