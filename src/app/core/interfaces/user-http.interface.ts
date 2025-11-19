export interface UserRequest {
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  role?: 'admin' | 'user';
  profileImage?: string;
  phone?: string;
  age?: number;
  uid?: string;
}

export interface UserResponse extends Omit<UserRequest, 'password'> {
  id: string;
  fullName: string;
  email: string;
  role?: 'admin' | 'user'; // Simplified from roles array as per plan
  enabled: boolean;
  createdAt: any;
  profileImage?: string;
  phone?: string;
  age?: number;
  uid?: string;
}

export type UserInfo = Omit<UserRequest, 'password' | 'role' | 'email'>;
