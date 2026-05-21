import { randomUUID } from "node:crypto";
import type { DocumentExpiringEvent } from "../events/document-expiring.event.js";
import {
  addCalendarDays,
  calendarDateInTimezone,
  parseDateOnly,
} from "../lib/date-bounds.js";
import { publishMessage } from "../lib/rabbitmq-publisher.js";
import { QUEUES } from "../queue/queues.js";
import type { IDocumentRepository } from "../repositories/document.repository.js";

export type PublishExpiringResult = {
  publishedToday: number;
  publishedTomorrow: number;
  referenceDate: string;
};

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

    for (const doc of todayDocs) {
      await this.publishEvent(QUEUES.DOCUMENTS_EXPIRING_TODAY, {
        eventType: "document.expiring.today",
        document: doc,
        occurredAt,
      });
    }

    for (const doc of tomorrowDocs) {
      await this.publishEvent(QUEUES.DOCUMENTS_EXPIRING_TOMORROW, {
        eventType: "document.expiring.tomorrow",
        document: doc,
        occurredAt,
      });
    }

    return {
      publishedToday: todayDocs.length,
      publishedTomorrow: tomorrowDocs.length,
      referenceDate,
    };
  }

  private async publishEvent(
    queue: string,
    input: {
      eventType: DocumentExpiringEvent["eventType"];
      document: {
        id: string;
        title: string;
        ownerId: string;
        ownerEmail: string;
        expiresAt: Date;
      };
      occurredAt: string;
    },
  ): Promise<void> {
    const payload: DocumentExpiringEvent = {
      eventId: randomUUID(),
      eventType: input.eventType,
      documentId: input.document.id,
      title: input.document.title,
      ownerId: input.document.ownerId,
      ownerEmail: input.document.ownerEmail,
      expiresAt: input.document.expiresAt.toISOString().slice(0, 10),
      occurredAt: input.occurredAt,
    };

    await publishMessage(queue, payload);
  }
}
