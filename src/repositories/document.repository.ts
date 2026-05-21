export type ExpiringDocumentRecord = {
  id: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  expiresAt: Date;
};

export interface IDocumentRepository {
  findExpiringOnDate(expiresOn: Date): Promise<ExpiringDocumentRecord[]>;
}
