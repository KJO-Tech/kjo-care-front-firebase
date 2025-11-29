import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  collection,
  collectionData,
  Firestore,
  query,
  where,
  Timestamp,
  orderBy,
} from '@angular/fire/firestore';
import {
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import {
  MoodAnalyticsResponse,
  MoodTrendsAnalysis,
} from '../interfaces/mood-analytics.response';
import { MoodStateService } from './mood-tracking.service';
import { MoodEntry } from '../interfaces/mood-entry.interface';
import { Mood } from '../models/mood.model';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private moodService = inject(MoodStateService);

  private readonly collectionName = 'moodEntries';

  getMoodAnalytics(months: number = 3): Observable<MoodAnalyticsResponse> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startTimestamp = Timestamp.fromDate(startDate);

    const entriesQuery = query(
      collection(this.firestore, this.collectionName),
      where('createdAt', '>=', startTimestamp),
      orderBy('createdAt', 'desc'),
    );

    return combineLatest([
      this.moodService.getMoods(),
      collectionData(entriesQuery, { idField: 'id' }) as Observable<
        MoodEntry[]
      >,
    ]).pipe(
      map(([moods, entries]) => {
        return this.calculateAnalytics(moods, entries);
      }),
      catchError((error) => {
        console.error('Error getting mood analytics', error);
        return throwError(() => new Error('Error getting mood analytics'));
      }),
    );
  }

  private calculateAnalytics(
    moods: Mood[],
    entries: MoodEntry[],
  ): MoodAnalyticsResponse {
    // Filter out entries that don't match any defined mood
    const validEntries = entries.filter((entry) =>
      this.getMoodFromEntry(entry, moods),
    );

    const moodCounts: { [key: string]: number } = {};
    const moodPercentages: { [key: string]: number } = {};
    const totalEntries = validEntries.length;

    // Initialize counts
    moods.forEach((mood) => {
      const key = mood.name['en'] || mood.name['es'] || mood.id;
      moodCounts[key] = 0;
    });

    // Count entries
    validEntries.forEach((entry) => {
      const mood = this.getMoodFromEntry(entry, moods);
      if (mood) {
        const moodKey = mood.name['en'] || mood.name['es'] || mood.id;
        if (moodCounts[moodKey] !== undefined) {
          moodCounts[moodKey]++;
        }
      }
    });

    // Calculate percentages
    Object.keys(moodCounts).forEach((key) => {
      moodPercentages[key] =
        totalEntries > 0 ? (moodCounts[key] / totalEntries) * 100 : 0;
    });

    return {
      moodCounts,
      moodPercentages,
      totalEntries,
    };
  }

  getMoodTrendsAnalysis(months: number = 3): Observable<MoodTrendsAnalysis> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startTimestamp = Timestamp.fromDate(startDate);

    const entriesQuery = query(
      collection(this.firestore, this.collectionName),
      where('createdAt', '>=', startTimestamp),
      orderBy('createdAt', 'desc'),
    );

    return combineLatest([
      this.moodService.getMoods(),
      collectionData(entriesQuery, { idField: 'id' }) as Observable<
        MoodEntry[]
      >,
    ]).pipe(
      map(([moods, entries]) => {
        return this.calculateTrends(moods, entries, months);
      }),
      catchError((error) => {
        console.error('Error getting mood trends', error);
        return throwError(() => new Error('Error getting mood trends'));
      }),
    );
  }

  getMoodEntries(months: number = 3): Observable<MoodEntry[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startTimestamp = Timestamp.fromDate(startDate);

    const entriesQuery = query(
      collection(this.firestore, this.collectionName),
      where('createdAt', '>=', startTimestamp),
      orderBy('createdAt', 'desc'),
    );

    return collectionData(entriesQuery, { idField: 'id' }) as Observable<
      MoodEntry[]
    >;
  }

  private calculateTrends(
    moods: Mood[],
    entries: MoodEntry[],
    months: number,
  ): MoodTrendsAnalysis {
    // Filter out entries that don't match any defined mood
    const validEntries = entries.filter((entry) =>
      this.getMoodFromEntry(entry, moods),
    );

    const totalEntries = validEntries.length;
    if (totalEntries === 0) {
      return {
        timePeriod: `Last ${months} months`,
        totalEntries: 0,
        mostCommonMood: 'N/A',
        mostCommonMoodPercentage: 0,
        variabilityLevel: 'Low',
        variabilityScore: 0,
        trendDirection: 'Stable',
        weeklyTrendScore: 0,
      };
    }

    // 1. Most Common Mood
    const moodCounts: { [key: string]: number } = {};
    validEntries.forEach((entry) => {
      const mood = this.getMoodFromEntry(entry, moods);
      if (mood) {
        const moodKey = mood.name['en'] || mood.name['es'] || mood.id;
        moodCounts[moodKey] = (moodCounts[moodKey] || 0) + 1;
      }
    });

    let mostCommonMood = 'N/A';
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood;
      }
    });

    const mostCommonMoodPercentage = Number(
      ((maxCount / totalEntries) * 100).toFixed(1),
    );

    // 2. Variability
    let switches = 0;
    for (let i = 0; i < validEntries.length - 1; i++) {
      const current = validEntries[i];
      const next = validEntries[i + 1];
      const currentMood = this.getMoodFromEntry(current, moods);
      const nextMood = this.getMoodFromEntry(next, moods);

      if (currentMood && nextMood && currentMood.id !== nextMood.id) {
        switches++;
      }
    }

    // Normalize variability score 0-10
    const variabilityScore =
      totalEntries > 1 ? (switches / (totalEntries - 1)) * 10 : 0;
    let variabilityLevel = 'Low';
    if (variabilityScore > 7) variabilityLevel = 'High';
    else if (variabilityScore > 3) variabilityLevel = 'Moderate';

    // 3. Trend Direction
    let trendDirection = 'Stable';
    let weeklyTrendScore = 0;

    const entriesWithValues = validEntries
      .map((entry) => {
        const mood = this.getMoodFromEntry(entry, moods);
        return { date: entry.createdAt.toDate(), value: mood?.value || 0 };
      })
      .filter((e) => e.value > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (entriesWithValues.length >= 2) {
      const half = Math.floor(entriesWithValues.length / 2);
      const firstHalf = entriesWithValues.slice(0, half);
      const secondHalf = entriesWithValues.slice(half);

      const avg1 =
        firstHalf.reduce((sum, e) => sum + e.value, 0) / firstHalf.length;
      const avg2 =
        secondHalf.reduce((sum, e) => sum + e.value, 0) / secondHalf.length;

      const diff = avg2 - avg1;
      weeklyTrendScore = diff;

      if (diff > 0.5) trendDirection = 'Improving';
      else if (diff < -0.5) trendDirection = 'Declining';
    }

    return {
      timePeriod: `Last ${months} months`,
      totalEntries,
      mostCommonMood,
      mostCommonMoodPercentage,
      variabilityLevel,
      variabilityScore,
      trendDirection,
      weeklyTrendScore,
    };
  }

  private getMoodFromEntry(entry: MoodEntry, moods: Mood[]): Mood | undefined {
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
