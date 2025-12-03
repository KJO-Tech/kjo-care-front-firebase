import { Timestamp } from 'firebase/firestore';

export interface MoodEntry {
  id: string;
  moodId?: string; // Link to dynamic mood
  mood?: string; // Legacy enum string
  note: string;
  userId: string;
  createdAt: Timestamp;
}
