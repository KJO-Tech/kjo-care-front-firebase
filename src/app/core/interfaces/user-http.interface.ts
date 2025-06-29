export interface UserRequest {
  id?: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string
  password?: string;
  roles: string[];
  photoURL?: string;
  uid?: string
}

export interface UserResponse extends Omit<UserRequest, 'password'> {
  id: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles: string[];
  enabled: boolean;
  createdAt: any;
  photoURL?: string;
  uid?: string
}

export type UserInfo = Omit<UserRequest, 'password' | 'roles' | 'email'>;
