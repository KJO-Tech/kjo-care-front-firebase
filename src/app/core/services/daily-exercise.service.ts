import { inject, Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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
  DocumentData,
  orderBy
} from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';
import { DailyExercise } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class DailyExerciseService {
  private firestore = inject(Firestore);
  private collectionName = 'dailyExercises';

  constructor() {
  }

  getExercises(): Observable<DailyExercise[]> {
    const q = query(
      collection(this.firestore, this.collectionName)
    );
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<DailyExercise, 'id'>
        }));
      }),
      catchError(error => {
        console.error('Error al obtener ejercicios:', error);
        return throwError(() => error);
      })
    );
  }

  getExerciseById(id: string): Observable<DailyExercise | null> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) return null;
        return {
          id: docSnap.id,
          ...docSnap.data() as Omit<DailyExercise, 'id'>
        };
      }),
      catchError(error => {
        console.error('Error al obtener ejercicio:', error);
        return throwError(() => error);
      })
    );
  }

  createExercise(exercise: Omit<DailyExercise, 'id'>): Observable<string> {
    return from(addDoc(collection(this.firestore, this.collectionName), exercise)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error al crear ejercicio:', error);
        return throwError(() => error);
      })
    );
  }

  updateExercise(id: string, exercise: Partial<Omit<DailyExercise, 'id'>>): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(docRef, exercise)).pipe(
      catchError(error => {
        console.error('Error al actualizar ejercicio:', error);
        return throwError(() => error);
      })
    );
  }

  deleteExercise(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(docRef)).pipe(
      catchError(error => {
        console.error('Error al eliminar ejercicio:', error);
        return throwError(() => error);
      })
    );
  }
}
