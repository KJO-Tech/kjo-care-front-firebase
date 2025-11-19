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

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
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

    // Admin sees all, others see only non-deleted
    // Note: This requires a complex query or client-side filtering if we want to show DRAFTs to authors
    // For now, let's fetch all and filter client-side based on role for simplicity,
    // or use a basic query.

    // Since we need to check isAdmin, we can switchMap from auth state
    // But for simplicity and performance, we can just fetch and filter.
    // Ideally, we should use Firestore security rules and queries.

    const q = query(blogsCollection, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map((blogs: any[]) => {
        const user = this.authService.userData();
        const isAdmin = user?.role === 'admin';

        return blogs
          .map((blog) => {
            // Convert Timestamp to Date if needed, or keep as Timestamp
            // The model expects Timestamp, so we cast
            return blog as Blog;
          })
          .filter((blog) => {
            if (isAdmin) return true;
            return blog.status !== BlogStatus.DELETED;
          });
      }),
      // We need to populate isLiked for each blog.
      // This is expensive if we do it for all blogs.
      // Android app likely does it.
      // Optimization: Only fetch likes for visible blogs or do it in component.
      // For now, let's map it.
      switchMap((blogs) => {
        if (blogs.length === 0) return of([]);

        const user = this.authService.userData();
        if (!user) return of(blogs);

        // Fetch likes for these blogs? Or just return blogs and let component fetch status?
        // The model has isLiked. We need to check subcollection 'reactions' for current user.
        // Doing this for a list is N+1 problem.
        // Alternative: Store 'likes' array in blog document?
        // The requirement says "reaction and comments son colecciones dentro de un blog".
        // So we have to query subcollections.

        // For the list view, maybe we don't show "isLiked" status immediately or we accept the N+1 for now (limited by pagination usually).
        // Let's try to fetch it for the list.

        const blogsWithLikes$ = blogs.map((blog) =>
          this.checkIfLiked(blog.id, user.uid).pipe(
            map((isLiked) => ({ ...blog, isLiked })),
          ),
        );

        return combineLatest(blogsWithLikes$);
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

        if (!user) return of(blog);

        return this.checkIfLiked(blog.id, user.uid).pipe(
          map((isLiked) => ({ ...blog, isLiked })),
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
      `${this.collectionName}/${blogId}/reactions/${userId}`,
    );
    return docData(reactionDocRef).pipe(
      map((doc) => !!doc),
      catchError(() => of(false)),
    );
  }
}
