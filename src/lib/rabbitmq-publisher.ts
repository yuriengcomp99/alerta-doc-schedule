import amqp, { type Channel } from "amqplib";
import { env } from "../config/env.js";
import { QUEUES } from "../queue/queues.js";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(env.rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUES.DOCUMENTS_EXPIRING, { durable: true });

  return channel;
}

export async function publishMessage(
  queue: string,
  payload: unknown,
): Promise<void> {
  const ch = await getChannel();
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
  });
}

export async function closePublisher(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}

export async function checkRabbitConnection(): Promise<boolean> {
  try {
    await getChannel();
    return true;
  } catch {
    return false;
  }
}
