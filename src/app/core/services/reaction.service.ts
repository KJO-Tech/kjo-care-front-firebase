import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionGroup,
  doc,
  docData,
  Firestore,
  getCountFromServer,
  getDocs,
  increment,
  query,
  runTransaction,
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
      `${this.collectionName}/${blogId}/reaction/${userId}`,
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
      `${this.collectionName}/${blogId}/reaction/${user.uid}`,
    );

    const blogRef = doc(this.firestore, `${this.collectionName}/${blogId}`);

    return from(
      getDocs(
        query(
          collection(
            this.firestore,
            `${this.collectionName}/${blogId}/reaction`,
          ),
          where('userId', '==', user.uid),
        ),
      ),
    ).pipe(
      switchMap((snapshot) => {
        if (!snapshot.empty) {
          // Unlike: Delete reaction and decrement counter
          return from(
            runTransaction(this.firestore, async (transaction) => {
              transaction.delete(reactionRef);
              transaction.update(blogRef, { reaction: increment(-1) });
            }),
          );
        } else {
          // Like: Add reaction and increment counter
          const reaction: Reaction = {
            userId: user.uid,
            timestamp: Timestamp.now(),
          };
          return from(
            runTransaction(this.firestore, async (transaction) => {
              transaction.set(reactionRef, reaction);
              transaction.update(blogRef, { reaction: increment(1) });
            }),
          );
        }
      }),
    );
  }

  countMyReactions(): Observable<number> {
    const user = this.authService.userData();
    if (!user) return of(0);

    const reactionsQuery = query(
      collectionGroup(this.firestore, 'reaction'),
      where('userId', '==', user.uid),
    );

    return from(getCountFromServer(reactionsQuery)).pipe(
      map((snapshot) => snapshot.data().count),
      catchError((error) => {
        console.error('Error counting reactions:', error);
        return of(0);
      }),
    );
  }
}
