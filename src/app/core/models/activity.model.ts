import { Timestamp } from 'firebase/firestore';

export interface ActivityCategory {
  id?: string;
  localizedName: { [key: string]: string };
  localizedDescription: { [key: string]: string };
  imageUrl: string;
  order: number;
}

export interface DailyExercise {
  id?: string;
  categoryId: string;
  localizedTitle: { [key: string]: string };
  localizedDescription: { [key: string]: string };
  durationMinutes: number;
  contentType: ExerciseContentType;
  contentUrl: string;
  localizedContentText: { [key: string]: string };
  thumbnailUrl: string;
  difficulty: ExerciseDifficultyType;
  tags: string[];
}

export enum ExerciseContentType {
  TEXT = 'TEXT',
  GAME = 'GAME',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum ExerciseDifficultyType {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export interface DailyAssignment {
  id?: string;
  userId: string;
  date: string; // ISO date string YYYY-MM-DD
  exercises: AssignedExercise[];
}

export interface AssignedExercise {
  exerciseId: string;
  completed: boolean;
  completedAt?: Timestamp; // Timestamp
  isAdHoc?: boolean; // True if added by user, false if auto-assigned
}
