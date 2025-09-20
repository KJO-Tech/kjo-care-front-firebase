import { User } from "firebase/auth";

export interface LoginEmail {
  email: string;
  password: string;
}
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
export interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
}