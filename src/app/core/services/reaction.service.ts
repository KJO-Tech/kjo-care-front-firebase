import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import { from, Observable, of, switchMap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Reaction } from '../models/blog';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private collectionName = 'blogs';

  checkIfLiked(blogId: string, userId: string): Observable<boolean> {
    const reactionDocRef = doc(
      this.firestore,
      `${this.collectionName}/${blogId}/reactions/${userId}`,
    );
    return docData(reactionDocRef).pipe(
      map((doc) => !!doc),
      catchError(() => of(false)),
    );
  }

  toggleLike(blogId: string): Observable<void> {
    const user = this.authService.userData();
    if (!user) return throwError(() => new Error('User not logged in'));

    const reactionRef = doc(
      this.firestore,
      `${this.collectionName}/${blogId}/reactions/${user.uid}`,
    );

    return from(
      getDocs(
        query(
          collection(
            this.firestore,
            `${this.collectionName}/${blogId}/reactions`,
          ),
          where('userId', '==', user.uid),
        ),
      ),
    ).pipe(
      switchMap((snapshot) => {
        if (!snapshot.empty) {
          // Unlike
          return from(deleteDoc(reactionRef));
        } else {
          // Like
          const reaction: Reaction = {
            userId: user.uid,
            timestamp: Timestamp.now(),
          };
          return from(setDoc(reactionRef, reaction));
        }
      }),
    );
  }
}
