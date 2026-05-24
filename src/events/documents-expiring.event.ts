export type DocumentsExpiringEventType =
  | "documents.expiring.today"
  | "documents.expiring.tomorrow";

export type ExpiringDocumentItem = {
  documentId: string;
  title: string;
  expiresAt: string;
};

export type DocumentsExpiringBatchEvent = {
  eventId: string;
  eventType: DocumentsExpiringEventType;
  ownerId: string;
  ownerEmail: string;
  referenceDate: string;
  occurredAt: string;
  documents: ExpiringDocumentItem[];
};
