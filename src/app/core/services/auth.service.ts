import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  catchError,
  finalize,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  AuthState,
  LoginEmail,
  LoginResponse,
  RegisterForm,
} from '../interfaces/auth-http.interface';
import { UserModel } from '../models/user.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly firestore = inject(Firestore);

  private readonly state = signal<AuthState>({
    user: null,
    userData: null,
    isLoading: true,
    error: null,
  });

  public readonly currentUser = computed(() => this.state().user);
  public readonly userData = computed(() => this.state().userData);
  public readonly isLoading = computed(() => this.state().isLoading);
  public readonly isAuthenticated = computed(() => !!this.state().user);
  public readonly error = computed(() => this.state().error);

  constructor() {
    this.auth.setPersistence(browserLocalPersistence);

    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.getUserData(user.uid).subscribe((userData) => {
          this.state.update((state) => ({
            ...state,
            user,
            userData,
            isLoading: false,
            error: null,
          }));
        });
      } else {
        this.state.update((state) => ({
          ...state,
          user: null,
          userData: null,
          isLoading: false,
          error: null,
        }));
      }
    });
  }

  loginWithEmail(user: LoginEmail): Observable<LoginResponse> {
    return from(
      signInWithEmailAndPassword(this.auth, user.email, user.password),
    ).pipe(
      map(() => ({ success: true })),
      catchError((error) => {
        const errorMessage = this.handleAuthError(error);
        return throwError(
          () => new Error(`Error al iniciar sesión: ${errorMessage}`),
        );
      }),
    );
  }

  loginWithGoogle(): Observable<LoginResponse> {
    this.setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((result) => {
        if (!result.user) {
          throw new Error('No se pudo obtener la información del usuario');
        }

        const userRef = doc(this.firestore, 'users', result.user.uid);
        return from(getDoc(userRef)).pipe(
          switchMap((docSnap) => {
            if (docSnap.exists()) {
              return of({ success: true });
            } else {
              const userData: UserModel = {
                uid: result.user.uid,
                email: result.user.email!,
                fullName: result.user.displayName || 'Usuario de Google',
                profileImage: result.user.photoURL || undefined,
                createdAt: new Date(),
                role: 'user',
              };
              return from(setDoc(userRef, userData)).pipe(
                map(() => ({ success: true })),
              );
            }
          }),
        );
      }),
      catchError((error) => {
        const errorMessage = this.handleAuthError(error);
        return of({ success: false, error: errorMessage });
      }),
      finalize(() => this.setLoading(false)),
    );
  }

  register(user: RegisterForm): Observable<LoginResponse> {
    return from(
      createUserWithEmailAndPassword(this.auth, user.email, user.password),
    ).pipe(
      switchMap((userCredential) => {
        const userData: UserModel = {
          uid: userCredential.user.uid,
          email: user.email,
          fullName: user.displayName, // Mapping displayName from form to fullName in model
          createdAt: new Date(),
          role: 'user',
        };

        return from(
          setDoc(
            doc(this.firestore, 'users', userCredential.user.uid),
            userData,
          ),
        ).pipe(map(() => ({ success: true })));
      }),
      catchError((error) => {
        const errorMessage = this.handleAuthError(error);
        return of({ success: false, error: errorMessage });
      }),
    );
  }

  resetPassword(email: string): Observable<LoginResponse> {
    this.setLoading(true);

    return from(
      sendPasswordResetEmail(this.auth, email, {
        url: `${window.location.origin}/auth/login`,
        handleCodeInApp: true,
      }),
    ).pipe(
      map(() => ({ success: true })),
      tap(() => {
        this.toastService.addToast({
          message: 'Se ha enviado un correo para restablecer tu contraseña',
          type: 'success',
          duration: 5000,
        });
      }),
      catchError((error) => {
        const errorMessage = this.handleAuthError(error);
        return of({ success: false, error: errorMessage });
      }),
      finalize(() => this.setLoading(false)),
    );
  }

  logout(): Observable<void> {
    return from(
      Promise.all([this.router.navigate(['/']), signOut(this.auth)]),
    ).pipe(
      map(() => void 0),
      catchError((error) => {
        this.toastService.addToast({
          message: 'Error al cerrar sesión',
          type: 'error',
          duration: 3000,
        });
        return throwError(() => error);
      }),
    );
  }

  getUserData(uid: string): Observable<UserModel | null> {
    return from(getDoc(doc(this.firestore, 'users', uid))).pipe(
      map((userDoc) =>
        userDoc.exists() ? (userDoc.data() as UserModel) : null,
      ),
      catchError((error) => {
        this.toastService.addToast({
          message: 'Error al obtener datos del usuario',
          type: 'error',
          duration: 3000,
        });
        return of(null);
      }),
    );
  }

  private setLoading(isLoading: boolean): void {
    this.state.update((state) => ({
      ...state,
      isLoading,
      error: isLoading ? null : state.error,
    }));
  }

  private handleAuthError(error: any): string {
    let errorMessage = 'Credenciales inválidas';
    if (error.code) {
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Por favor, intente más tarde';
          break;
        default:
          errorMessage =
            'Error en la autenticación. Por favor, verifique sus credenciales';
          break;
      }
    }
    this.toastService.addToast({
      message: errorMessage,
      type: 'error',
      duration: 3000,
    });

    return errorMessage;
  }
}
