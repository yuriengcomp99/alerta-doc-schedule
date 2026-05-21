import cron from "node-cron";
import { env } from "../config/env.js";
import type { CheckExpiringDocumentsJob } from "../jobs/check-expiring-documents.job.js";

export function registerJobs(jobs: {
  checkExpiringDocuments: CheckExpiringDocumentsJob;
}) {
  if (!cron.validate(env.cronCheckExpiring)) {
    throw new Error(`CRON inválido: ${env.cronCheckExpiring}`);
  }

  cron.schedule(
    env.cronCheckExpiring,
    async () => {
      try {
        await jobs.checkExpiringDocuments.run();
      } catch (err) {
        console.error("[scheduler] erro em check-expiring-documents:", err);
      }
    },
    { timezone: env.timezone },
  );

  console.log(
    `[scheduler] job check-expiring-documents → ${env.cronCheckExpiring} (${env.timezone})`,
  );
}
