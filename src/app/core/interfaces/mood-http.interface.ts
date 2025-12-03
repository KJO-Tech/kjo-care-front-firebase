export interface MoodStateRequest {
  name: { [key: string]: string };
  description: { [key: string]: string };
  image?: string;
  color: string;
  materialIcon: string;
  value: number;
}

export interface MoodStateResponse {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  image: string;
  color: string;
  isActive: boolean;
  value: number;
}
