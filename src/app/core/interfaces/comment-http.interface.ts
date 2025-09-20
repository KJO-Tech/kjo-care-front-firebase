export interface CommentRequest {
  id: number;
  content: string;
  blogId: string;
  commentParentId: number | null;
}

export interface CommentResponse {
  id: number;
  blogId: string;
  userId: number;
  content: string;
  commentDate: string;
  modifiedDate: string;
  commentParentId: number;
}
