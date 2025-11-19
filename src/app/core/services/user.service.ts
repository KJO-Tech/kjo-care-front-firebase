import { inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  from,
  map,
  Observable,
  tap,
  throwError,
  switchMap,
} from 'rxjs';
import { UserRequest, UserResponse } from '../interfaces/user-http.interface';
import {
  CollectionReference,
  DocumentData,
  Firestore,
} from '@angular/fire/firestore';
import { ToastService } from './toast.service';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly toastService = inject(ToastService);

  private readonly usersCollection: CollectionReference<DocumentData> =
    collection(this.firestore, 'users');
  private readonly _selectedUser = signal<UserResponse | null>(null);

  readonly selectedUser = this._selectedUser.asReadonly();

  setSelectedUser(user: UserResponse | null): void {
    this._selectedUser.set(user);
  }

  selectUserFromResponse(user: UserResponse): void {
    this._selectedUser.set(user);
  }

  clearSelectedUser(): void {
    this._selectedUser.set(null);
  }

  getAll(): Observable<UserResponse[]> {
    const usersQuery = query(
      this.usersCollection,
      orderBy('createdAt', 'desc'),
    );

    return from(getDocs(usersQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName:
              data['fullName'] ||
              data['displayName'] ||
              data['email']?.split('@')[0] ||
              'Usuario',
            email: data['email'],
            createdAt: data['createdAt'],
            enabled: data['enabled'] ?? true,
            role: data['role'] || 'user',
            profileImage: data['profileImage'] || data['photoURL'] || null,
            phone: data['phone'],
            age: data['age'],
            uid: data['uid'],
          } as UserResponse;
        }),
      ),
      catchError((error) =>
        this.handleFirebaseError('Error al obtener usuarios', error),
      ),
    );
  }

  getById(id: string): Observable<UserResponse | null> {
    const userDoc = doc(this.usersCollection, id);

    return from(getDoc(userDoc)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
          id: docSnap.id,
          fullName: data['fullName'] || data['displayName'],
          email: data['email'],
          createdAt: data['createdAt'],
          enabled: data['enabled'] ?? true,
          role: data['role'] || 'user',
          profileImage: data['profileImage'] || data['photoURL'] || null,
          phone: data['phone'],
          age: data['age'],
          uid: data['uid'],
        } as UserResponse;
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al obtener usuario', error),
      ),
    );
  }

  findByEmail(email: string): Observable<UserResponse[]> {
    const emailQuery = query(
      this.usersCollection,
      where('email', '==', email),
      orderBy('createdAt', 'desc'),
    );

    return from(getDocs(emailQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data['fullName'] || data['displayName'],
            email: data['email'],
            createdAt: data['createdAt'],
            enabled: data['enabled'] ?? true,
            role: data['role'] || 'user',
            profileImage: data['profileImage'] || data['photoURL'] || null,
            phone: data['phone'],
            age: data['age'],
            uid: data['uid'],
          } as UserResponse;
        }),
      ),
      catchError((error) =>
        this.handleFirebaseError('Error al buscar usuario por email', error),
      ),
    );
  }

  create(request: Omit<UserRequest, 'id'>): Observable<UserResponse> {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        request.email,
        request.password!,
      ),
    ).pipe(
      switchMap((userCredential) => {
        const userData = {
          uid: userCredential.user.uid,
          fullName: request.fullName,
          email: request.email,
          role: request.role || 'user',
          profileImage: request.profileImage || null,
          phone: request.phone,
          age: request.age,
          createdAt: serverTimestamp(),
          enabled: true,
          lastModified: serverTimestamp(),
        };

        return from(addDoc(this.usersCollection, userData)).pipe(
          map(
            (docRef) =>
              ({
                id: docRef.id,
                uid: userCredential.user.uid,
                fullName: request.fullName,
                email: request.email,
                role: request.role || 'user',
                profileImage: request.profileImage || null,
                phone: request.phone,
                age: request.age,
                createdAt: new Date(),
                enabled: true,
              }) as UserResponse,
          ),
        );
      }),
      tap(() => {
        this.toastService.addToast({
          message: `Usuario ${request.fullName} creado exitosamente`,
          type: 'success',
          duration: 3000,
        });
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al crear usuario', error),
      ),
    );
  }
  update(id: string, request: Partial<UserRequest>): Observable<UserResponse> {
    const userDoc = doc(this.usersCollection, id);
    const updateData = {
      ...request,
      lastModified: serverTimestamp(),
    };

    return from(updateDoc(userDoc, updateData)).pipe(
      map(
        () =>
          ({
            id,
            fullName: request.fullName || '',
            email: request.email || '',
            role: request.role || 'user',
            profileImage: request.profileImage || null,
            phone: request.phone,
            age: request.age,
            createdAt: new Date(),
            enabled: true,
          }) as UserResponse,
      ),
      tap(() => {
        this.toastService.addToast({
          message: `Usuario ${request.fullName} actualizado exitosamente`,
          type: 'success',
          duration: 3000,
        });
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al actualizar al usuario', error),
      ),
    );
  }

  delete(id: string): Observable<void> {
    const userDoc = doc(this.usersCollection, id);
    return from(
      updateDoc(userDoc, {
        enabled: false,
        deletedAt: serverTimestamp(),
      }),
    ).pipe(
      tap(() => {
        this.toastService.addToast({
          message: `Usuario eliminado exitosamente`,
          type: 'success',
          duration: 3000,
        });
        if (this._selectedUser()?.id === id) {
          this.clearSelectedUser();
        }
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al eliminar el usuario', error),
      ),
    );
  }

  hardDelete(id: string): Observable<void> {
    const userDoc = doc(this.usersCollection, id);

    return from(deleteDoc(userDoc)).pipe(
      tap(() => {
        this.toastService.addToast({
          message: 'Usuario eliminado permanentemente',
          type: 'warning',
          duration: 4000,
        });
        if (this._selectedUser()?.id === id) {
          this.clearSelectedUser();
        }
      }),
      catchError((error) =>
        this.handleFirebaseError(
          'Error al eliminar usuario permanentemente',
          error,
        ),
      ),
    );
  }

  restore(id: string): Observable<UserResponse> {
    const userDoc = doc(this.usersCollection, id);

    return from(
      updateDoc(userDoc, {
        enabled: true,
        restoredAt: serverTimestamp(),
        deletedAt: null,
      }),
    ).pipe(
      map(() => ({ id, enabled: true }) as UserResponse),
      tap(() => {
        this.toastService.addToast({
          message: 'Usuario restaurado exitosamente',
          type: 'success',
          duration: 3000,
        });
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al restaurar usuario', error),
      ),
    );
  }

  private handleFirebaseError(
    userMessage: string,
    error: any,
  ): Observable<never> {
    console.error(`${userMessage}:`, error);

    let errorMessage = userMessage;

    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 'unavailable':
          errorMessage =
            'Servicio temporalmente no disponible. Intenta más tarde';
          break;
        case 'not-found':
          errorMessage = 'El recurso solicitado no fue encontrado';
          break;
        case 'already-exists':
          errorMessage = 'El usuario ya existe';
          break;
        default:
          errorMessage = `${userMessage}. Código: ${error.code}`;
      }
    }

    this.toastService.addToast({
      message: errorMessage,
      type: 'error',
      duration: 5000,
    });

    return throwError(() => new Error(errorMessage));
  }

  getUsersByRole(role: string): Observable<UserResponse[]> {
    const roleQuery = query(
      this.usersCollection,
      where('roles', 'array-contains', role),
      where('enabled', '==', true),
      orderBy('createdAt', 'desc'),
    );

    return from(getDocs(roleQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data['fullName'] || data['displayName'],
            email: data['email'],
            createdAt: data['createdAt'],
            enabled: data['enabled'] ?? true,
            role: data['role'] || 'user',
            profileImage: data['profileImage'] || data['photoURL'] || null,
            phone: data['phone'],
            age: data['age'],
            uid: data['uid'],
          } as UserResponse;
        }),
      ),
      catchError((error) =>
        this.handleFirebaseError('Error al obtener usuarios por rol', error),
      ),
    );
  }

  toggleUserStatus(id: string): Observable<UserResponse> {
    return this.getById(id).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const userDoc = doc(this.usersCollection, id);
        const newStatus = !user.enabled;

        const updatedUser = { ...user, enabled: newStatus };

        return from(
          updateDoc(userDoc, {
            enabled: newStatus,
            statusChangedAt: serverTimestamp(),
          }),
        ).pipe(
          map(() => updatedUser),
          tap(() => {
            this.toastService.addToast({
              message: `Usuario ${newStatus ? 'habilitado' : 'deshabilitado'} exitosamente`,
              type: newStatus ? 'success' : 'warning',
              duration: 3000,
            });
          }),
        );
      }),
      catchError((error) =>
        this.handleFirebaseError('Error al cambiar estado del usuario', error),
      ),
    );
  }
}
