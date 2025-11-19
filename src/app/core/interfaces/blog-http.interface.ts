import { UserInfo } from './user-http.interface';

export interface CommentSummary {
  id: number;
  userId: UserInfo;
  content: string;
  date: string;
  commentDate: string;
  modifiedDate: string;
  childrenComments: CommentSummary[];
}
