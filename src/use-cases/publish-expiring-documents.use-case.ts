import { randomUUID } from "node:crypto";
import type {
  DocumentsExpiringEvent,
  ExpiringDocumentItem,
  ExpiringWhen,
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
  batchMessages: number;
  referenceDate: string;
};

type OwnerBucket = {
  ownerId: string;
  ownerEmail: string;
  documents: ExpiringDocumentItem[];
};

function toItem(doc: ExpiringDocumentRecord, when: ExpiringWhen): ExpiringDocumentItem {
  return {
    documentId: doc.id,
    title: doc.title,
    expiresAt: doc.expiresAt.toISOString().slice(0, 10),
    when,
  };
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

    const byOwner = new Map<string, OwnerBucket>();

    for (const doc of todayDocs) {
      this.addDoc(byOwner, doc, "today");
    }
    for (const doc of tomorrowDocs) {
      this.addDoc(byOwner, doc, "tomorrow");
    }

    const occurredAt = new Date().toISOString();
    let batchMessages = 0;

    for (const bucket of byOwner.values()) {
      const payload: DocumentsExpiringEvent = {
        eventId: randomUUID(),
        eventType: "documents.expiring",
        ownerId: bucket.ownerId,
        ownerEmail: bucket.ownerEmail,
        referenceDate,
        occurredAt,
        documents: bucket.documents,
      };

      await publishMessage(QUEUES.DOCUMENTS_EXPIRING, payload);
      batchMessages += 1;
    }

    return {
      documentsToday: todayDocs.length,
      documentsTomorrow: tomorrowDocs.length,
      batchMessages,
      referenceDate,
    };
  }

  private addDoc(
    byOwner: Map<string, OwnerBucket>,
    doc: ExpiringDocumentRecord,
    when: ExpiringWhen,
  ): void {
    let bucket = byOwner.get(doc.ownerId);
    if (!bucket) {
      bucket = {
        ownerId: doc.ownerId,
        ownerEmail: doc.ownerEmail,
        documents: [],
      };
      byOwner.set(doc.ownerId, bucket);
    }
    bucket.documents.push(toItem(doc, when));
  }
}
