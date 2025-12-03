export interface MoodAnalyticsResponse {
  moodCounts: { [key: string]: number };
  moodPercentages: { [key: string]: number };
  totalEntries: number;
  timePeriod?: string;
}

export interface MoodAnalytics {
  [key: string]: number;
}

export interface MoodTrendsAnalysis {
  timePeriod: string;
  totalEntries: number;
  mostCommonMood: string;
  mostCommonMoodPercentage: number;
  variabilityLevel: string;
  variabilityScore: number;
  trendDirection: string;
  weeklyTrendScore: number;
}
