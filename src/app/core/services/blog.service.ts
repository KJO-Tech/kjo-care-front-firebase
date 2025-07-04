import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { from, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Blog, Status } from '../models/blog';
import { blogs } from '../../shared/utils/local-data';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private baseUrl: string = environment.apiUrl + '/api/mind/blog/blogs';

  private http = inject(HttpClient);

  private firestore = inject(Firestore);
  private collectionName = 'blogs';

  private _selectedBlog = signal<Blog>({
    id: '',
    title: '',
    content: '',
    mediaUrl: '',
    mediaType: '',
    createdAt: '',
    updatedAt: '',
    status: Status.Published,
    categoryId: ''
  });

  get selectedBlog(): Blog {
    return this._selectedBlog();
  }

  set selectedBlog(blog: Blog) {
    this._selectedBlog.set(blog);
  }

  findAll(): Observable<Blog[]> {
    const q = query(collection(this.firestore, this.collectionName));
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map(doc => ({
          ...doc.data() as Omit<Blog, 'id'>,
          id: doc.id
        }));
      }),
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return throwError(() => error);
      })
    );
  }

  getById(id: string): Observable<Blog | null> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) return null;
        return {
          id: docSnap.id,
          ...docSnap.data() as Omit<Blog, 'id'>
        };
      }),
      catchError(error => {
        console.error('Error al obtener blog:', error);
        return throwError(() => error);
      })
    );
  }

  create(request: FormData): Observable<Blog> {
    return this.http.post<Blog>(`${this.baseUrl}`, request);
  }

  update(request: FormData, id: string): Observable<Blog> {
    return this.http.put<Blog>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);

    const blog: Partial<Omit<Blog, 'id'>> = {
      status: Status.Deleted
    };

    return from(updateDoc(docRef, blog)).pipe(
      catchError(error => {
        console.error('Error al eliminar el blog:', error);
        return throwError(() => error);
      })
    );
  }
}
