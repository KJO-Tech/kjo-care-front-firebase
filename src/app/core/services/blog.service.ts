import { inject, Injectable, signal } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from '@angular/fire/firestore';
import {
  catchError,
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { Blog, BlogStatus } from '../models/blog';
import { AuthService } from './auth.service';
import { CommentService } from './comment.service';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private commentService = inject(CommentService);
  private collectionName = 'blogs';

  private _selectedBlog = signal<Blog | null>(null);

  get selectedBlog(): Blog | null {
    return this._selectedBlog();
  }

  set selectedBlog(blog: Blog | null) {
    this._selectedBlog.set(blog);
  }

  findAll(): Observable<Blog[]> {
    const blogsCollection = collection(this.firestore, this.collectionName);
    const q = query(blogsCollection, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map((blogs: any[]) => {
        const user = this.authService.userData();
        const isAdmin = user?.role === 'admin';

        return blogs
          .map((blog) => blog as Blog)
          .filter((blog) => {
            if (isAdmin) return true;
            return blog.status !== BlogStatus.DELETED;
          });
      }),
      switchMap((blogs) => {
        if (blogs.length === 0) return of([]);

        const user = this.authService.userData();

        const blogsWithDetails$ = blogs.map((blog) => {
          const likes$ = user
            ? this.checkIfLiked(blog.id, user.uid)
            : of(false);

          const commentsCount$ = this.commentService.getCommentCount(blog.id);

          return combineLatest([likes$, commentsCount$]).pipe(
            map(([isLiked, comments]) => ({
              ...blog,
              isLiked,
              comments,
            })),
          );
        });

        return combineLatest(blogsWithDetails$);
      }),
    );
  }

  getById(id: string): Observable<Blog | null> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);

    return docData(docRef, { idField: 'id' }).pipe(
      switchMap((blogData: any) => {
        if (!blogData) return of(null);

        const blog = blogData as Blog;
        const user = this.authService.userData();

        const likes$ = user ? this.checkIfLiked(blog.id, user.uid) : of(false);
        const commentsCount$ = this.commentService.getCommentCount(blog.id);

        return combineLatest([likes$, commentsCount$]).pipe(
          map(([isLiked, comments]) => ({
            ...blog,
            isLiked,
            comments,
          })),
        );
      }),
    );
  }

  create(blog: Partial<Blog>): Observable<void> {
    const id = doc(collection(this.firestore, this.collectionName)).id;
    const newBlog: Blog = {
      ...blog,
      id: id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      likes: 0,
      reaction: 0,
      comments: 0,
      isLiked: false,
      status: BlogStatus.PENDING, // Default
      author: this.authService.userData()!, // Assume logged in
    } as Blog;

    return from(setDoc(doc(this.firestore, this.collectionName, id), newBlog));
  }

  update(id: string, blog: Partial<Blog>): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(docRef, { ...blog, updatedAt: Timestamp.now() }));
  }

  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(docRef, { status: BlogStatus.DELETED }));
  }

  // Reactions
  private checkIfLiked(blogId: string, userId: string): Observable<boolean> {
    const reactionDocRef = doc(
      this.firestore,
      `${this.collectionName}/${blogId}/reaction/${userId}`,
    );
    return docData(reactionDocRef).pipe(
      map((doc) => !!doc),
      catchError(() => of(false)),
    );
  }
}
