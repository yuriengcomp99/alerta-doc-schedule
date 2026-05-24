import { randomUUID } from "node:crypto";
import type {
  DocumentsExpiringBatchEvent,
  ExpiringDocumentItem,
} from "../events/documents-expiring.event.js";
import {
  addCalendarDays,
  calendarDateInTimezone,
  parseDateOnly,
} from "../lib/date-bounds.js";
import { publishMessage } from "../lib/rabbitmq-publisher.js";
import { QUEUES } from "../queue/queues.js";
import type {
  ExpiringDocumentRecord,
  IDocumentRepository,
} from "../repositories/document.repository.js";

export type PublishExpiringResult = {
  documentsToday: number;
  documentsTomorrow: number;
  batchMessagesToday: number;
  batchMessagesTomorrow: number;
  referenceDate: string;
};

function groupByOwner(
  docs: ExpiringDocumentRecord[],
): Map<string, ExpiringDocumentRecord[]> {
  const groups = new Map<string, ExpiringDocumentRecord[]>();

  for (const doc of docs) {
    const list = groups.get(doc.ownerId) ?? [];
    list.push(doc);
    groups.set(doc.ownerId, list);
  }

  return groups;
}

function toDocumentItems(docs: ExpiringDocumentRecord[]): ExpiringDocumentItem[] {
  return docs.map((doc) => ({
    documentId: doc.id,
    title: doc.title,
    expiresAt: doc.expiresAt.toISOString().slice(0, 10),
  }));
}

export class PublishExpiringDocumentsUseCase {
  constructor(
    private readonly documents: IDocumentRepository,
    private readonly timeZone: string,
  ) {}

  async execute(): Promise<PublishExpiringResult> {
    const referenceDate = calendarDateInTimezone(new Date(), this.timeZone);
    const tomorrowDate = addCalendarDays(referenceDate, 1);

    const [todayDocs, tomorrowDocs] = await Promise.all([
      this.documents.findExpiringOnDate(parseDateOnly(referenceDate)),
      this.documents.findExpiringOnDate(parseDateOnly(tomorrowDate)),
    ]);

    const occurredAt = new Date().toISOString();

    const batchMessagesToday = await this.publishBatches(
      QUEUES.DOCUMENTS_EXPIRING_TODAY,
      "documents.expiring.today",
      todayDocs,
      referenceDate,
      occurredAt,
    );

    const batchMessagesTomorrow = await this.publishBatches(
      QUEUES.DOCUMENTS_EXPIRING_TOMORROW,
      "documents.expiring.tomorrow",
      tomorrowDocs,
      referenceDate,
      occurredAt,
    );

    return {
      documentsToday: todayDocs.length,
      documentsTomorrow: tomorrowDocs.length,
      batchMessagesToday,
      batchMessagesTomorrow,
      referenceDate,
    };
  }

  private async publishBatches(
    queue: string,
    eventType: DocumentsExpiringBatchEvent["eventType"],
    docs: ExpiringDocumentRecord[],
    referenceDate: string,
    occurredAt: string,
  ): Promise<number> {
    const byOwner = groupByOwner(docs);
    let messages = 0;

    for (const ownerDocs of byOwner.values()) {
      const first = ownerDocs[0];
      const payload: DocumentsExpiringBatchEvent = {
        eventId: randomUUID(),
        eventType,
        ownerId: first.ownerId,
        ownerEmail: first.ownerEmail,
        referenceDate,
        occurredAt,
        documents: toDocumentItems(ownerDocs),
      };

      await publishMessage(queue, payload);
      messages += 1;
    }

    return messages;
  }
}
