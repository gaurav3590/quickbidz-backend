import { Story } from './story.entity';

export class UserFolder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: any;
  parent?: { id: string; name: string } | null;
  subfolders?: UserFolder[] | { id: string; name: string }[];
  stories?:
    | Story[]
    | { id: string; createdAt: Date; title: string; status: string }[];

  constructor(partial: Partial<UserFolder>) {
    Object.assign(this, partial);
  }
}
