export interface ActivityCategory {
  id?: string;
  localizedName: { [key: string]: string };
  localizedDescription: { [key: string]: string };
  iconResName: string;
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
