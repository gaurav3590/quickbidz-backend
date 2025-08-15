export class Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  status: string; // 'ACTIVE', 'INACTIVE', 'DELETED'
  userId: string;
  userFolderId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: any;
  userFolder?: any;

  constructor(partial: Partial<Story>) {
    Object.assign(this, partial);
  }
}
