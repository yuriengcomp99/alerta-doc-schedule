import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  rabbitmqUrl: process.env.RABBITMQ_URL ?? "",
  cronCheckExpiring: process.env.CRON_CHECK_EXPIRING ?? "0 8 * * *",
  timezone: process.env.TZ ?? "America/Sao_Paulo",
  jobMaxRetries: Math.max(1, Number(process.env.JOB_MAX_RETRIES ?? "3") || 3),
  runOnStartup: process.env.RUN_ON_STARTUP !== "false",
};
