export type DocumentExpiringEventType =
  | "document.expiring.today"
  | "document.expiring.tomorrow";

export type DocumentExpiringEvent = {
  eventId: string;
  eventType: DocumentExpiringEventType;
  documentId: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  expiresAt: string;
  occurredAt: string;
};
