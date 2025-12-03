import { inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  collectionGroup,
  deleteDoc,
  doc,
  Firestore,
  getCountFromServer,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { from, map, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommentRequest } from '../interfaces/blog-http.interface';
import { Comment } from '../models/blog';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private collectionName = 'blogs';

  readonly _selectedComment = signal<CommentRequest | null>(null);

  get selectedComment(): CommentRequest | null {
    return this._selectedComment();
  }

  set selectedComment(comment: CommentRequest | null) {
    this._selectedComment.set(comment);
  }

  getComments(blogId: string): Observable<Comment[]> {
    const commentsRef = collection(
      this.firestore,
      `${this.collectionName}/${blogId}/comments`,
    );
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map((comments: any[]) => {
        const user = this.authService.userData();
        return comments.map((comment) => ({
          ...comment,
          isMine: user ? comment.author.uid === user.uid : false,
          replies: [],
        })) as Comment[];
      }),
      map((comments) => this.buildCommentTree(comments)),
    );
  }

  private buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    comments.forEach((c) => {
      c.replies = [];
      commentMap.set(c.id, c);
    });

    comments.forEach((c) => {
      if (c.parentCommentId) {
        const parent = commentMap.get(c.parentCommentId);
        if (parent) {
          parent.replies.push(c);
        } else {
          rootComments.push(c);
        }
      } else {
        rootComments.push(c);
      }
    });

    return rootComments;
  }

  create(blogId: string, content: string, parentId?: string): Observable<void> {
    const user = this.authService.userData();
    if (!user) return throwError(() => new Error('User not logged in'));

    const commentsRef = collection(
      this.firestore,
      `${this.collectionName}/${blogId}/comments`,
    );
    const newComment: any = {
      author: user,
      content,
      createdAt: Timestamp.now(),
      parentCommentId: parentId || null,
    };

    return from(addDoc(commentsRef, newComment)).pipe(map(() => void 0));
  }

  update(blogId: string, commentId: string, content: string): Observable<void> {
    const commentRef = doc(
      this.firestore,
      `${this.collectionName}/${blogId}/comments/${commentId}`,
    );
    return from(updateDoc(commentRef, { content }));
  }

  delete(blogId: string, commentId: string): Observable<void> {
    const commentRef = doc(
      this.firestore,
      `${this.collectionName}/${blogId}/comments/${commentId}`,
    );
    return from(deleteDoc(commentRef));
  }

  getCommentCount(blogId: string): Observable<number> {
    const commentsRef = collection(
      this.firestore,
      `${this.collectionName}/${blogId}/comments`,
    );
    return from(getCountFromServer(commentsRef)).pipe(
      map((snapshot) => snapshot.data().count),
    );
  }

  countMyComments(): Observable<number> {
    const user = this.authService.userData();
    if (!user) return of(0);

    const commentsQuery = query(
      collectionGroup(this.firestore, 'comments'),
      where('author.uid', '==', user.uid),
    );

    return from(getCountFromServer(commentsQuery)).pipe(
      map((snapshot) => snapshot.data().count),
      catchError((error) => {
        console.error('Error counting comments:', error);
        return of(0);
      }),
    );
  }
}
