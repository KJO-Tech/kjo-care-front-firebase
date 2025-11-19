import { Timestamp } from 'firebase/firestore';
import { UserModel } from './user.model';

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: UserModel;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  likes: number;
  reaction: number;
  comments: number;
  isLiked: boolean;
  categoryId?: string | null;
  status: BlogStatus;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  YOUTUBE = 'YOUTUBE',
}

export enum BlogStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

export interface Category {
  id: string;
  nameTranslations: { [key: string]: string };
  isActive: boolean;
}

export interface Comment {
  id: string;
  author: UserModel;
  content: string;
  createdAt: Timestamp;
  isMine: boolean;
  parentCommentId?: string | null;
  blogId?: string;
  replies: Comment[];
}

export interface Reaction {
  userId: string;
  timestamp: Timestamp;
}

export interface FilterDTO {
  search: string;
  category: string;
  status: BlogStatus;
}
