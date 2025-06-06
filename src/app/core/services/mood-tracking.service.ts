import { inject, Injectable} from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import type {
  MoodStateRequest,
  MoodStateResponse,
} from '../interfaces/mood-http.interface';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, doc, DocumentSnapshot, getDoc, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';



@Injectable({
  providedIn: 'root'
})
export class MoodStateService {
  private firestore = inject(Firestore);
  private readonly collectionName = 'moods';
  private readonly moodsCollection = collection(this.firestore, this.collectionName);

  getMoods(): Observable<MoodStateResponse[]> {
    const moodsQuery = query(
      this.moodsCollection,
      orderBy('createdAt', 'desc')
    );
    return collectionData(moodsQuery, { idField: 'id' }).pipe(
      map(moods => moods as MoodStateResponse[]),
      catchError(error => throwError(() => error))
    );
  }

  addMoodState(mood: MoodStateRequest): Observable<MoodStateResponse> {
    const moodWithTimestamp = {
      ...mood,
      isActive: true,
      createdAt: serverTimestamp()
    };
    return from(addDoc(this.moodsCollection, moodWithTimestamp)).pipe(
      map(docRef => ({
        id: docRef.id,
        ...mood,
        isActive: true
      } as MoodStateResponse)),
      catchError(error => throwError(() => error))
    );
  }

  updateMoodState(id: string, mood: Partial<MoodStateRequest>): Observable<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const updateDate = { ...mood, updatedAt: serverTimestamp() };
    return from(updateDoc(docRef, updateDate)).pipe(
      catchError(error => throwError(() => error))
    );
  }

  toggleMoodState(id: string): Observable<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(getDoc(docRef)).pipe(
      switchMap((docSnap: DocumentSnapshot) => {
        if (!docSnap.exists()) {
          return throwError(() => new Error('Estado de ánimo no encontrado'));
        }
        const currentMood = { id: docSnap.id, ...docSnap.data() } as MoodStateResponse;
        return from(updateDoc(docRef, {
          isActive: !currentMood.isActive,
          updatedAt: serverTimestamp()
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  removeMoodState(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id))).pipe(
      catchError(error => throwError(() => error))
    );
  }
}