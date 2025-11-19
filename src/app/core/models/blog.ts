import { UserModel } from './user.model';

export interface Blog {
  id: string;
  title: string;
  content: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  author?: {
    id: string;
    fullName: string;
  };
  categoryId: string;
  reaction?: number;
  comments?: number;
}

export enum Status {
  Published = 'PUBLISHED',
  Draft = 'DRAFT',
  Deleted = 'DELETED',
}

export interface Category {
  id: string;
  isActive: boolean;
  nameTranslations: { [key: string]: string };
}

export interface Reaction {
  id: number;
  blogId: number;
  userId: number;
  type: string;
  reaction: string;
}

export interface FilterDTO {
  search: string;
  category: string;
  status: string;
}
