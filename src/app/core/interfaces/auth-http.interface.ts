import { User } from '@angular/fire/auth';
import { UserModel } from '../models/user.model';

export interface LoginEmail {
  email: string;
  password: string;
}
export interface AuthState {
  user: User | null;
  userData?: UserModel | null;
  isLoading: boolean;
  error: string | null;
}
export interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
}
