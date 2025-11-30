import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  AssignedExercise,
  AssignedExerciseDetail,
  DailyAssignment,
  DailyExercise,
} from '../models/activity.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DailyExerciseService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly COLLECTION_NAME = 'dailyExercises';
  private readonly DAILY_ASSIGNMENTS_COLLECTION = 'dailyAssignments';
  private readonly SUBSCRIPTIONS_COLLECTION = 'activitySubscriptions';

  constructor() {}

  getExercises(): Observable<DailyExercise[]> {
    const q = query(collection(this.firestore, this.COLLECTION_NAME));
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DailyExercise, 'id'>),
        }));
      }),
      catchError((error) => {
        console.error('Error al obtener ejercicios:', error);
        return throwError(() => error);
      }),
    );
  }

  getExercisesByCategory(categoryId: string): Observable<DailyExercise[]> {
    const q = query(
      collection(this.firestore, this.COLLECTION_NAME),
      where('categoryId', '==', categoryId),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DailyExercise, 'id'>),
        }));
      }),
      catchError((error) => {
        console.error('Error al obtener ejercicios por categoría:', error);
        return throwError(() => error);
      }),
    );
  }

  getExerciseById(id: string): Observable<DailyExercise | null> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return null;
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<DailyExercise, 'id'>),
        };
      }),
      catchError((error) => {
        console.error('Error al obtener ejercicio:', error);
        return throwError(() => error);
      }),
    );
  }

  createExercise(exercise: Omit<DailyExercise, 'id'>): Observable<string> {
    return from(
      addDoc(collection(this.firestore, this.COLLECTION_NAME), exercise),
    ).pipe(
      map((docRef) => docRef.id),
      catchError((error) => {
        console.error('Error al crear ejercicio:', error);
        return throwError(() => error);
      }),
    );
  }

  updateExercise(
    id: string,
    exercise: Partial<Omit<DailyExercise, 'id'>>,
  ): Observable<void> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(updateDoc(docRef, exercise)).pipe(
      catchError((error) => {
        console.error('Error al actualizar ejercicio:', error);
        return throwError(() => error);
      }),
    );
  }

  deleteExercise(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.COLLECTION_NAME}/${id}`);
    return from(deleteDoc(docRef)).pipe(
      catchError((error) => {
        console.error('Error al eliminar ejercicio:', error);
        return throwError(() => error);
      }),
    );
  }

  getDailyAssignments(): Observable<
    DailyAssignment & { exercises: AssignedExerciseDetail[] }
  > {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const assignmentsRef = collection(
      this.firestore,
      this.DAILY_ASSIGNMENTS_COLLECTION,
    );
    const q = query(
      assignmentsRef,
      where('userId', '==', userId),
      where('date', '==', today),
    );

    return from(getDocs(q)).pipe(
      switchMap((snapshot) => {
        let assignment$: Observable<DailyAssignment>;

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data() as DailyAssignment;
          assignment$ = of({ id: snapshot.docs[0].id, ...docData });
        } else {
          // No assignment for today, create one
          assignment$ = this.getUserSubscriptions(userId).pipe(
            switchMap((subscriptions) =>
              this.getRandomExercises(subscriptions),
            ),
            switchMap((exercises) => {
              const newAssignment: DailyAssignment = {
                userId,
                date: today,
                exercises: exercises.map((ex) => ({
                  exerciseId: ex.id!,
                  completed: false,
                })),
              };
              return from(addDoc(assignmentsRef, newAssignment)).pipe(
                map((docRef) => ({ id: docRef.id, ...newAssignment })),
              );
            }),
          );
        }

        return assignment$.pipe(
          switchMap((assignment) => {
            if (assignment.exercises.length === 0) {
              return of({
                ...assignment,
                exercises: [] as AssignedExerciseDetail[],
              });
            }

            const exerciseIds = assignment.exercises.map((e) => e.exerciseId);
            // Fetch all exercises.
            // Optimization: In a real app, we might want to use a 'where in' query if IDs are few,
            // or rely on a cache. Here we'll fetch them individually for simplicity as we have getExerciseById.
            // But getExerciseById returns Observable. We need to combine them.

            const exerciseObservables = exerciseIds.map((id) =>
              this.getExerciseById(id),
            );

            return forkJoin(exerciseObservables).pipe(
              map((exercises) => {
                const exercisesMap = new Map(
                  exercises.filter((e) => !!e).map((e) => [e!.id!, e!]),
                );

                const exercisesWithDetails: AssignedExerciseDetail[] =
                  assignment.exercises.map((assigned) => {
                    const exercise = exercisesMap.get(assigned.exerciseId);
                    // If exercise not found (deleted?), we might want to filter it out or handle it.
                    // For now, we'll cast or provide a dummy if missing to satisfy the type,
                    // but ideally we should handle data consistency.
                    if (!exercise) {
                      // Fallback or filter. Let's return null and filter below if we could,
                      // but map expects a value.
                      // Let's assume it exists for now or return a partial.
                      return { ...assigned, exercise: {} as DailyExercise };
                    }
                    return { ...assigned, exercise };
                  });

                return {
                  ...assignment,
                  exercises: exercisesWithDetails.filter((e) => e.exercise.id),
                };
              }),
            );
          }),
        );
      }),
      catchError((error) => {
        console.error('Error getting daily assignments:', error);
        return throwError(() => error);
      }),
    );
  }

  completeAssignment(
    assignmentId: string,
    exerciseId: string,
  ): Observable<void> {
    const docRef = doc(
      this.firestore,
      `${this.DAILY_ASSIGNMENTS_COLLECTION}/${assignmentId}`,
    );

    return from(getDoc(docRef)).pipe(
      switchMap((docSnap) => {
        if (!docSnap.exists())
          return throwError(() => new Error('Assignment not found'));

        const assignment = docSnap.data() as DailyAssignment;
        const updatedExercises = assignment.exercises.map((ex) => {
          if (ex.exerciseId === exerciseId) {
            return { ...ex, completed: true, completedAt: Timestamp.now() };
          }
          return ex;
        });

        return from(updateDoc(docRef, { exercises: updatedExercises }));
      }),
      catchError((error) => {
        console.error('Error completing assignment:', error);
        return throwError(() => error);
      }),
    );
  }

  completeAdHocExercise(exerciseId: string): Observable<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return throwError(() => new Error('User not logged in'));

    return this.getDailyAssignments().pipe(
      switchMap((assignment) => {
        // Check if already in list
        const existing = assignment.exercises.find(
          (ex) => ex.exerciseId === exerciseId,
        );
        if (existing) {
          if (!existing.completed) {
            return this.completeAssignment(assignment.id!, exerciseId);
          }
          return of(void 0);
        }

        // Add as ad-hoc
        const newExercise: AssignedExercise = {
          exerciseId,
          completed: true,
          completedAt: Timestamp.now(),
          isAdHoc: true,
        };

        const docRef = doc(
          this.firestore,
          `${this.DAILY_ASSIGNMENTS_COLLECTION}/${assignment.id}`,
        );
        return from(
          updateDoc(docRef, {
            exercises: arrayUnion(newExercise),
          }),
        );
      }),
      catchError((error) => {
        console.error('Error completing ad-hoc exercise:', error);
        return throwError(() => error);
      }),
    );
  }

  private getUserSubscriptions(userId: string): Observable<string[]> {
    const docRef = doc(
      this.firestore,
      `${this.SUBSCRIPTIONS_COLLECTION}/${userId}`,
    );
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return [];
        return docSnap.data()['categoryIds'] || [];
      }),
    );
  }

  private getRandomExercises(
    categoryIds: string[],
  ): Observable<DailyExercise[]> {
    if (categoryIds.length === 0) return of([]);

    // Limit to 3 categories to avoid too many queries if user has many subs
    const categoriesToQuery = categoryIds.slice(0, 3);
    const queries = categoriesToQuery.map((catId) =>
      query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('categoryId', '==', catId),
      ),
    );

    // Execute all queries in parallel
    return from(Promise.all(queries.map((q) => getDocs(q)))).pipe(
      map((snapshots) => {
        let allExercises: DailyExercise[] = [];
        snapshots.forEach((snapshot) => {
          const exercises = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as DailyExercise,
          );
          allExercises = [...allExercises, ...exercises];
        });

        // Shuffle and pick 3
        allExercises.sort(() => Math.random() - 0.5);
        return allExercises.slice(0, 3);
      }),
    );
  }
}
