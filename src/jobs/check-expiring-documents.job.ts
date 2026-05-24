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

    const total = result.documentsToday + result.documentsTomorrow;

    console.log(
      `[job:check-expiring-documents] ref=${result.referenceDate} ` +
        `docs=${total} (hoje=${result.documentsToday} amanhã=${result.documentsTomorrow}) ` +
        `avisos=${result.batchMessages}`,
    );

    const adminMessage =
      `Alerta Doc: job vencimentos OK (${result.referenceDate}). ` +
      `${total} documento(s) em ${result.batchMessages} aviso(s).`;

    notifyAdminJobFinished(adminMessage);
  }
}
