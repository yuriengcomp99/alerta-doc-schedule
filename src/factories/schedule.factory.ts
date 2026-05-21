import { env } from "../config/env.js";
import { CheckExpiringDocumentsJob } from "../jobs/check-expiring-documents.job.js";
import { PrismaDocumentRepository } from "../repositories/prisma-document.repository.js";
import { PublishExpiringDocumentsUseCase } from "../use-cases/publish-expiring-documents.use-case.js";

export function makeScheduleModule() {
  const documentRepository = new PrismaDocumentRepository();
  const publishExpiringDocuments = new PublishExpiringDocumentsUseCase(
    documentRepository,
    env.timezone,
  );

  return {
    checkExpiringDocumentsJob: new CheckExpiringDocumentsJob(
      publishExpiringDocuments,
      env.jobMaxRetries,
    ),
  };
}
