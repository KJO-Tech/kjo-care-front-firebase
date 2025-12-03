import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  collection,
  collectionData,
  Firestore,
  orderBy,
  query,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import {
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  throwError,
} from 'rxjs';
import {
  MoodAnalyticsResponse,
  MoodTrendsAnalysis,
} from '../interfaces/mood-analytics.response';
import { MoodEntry } from '../interfaces/mood-entry.interface';
import { Mood } from '../models/mood.model';
import { BlogService } from './blog.service';
import { CommentService } from './comment.service';
import { DailyExerciseService } from './daily-exercise.service';
import { MoodStateService } from './mood-tracking.service';
import { ReactionService } from './reaction.service';

export interface HomeStatistics {
  moodLogDays: number;
  averageBlogLikes: number;
  dailyActivitySummary: {
    completedAssignments: number;
    totalAssignments: number;
  };
  blogAchievements: {
    countBlogs: number;
    countComments: number;
    countReactions: number;
  };
  bestStreak: number;
  totalCheckIns: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private moodService = inject(MoodStateService);
  private blogService = inject(BlogService);
  private commentService = inject(CommentService);
  private reactionService = inject(ReactionService);
  private dailyExerciseService = inject(DailyExerciseService);

  private readonly collectionName = 'moodEntries';

  getHomeStatistics(): Observable<HomeStatistics> {
    return combineLatest({
      allMoodEntries: this.getAllMoodEntries(),
      moods: this.moodService.getMoods(),
      dailyAssignments: this.dailyExerciseService
        .getDailyAssignments()
        .pipe(catchError(() => of({ exercises: [] } as any))),
      countBlogs: this.blogService.countMyBlogs(),
      countComments: this.commentService.countMyComments(),
      countReactions: this.reactionService.countMyReactions(),
    }).pipe(
      map(
        ({
          allMoodEntries,
          moods,
          dailyAssignments,
          countBlogs,
          countComments,
          countReactions,
        }) => {
          // Calculate Statistics
          const totalCheckIns = allMoodEntries.length;

          // Average Mood
          let totalMoodValue = 0;
          let validMoodCount = 0;
          allMoodEntries.forEach((entry) => {
            const mood = this.getMoodFromEntry(entry, moods);
            if (mood && mood.value) {
              totalMoodValue += mood.value;
              validMoodCount++;
            }
          });
          const averageMood =
            validMoodCount > 0
              ? (totalMoodValue / validMoodCount).toFixed(1)
              : '0';
          // Map average mood to a 0-100 scale or keep as is? User said "promedio de su mood en comparacion al value".
          // Assuming value is e.g. 1-5. Let's return the raw average or scaled.
          // Previous code had `averageBlogLikes` as placeholder. Let's use `averageMood` (number).
          const averageMoodValue = parseFloat(averageMood);

          // Streaks
          const { currentStreak, bestStreak } =
            this.calculateStreaks(allMoodEntries);

          const completedAssignments =
            dailyAssignments.exercises?.filter((e: any) => e.completed)
              ?.length || 0;
          const totalAssignments = dailyAssignments.exercises?.length || 0;

          return {
            moodLogDays: currentStreak, // Racha días (Current Streak)
            averageBlogLikes: averageMoodValue, // Promedio (Average Mood)
            dailyActivitySummary: {
              completedAssignments,
              totalAssignments,
            },
            blogAchievements: {
              countBlogs,
              countComments,
              countReactions,
            },
            bestStreak, // For achievements
            totalCheckIns, // For achievements (Check-ins)
          } as any; // Cast to any to match interface temporarily or update interface
        },
      ),
    );
  }

  getAllMoodEntries(): Observable<MoodEntry[]> {
    const user = this.auth.currentUser;
    if (!user) return of([]);

    const entriesQuery = query(
      collection(this.firestore, this.collectionName),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    return collectionData(entriesQuery, { idField: 'id' }) as Observable<
      MoodEntry[]
    >;
  }

  private calculateStreaks(entries: MoodEntry[]): {
    currentStreak: number;
    bestStreak: number;
  } {
    if (!entries.length) return { currentStreak: 0, bestStreak: 0 };

    // Sort by date desc just in case, though query does it
    const sortedEntries = [...entries].sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
    );

    // Get unique dates (YYYY-MM-DD)
    const uniqueDates = new Set<string>();
    sortedEntries.forEach((entry) => {
      const date = entry.createdAt.toDate();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      uniqueDates.add(dateStr);
    });

    const dates = Array.from(uniqueDates).sort().reverse(); // Descending order of unique dates

    if (dates.length === 0) return { currentStreak: 0, bestStreak: 0 };

    // Calculate Current Streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Check if the most recent entry is today or yesterday to start the streak
    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      currentStreak = 1;
      let lastDate = new Date(dates[0]);

      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          lastDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Calculate Best Streak
    let bestStreak = 0;
    let tempStreak = 1;
    if (dates.length > 0) {
      bestStreak = 1;
      let lastDate = new Date(dates[dates.length - 1]); // Start from oldest

      // Re-sort dates ascending for easier best streak calc
      const datesAsc = [...dates].reverse();
      lastDate = new Date(datesAsc[0]);

      for (let i = 1; i < datesAsc.length; i++) {
        const currentDate = new Date(datesAsc[i]);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        lastDate = currentDate;
      }
    }

    return { currentStreak, bestStreak };
  }

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
