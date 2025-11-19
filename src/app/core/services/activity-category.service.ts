import { inject, Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';
import { ActivityCategory } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityCategoryService {
  private firestore = inject(Firestore);
  private collectionName = 'activityCategories';

  constructor() {
  }

  getCategories(): Observable<ActivityCategory[]> {
    const q = query(collection(this.firestore, this.collectionName), orderBy('order'));
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<ActivityCategory, 'id'>
        }));
      }),
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return throwError(() => error);
      })
    );
  }

  createCategory(category: Omit<ActivityCategory, 'id'>): Observable<string> {
    return from(addDoc(collection(this.firestore, this.collectionName), category)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error al crear categoría:', error);
        return throwError(() => error);
      })
    );
  }

  updateCategory(id: string, category: Partial<Omit<ActivityCategory, 'id'>>): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(docRef, category)).pipe(
      catchError(error => {
        console.error('Error al actualizar categoría:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(docRef)).pipe(
      catchError(error => {
        console.error('Error al eliminar categoría:', error);
        return throwError(() => error);
      })
    );
  }
}
