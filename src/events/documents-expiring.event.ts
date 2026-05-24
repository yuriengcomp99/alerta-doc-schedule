export type ExpiringWhen = "today" | "tomorrow";

export type ExpiringDocumentItem = {
  documentId: string;
  title: string;
  expiresAt: string;
  when: ExpiringWhen;
};

/** Um evento por dono: todos os documentos que vencem hoje ou amanhã. */
export type DocumentsExpiringEvent = {
  eventId: string;
  eventType: "documents.expiring";
  ownerId: string;
  ownerEmail: string;
  referenceDate: string;
  occurredAt: string;
  documents: ExpiringDocumentItem[];
};
