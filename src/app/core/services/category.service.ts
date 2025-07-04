import { inject, Injectable, signal } from '@angular/core';

import { from, Observable, throwError } from 'rxjs';

import { Category } from '../models/blog';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private firestore = inject(Firestore);
  private collectionName = 'categories';

  selectedCategory = signal<Category>({
    id: '',
    nameTranslations: {
      es: '', en: ''
    },
    isActive: true
  });

  findAll(): Observable<Category[]> {
    const q = query(collection(this.firestore, this.collectionName));
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Category, 'id'>
        }));
      }),
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return throwError(() => error);
      })
    );
  }


  create(category: Omit<Category, 'id'>): Observable<string> {
    return from(addDoc(collection(this.firestore, this.collectionName), category)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error al crear categoría:', error);
        return throwError(() => error);
      })
    );
  }

  update(category: Partial<Omit<Category, 'id'>>, id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(docRef, category)).pipe(
      catchError(error => {
        console.error('Error al actualizar categoría:', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(docRef)).pipe(
      catchError(error => {
        console.error('Error al eliminar categoría:', error);
        return throwError(() => error);
      })
    );
  }
}
