import { Exclude } from 'class-transformer';

export class User {
  id: string;
  email: string;
  username: string;

  @Exclude()
  password: string;

  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: string;
  profileImage: string | null;
  dob: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
