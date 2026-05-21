import "../load-env.js";
import { env } from "../config/env.js";
import { makeScheduleModule } from "../factories/schedule.factory.js";
import { checkRabbitConnection, closePublisher } from "../lib/rabbitmq-publisher.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL não configurada no .env");
  }

  console.log("[script] executando job check-expiring-documents (manual)");
  console.log(`[script] tz=${env.timezone}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    throw new Error(`Postgres indisponível: ${err}`);
  }

  if (!(await checkRabbitConnection())) {
    throw new Error("RabbitMQ indisponível");
  }

  const jobs = makeScheduleModule();
  await jobs.checkExpiringDocumentsJob.run();

  console.log("[script] job finalizado com sucesso");
}

main()
  .catch((err) => {
    console.error("[script] falha:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePublisher();
    await prisma.$disconnect();
  });
