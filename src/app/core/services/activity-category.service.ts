import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActivityCategory } from '../models/activity.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityCategoryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly COLLECTION_NAME = 'activityCategories';
  private readonly SUBSCRIPTIONS_COLLECTION_NAME = 'activitySubscriptions';

  constructor() {}

  getCategories(): Observable<ActivityCategory[]> {
    const q = query(
      collection(this.firestore, this.COLLECTION_NAME),
      orderBy('order'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ActivityCategory, 'id'>),
        }));
      }),
      catchError((error) => {
        console.error('Error al obtener categorías:', error);
        return throwError(() => error);
      }),
    );
  }

  getCategoryById(id: string): Observable<ActivityCategory | null> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return null;
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<ActivityCategory, 'id'>),
        };
      }),
      catchError((error) => {
        console.error('Error al obtener categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  createCategory(category: Omit<ActivityCategory, 'id'>): Observable<string> {
    return from(
      addDoc(collection(this.firestore, this.COLLECTION_NAME), category),
    ).pipe(
      map((docRef) => docRef.id),
      catchError((error) => {
        console.error('Error al crear categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  updateCategory(
    id: string,
    category: Partial<Omit<ActivityCategory, 'id'>>,
  ): Observable<void> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(updateDoc(docRef, category)).pipe(
      catchError((error) => {
        console.error('Error al actualizar categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  deleteCategory(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(deleteDoc(docRef)).pipe(
      catchError((error) => {
        console.error('Error al eliminar categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  subscribeToCategory(categoryId: string): Observable<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    const docRef = doc(
      this.firestore,
      `${this.SUBSCRIPTIONS_COLLECTION_NAME}/${userId}`,
    );
    return from(
      setDoc(
        docRef,
        {
          userId,
          categoryIds: arrayUnion(categoryId),
        },
        { merge: true },
      ),
    ).pipe(
      catchError((error) => {
        console.error('Error al suscribirse a la categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  unsubscribeFromCategory(categoryId: string): Observable<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    const docRef = doc(
      this.firestore,
      `${this.SUBSCRIPTIONS_COLLECTION_NAME}/${userId}`,
    );
    return from(
      updateDoc(docRef, {
        categoryIds: arrayRemove(categoryId),
      }),
    ).pipe(
      catchError((error) => {
        console.error('Error al desuscribirse de la categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  updateUserSubscriptions(categoryIds: string[]): Observable<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    const docRef = doc(
      this.firestore,
      `${this.SUBSCRIPTIONS_COLLECTION_NAME}/${userId}`,
    );
    return from(
      setDoc(
        docRef,
        {
          userId,
          categoryIds,
        },
        { merge: true },
      ),
    ).pipe(
      catchError((error) => {
        console.error('Error al actualizar suscripciones:', error);
        return throwError(() => error);
      }),
    );
  }

  getUserSubscriptions(): Observable<string[]> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    const docRef = doc(
      this.firestore,
      `${this.SUBSCRIPTIONS_COLLECTION_NAME}/${userId}`,
    );
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return [];
        return docSnap.data()['categoryIds'] || [];
      }),
      catchError((error) => {
        console.error('Error al obtener suscripciones:', error);
        return throwError(() => error);
      }),
    );
  }
}
