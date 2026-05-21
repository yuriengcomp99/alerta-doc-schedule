import "./load-env.js";
import { env } from "./config/env.js";
import { makeScheduleModule } from "./factories/schedule.factory.js";
import { checkRabbitConnection, closePublisher } from "./lib/rabbitmq-publisher.js";
import { prisma } from "./lib/prisma.js";
import { registerJobs } from "./scheduler/register-jobs.js";

async function bootstrap() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL não configurada");
  }

  const jobs = makeScheduleModule();

  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (err) {
    console.error("[schedule] Postgres indisponível:", err);
  }

  const rabbitmq = await checkRabbitConnection();
  if (!rabbitmq) {
    console.error("[schedule] RabbitMQ indisponível");
  }

  console.log(
    `[schedule] iniciado | db=${database ? "ok" : "erro"} rabbit=${rabbitmq ? "ok" : "erro"} tz=${env.timezone}`,
  );

  if (!database || !rabbitmq) {
    throw new Error("Dependências obrigatórias indisponíveis");
  }

  registerJobs({
    checkExpiringDocuments: jobs.checkExpiringDocumentsJob,
  });

  if (env.runOnStartup) {
    await jobs.checkExpiringDocumentsJob.run();
  }
}

async function shutdown() {
  await closePublisher();
  await prisma.$disconnect();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error("[schedule] falha ao iniciar:", err);
  process.exit(1);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
