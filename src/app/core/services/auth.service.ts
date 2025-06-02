import { computed, Injectable, signal } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { browserLocalPersistence, createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { ToastService } from './toast.service';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null)
  private _isLoading = signal(false)
  public isAuthenticated = computed(() => !!this.currentUser())
  public isLoading = computed(() => this._isLoading())
  constructor(
    private auth: Auth,
    private router: Router,
    private toastService: ToastService,
    private firestore: Firestore
  ) {
    auth.setPersistence(browserLocalPersistence)
    auth.onAuthStateChanged((user) => {
      this.currentUser.set(user)
    })

  }
  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      this._isLoading.set(true);
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      if (userCredential.user) {
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      throw new Error('Credenciales incorrectas');
    } finally {
      this._isLoading.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      this._isLoading.set(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(this.auth, provider)
      if (result.user) {
        const userData: UserModel = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || "Usuario de google",
          photoURL: result.user.photoURL || undefined,
          createdAt: new Date()
        }
        await setDoc(
          doc(this.firestore, "users", result.user.uid),
          userData,
          { merge: true }
        )
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      this.toastService.addToast({
        message: 'Error al iniciar sesión con Google',
        type: 'error',
        duration: 3000
      })
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  async register(email: string, password: string, displayName: string): Promise<void> {
    try {
      this._isLoading.set(true);
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      if (userCredential.user) {
        const userData: UserModel = {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          createdAt: new Date()
        };

        try {
          const userDocRef = doc(this.firestore, "users", userCredential.user.uid);
          await setDoc(userDocRef, userData);

          this.toastService.addToast({
            message: 'Registro exitoso',
            type: 'success',
            duration: 3000
          });
        } catch (firestoreError) {
          await userCredential.user.delete();

          this.toastService.addToast({
            message: 'Error al guardar datos del usuario. Por favor, intenta nuevamente.',
            type: 'error',
            duration: 5000
          });
          throw firestoreError;
        }

        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      this.toastService.addToast({
        message: 'Error en el registro. Verifica tus datos e intenta nuevamente.',
        type: 'error',
        duration: 3000
      });
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      this._isLoading.set(true);
      await sendPasswordResetEmail(this.auth, email, {
        url: `${window.location.origin}/auth/login`,
        handleCodeInApp: true
      });
      this.toastService.addToast({
        message: 'Se ha enviado un correo para restablecer tu contraseña',
        type: 'success',
        duration: 5000
      });
    } catch (error) {
      this.toastService.addToast({
        message: 'No se pudo enviar el correo de restablecimiento',
        type: 'error',
        duration: 5000
      });
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      this._isLoading.set(true);
      await signOut(this.auth)
      await this.router.navigate(['/auth/login'])
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      throw error
    }
  }
  getUser() {
    return this.currentUser
  }
  async getUserData(uid: string): Promise<UserModel | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      return userDoc.exists() ? userDoc.data() as UserModel : null;
    } catch (error) {
      this.toastService.addToast({
        message: 'Error al obtener datos del usuario',
        type: 'error',
        duration: 3000
      });
      return null;
    }
  }
}
