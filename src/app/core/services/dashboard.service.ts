import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  where,
  Timestamp,
} from '@angular/fire/firestore';
import {
  DashboardStats,
  DailyBlogsStats,
  UserMoodStats,
} from '../interfaces/dashboard-http.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private firestore = inject(Firestore);

  // Collections
  private usersCollection = collection(this.firestore, 'users');
  private blogsCollection = collection(this.firestore, 'blogs');
  private moodsCollection = collection(this.firestore, 'moods');
  private healthCentersCollection = collection(
    this.firestore,
    'health_centers',
  );

  // Signals for raw data
  private users$ = collectionData(this.usersCollection, { idField: 'id' }).pipe(
    catchError((error) => {
      console.error('Error fetching users:', error);
      return of([]);
    }),
  );

  private blogs$ = collectionData(this.blogsCollection, { idField: 'id' }).pipe(
    catchError((error) => {
      console.error('Error fetching blogs:', error);
      return of([]);
    }),
  );

  private moods$ = collectionData(this.moodsCollection, { idField: 'id' }).pipe(
    catchError((error) => {
      console.error('Error fetching moods:', error);
      return of([]);
    }),
  );

  private healthCenters$ = collectionData(this.healthCentersCollection, {
    idField: 'id',
  }).pipe(
    catchError((error) => {
      console.error('Error fetching health centers:', error);
      return of([]);
    }),
  );

  // Computed signals for stats
  dashboardStats = toSignal(
    combineLatest([
      this.users$,
      this.blogs$,
      this.moods$,
      this.healthCenters$,
    ]).pipe(
      map(([users, blogs, moods, healthCenters]) => {
        return {
          totalUsers: this.calculateStats(users),
          blogPosts: this.calculateStats(blogs),
          moodEntries: this.calculateStats(moods),
          healthCenters: this.calculateStats(healthCenters),
        } as DashboardStats;
      }),
    ),
  );

  userMoodStats = toSignal(
    this.moods$.pipe(
      map((moods) => {
        // Filter for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMoods = moods.filter((mood: any) => {
          const date =
            mood.createdAt instanceof Timestamp
              ? mood.createdAt.toDate()
              : new Date(mood.createdAt);
          return date >= thirtyDaysAgo;
        });

        // Group by date
        const grouped = recentMoods.reduce((acc: any, mood: any) => {
          const date =
            mood.createdAt instanceof Timestamp
              ? mood.createdAt.toDate()
              : new Date(mood.createdAt);
          const dateStr = date.toISOString().split('T')[0];
          acc[dateStr] = (acc[dateStr] || 0) + 1;
          return acc;
        }, {});

        return Object.keys(grouped)
          .map((date) => ({
            date: new Date(date),
            count: grouped[date],
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
      }),
    ),
  );

  blogStats = toSignal(
    this.blogs$.pipe(
      map((blogs) => {
        // Filter for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const currentMonthBlogs = blogs.filter((blog: any) => {
          const date =
            blog.createdAt instanceof Timestamp
              ? blog.createdAt.toDate()
              : new Date(blog.createdAt);
          return date >= startOfMonth;
        });

        // Group by date
        const grouped = currentMonthBlogs.reduce((acc: any, blog: any) => {
          const date =
            blog.createdAt instanceof Timestamp
              ? blog.createdAt.toDate()
              : new Date(blog.createdAt);
          const dateStr = date.toISOString().split('T')[0];
          acc[dateStr] = (acc[dateStr] || 0) + 1;
          return acc;
        }, {});

        return Object.keys(grouped)
          .map((date) => ({
            date: new Date(date),
            count: grouped[date],
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
      }),
    ),
  );

  private calculateStats(data: any[]) {
    const currentCount = data.length;

    // Calculate percentage change (comparing to previous month for simplicity, or just mock it if historical data isn't easy)
    // For now, let's calculate based on items created this month vs last month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCount = data.filter((item: any) => {
      const date =
        item.createdAt instanceof Timestamp
          ? item.createdAt.toDate()
          : new Date(item.createdAt || now);
      return date >= startOfThisMonth;
    }).length;

    const lastMonthCount = data.filter((item: any) => {
      const date =
        item.createdAt instanceof Timestamp
          ? item.createdAt.toDate()
          : new Date(item.createdAt || now);
      return date >= startOfLastMonth && date < startOfThisMonth;
    }).length;

    let percentageChange = 0;
    if (lastMonthCount > 0) {
      percentageChange =
        ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (thisMonthCount > 0) {
      percentageChange = 100;
    }

    return {
      currentValue: currentCount,
      percentageChange: percentageChange,
    };
  }
}
