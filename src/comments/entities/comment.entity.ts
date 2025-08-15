export class Comment {
  id: string;
  content: string;
  userId: string;
  auctionId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: any;
  auction?: any;
  parent?: Comment;
  replies?: Comment[];

  constructor(partial: Partial<Comment>) {
    Object.assign(this, partial);
  }
}
