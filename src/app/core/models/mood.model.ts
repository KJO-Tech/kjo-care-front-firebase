export interface Mood {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  image: string;
  color: string;
  isActive: boolean;
  value: number;
}
