import { computed, Injectable, signal } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { browserLocalPersistence, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';

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
    private router: Router
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

      await signInWithPopup(this.auth, provider)
        .then((result) => {
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => {
          console.error('Error de autenticación:', error);
          throw error;
        })
        .finally(() => {
          this._isLoading.set(false);
        });
    } catch (error) {
      this._isLoading.set(false);
      throw error;
    }
  }
  async register(email: string, password: string): Promise<void> {
    try {
      this._isLoading.set(true);
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      if (userCredential.user) {
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      throw new Error('No se pudo completar el registro. Por favor, verifica tus datos e intenta nuevamente.');
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
}
