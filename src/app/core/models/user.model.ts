export interface UserModel {
  uid: string;
  fullName: string;
  email: string;
  createdAt: any;
  profileImage?: string;
  phone?: string;
  age?: number;
  role?: 'admin' | 'user';
}
