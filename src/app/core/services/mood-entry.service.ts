import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, map, Observable, switchMap, throwError } from 'rxjs';
import { MoodEntry } from '../interfaces/mood-entry.interface';
import { MoodStateService } from './mood-tracking.service';
import { Mood } from '../models/mood.model';

export interface WeeklyStats {
  average: number;
  registeredDays: number;
  improvement: number;
}

export interface WeeklyMoodEntry {
  day: string;
  date: Date;
  mood: Mood | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class MoodEntryService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private moodService = inject(MoodStateService);

  private readonly collectionName = 'moodEntries';

  /**
   * Add a new mood entry for the current user
   */
  addMoodEntry(moodId: string, note?: string): Observable<string> {
    const user = this.auth.currentUser;
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const entry = {
      userId: user.uid,
      moodId,
      note: note || '',
      createdAt: serverTimestamp(),
    };

    return from(
      addDoc(collection(this.firestore, this.collectionName), entry),
    ).pipe(map((docRef) => docRef.id));
  }

  /**
   * Get mood entries for the current user
   */
  getMoodEntries(limit?: number): Observable<MoodEntry[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const entriesQuery = query(
      collection(this.firestore, this.collectionName),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    return collectionData(entriesQuery, { idField: 'id' }) as Observable<
      MoodEntry[]
    >;
  }

  /**
   * Get weekly history for the current week
   */
  getWeeklyHistory(): Observable<WeeklyMoodEntry[]> {
    return this.getMoodEntries().pipe(
      switchMap((entries) => {
        return this.moodService.getMoods().pipe(
          map((moods) => {
            return this.calculateWeeklyHistory(entries, moods);
          }),
        );
      }),
    );
  }

  /**
   * Calculate weekly statistics for the current user
   */
  getWeeklyStats(): Observable<WeeklyStats> {
    const user = this.auth.currentUser;
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getMoodEntries().pipe(
      switchMap((entries) => {
        return this.moodService.getMoods().pipe(
          map((moods) => {
            return this.calculateStats(entries, moods);
          }),
        );
      }),
    );
  }

  private calculateWeeklyHistory(
    entries: MoodEntry[],
    moods: Mood[],
  ): WeeklyMoodEntry[] {
    const today = new Date();
    const currentDay = today.getDay(); // 0 for Sunday
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Days to subtract to get Monday

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const weeklyData: WeeklyMoodEntry[] = [];
    const dayNames = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);

      // Filter entries for this day
      const dailyEntries = entries.filter((entry) => {
        const entryDate =
          entry.createdAt instanceof Date
            ? entry.createdAt
            : entry.createdAt.toDate();
        return entryDate.toDateString() === currentDate.toDateString();
      });

      // Find dominant mood
      let dominantMood: Mood | undefined = undefined;

      if (dailyEntries.length > 0) {
        const moodCounts: { [key: string]: number } = {};

        dailyEntries.forEach((entry) => {
          const mood = this.getMood(entry, moods);
          if (mood) {
            moodCounts[mood.id] = (moodCounts[mood.id] || 0) + 1;
          }
        });

        let maxCount = 0;
        let dominantMoodId = '';
        for (const id in moodCounts) {
          if (moodCounts[id] > maxCount) {
            maxCount = moodCounts[id];
            dominantMoodId = id;
          }
        }

        if (dominantMoodId) {
          dominantMood = moods.find((m) => m.id === dominantMoodId);
        }
      }

      weeklyData.push({
        day: dayNames[currentDate.getDay()],
        date: currentDate,
        mood: dominantMood,
      });
    }

    return weeklyData;
  }

  private calculateStats(entries: MoodEntry[], moods: any[]): WeeklyStats {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    // Current Week (Monday to Sunday)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() + diffToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Previous Week
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(currentWeekStart.getDate() - 7);

    const prevWeekEnd = new Date(currentWeekStart);
    prevWeekEnd.setDate(currentWeekStart.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);

    // Filter entries
    const currentWeekEntries = entries.filter((e) => {
      const date =
        e.createdAt instanceof Date ? e.createdAt : e.createdAt.toDate();
      return date >= currentWeekStart && date <= currentWeekEnd;
    });

    const prevWeekEntries = entries.filter((e) => {
      const date =
        e.createdAt instanceof Date ? e.createdAt : e.createdAt.toDate();
      return date >= prevWeekStart && date <= prevWeekEnd;
    });

    // Calculate Average for Current Week
    let currentTotal = 0;
    let currentCount = 0;

    // We need unique days for "registeredDays"
    const uniqueDays = new Set<string>();

    currentWeekEntries.forEach((entry) => {
      const mood = this.getMood(entry, moods);
      if (mood && mood.value) {
        currentTotal += mood.value;
        currentCount++;
        const date =
          entry.createdAt instanceof Date
            ? entry.createdAt
            : entry.createdAt.toDate();
        uniqueDays.add(date.toDateString());
      }
    });

    const average = currentCount > 0 ? currentTotal / currentCount : 0;
    const registeredDays = uniqueDays.size;

    // Calculate Average for Previous Week
    let prevTotal = 0;
    let prevCount = 0;

    prevWeekEntries.forEach((entry) => {
      const mood = this.getMood(entry, moods);
      if (mood && mood.value) {
        prevTotal += mood.value;
        prevCount++;
      }
    });

    const prevAverage = prevCount > 0 ? prevTotal / prevCount : 0;

    // Calculate Improvement
    let improvement = 0;
    if (prevAverage > 0) {
      improvement = ((average - prevAverage) / prevAverage) * 100;
    } else if (average > 0) {
      improvement = 100; // 100% improvement if starting from 0? Or just 0?
    }

    return {
      average,
      registeredDays,
      improvement,
    };
  }

  private getMood(entry: MoodEntry, moods: Mood[]): Mood | undefined {
    if (entry.moodId) {
      return moods.find((m) => m.id === entry.moodId);
    } else if (entry.mood) {
      return moods.find(
        (m) =>
          m.name['en']?.toLowerCase() === entry.mood?.toLowerCase() ||
          m.name['es']?.toLowerCase() === entry.mood?.toLowerCase(),
      );
    }
    return undefined;
  }
}
