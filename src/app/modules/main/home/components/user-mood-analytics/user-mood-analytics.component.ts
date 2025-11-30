import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EChartsOption } from 'echarts';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { MoodEntry } from '../../../../../core/interfaces/mood-entry.interface';
import { Mood } from '../../../../../core/models/mood.model';
import { MoodEntryService } from '../../../../../core/services/mood-entry.service';
import { MoodStateService } from '../../../../../core/services/mood-tracking.service';

@Component({
  selector: 'user-mood-analytics',
  templateUrl: './user-mood-analytics.component.html',
  imports: [NgxEchartsModule, DatePipe],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') }),
    },
  ],
})
export class UserMoodAnalyticsComponent {
  private moodEntryService = inject(MoodEntryService);
  private moodService = inject(MoodStateService);

  // Time range state
  timeRange = signal<'1m' | '3m' | '1y'>('1m');

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  // Load entries based on time range
  entriesResource = rxResource({
    request: () => ({ range: this.timeRange() }),
    loader: ({ request }) => {
      const endDate = new Date();
      const startDate = new Date();

      if (request.range === '1m') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (request.range === '3m') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (request.range === '1y') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      return this.moodEntryService.getMoodEntriesByDateRange(
        startDate,
        endDate,
      );
    },
  });

  // Custom Heatmap State
  weeks = signal<
    { days: { date: Date; color: string; mood?: string; value?: number }[] }[]
  >([]);
  monthLabels = signal<{ label: string; offset: number }[]>([]);

  constructor() {
    effect(() => {
      const entries = this.entriesResource.value();
      const moods = this.moodDefinitions.value();

      if (entries && moods) {
        this.processHeatmapData(entries, moods);
      }
    });
  }

  // Chart Options Signals
  donutOption = computed<EChartsOption | null>(() => {
    const entries = this.entriesResource.value();
    const moods = this.moodDefinitions.value();
    if (!entries || !moods) return null;

    return this.generateDonutOption(entries, moods);
  });

  radarOption = computed<EChartsOption | null>(() => {
    const entries = this.entriesResource.value();
    const moods = this.moodDefinitions.value();
    if (!entries || !moods) return null;

    return this.generateRadarOption(entries, moods);
  });

  setTimeRange(range: '1m' | '3m' | '1y') {
    this.timeRange.set(range);
  }

  private processHeatmapData(entries: MoodEntry[], moods: Mood[]) {
    const now = new Date();
    const range = this.timeRange();
    let daysCount = 30;

    if (range === '1m') daysCount = 30;
    else if (range === '3m') daysCount = 90;
    else if (range === '1y') daysCount = 365;

    // Calculate start date
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysCount);

    // Align start date to the previous Sunday (to start the grid correctly)
    const dayOfWeek = startDate.getDay(); // 0 = Sunday
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: {
      days: { date: Date; color: string; mood?: string; value?: number }[];
    }[] = [];
    let currentWeek: {
      date: Date;
      color: string;
      mood?: string;
      value?: number;
    }[] = [];

    // Iterate day by day from startDate
    const iterDate = new Date(startDate);
    // We want to go until we pass 'now' and finish the current week
    while (iterDate <= now || iterDate.getDay() !== 0) {
      const dateStr = iterDate.toDateString();
      const entry = entries.find((e) => {
        const d =
          e.createdAt instanceof Date ? e.createdAt : e.createdAt.toDate();
        return d.toDateString() === dateStr;
      });

      let color = '#ebedf0'; // Default empty color
      let moodLabel = undefined;
      let value = undefined;

      if (entry) {
        let mood: Mood | undefined;
        if (entry.moodId) {
          mood = moods.find((m) => m.id === entry.moodId);
        } else if (entry.mood) {
          mood = moods.find(
            (m) => m.name['en'] === entry.mood || m.name['es'] === entry.mood,
          );
        }
        if (mood) {
          color = mood.color;
          moodLabel = mood.name['es'] || mood.name['en'];
          value = mood.value;
        }
      }

      currentWeek.push({
        date: new Date(iterDate),
        color,
        mood: moodLabel,
        value,
      });

      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }

      iterDate.setDate(iterDate.getDate() + 1);

      // Safety break
      if (weeks.length > 60) break;
    }

    if (currentWeek.length > 0) {
      weeks.push({ days: currentWeek });
    }

    this.weeks.set(weeks);
    this.generateMonthLabels(weeks);
  }

  private generateMonthLabels(weeks: { days: { date: Date }[] }[]) {
    const labels: { label: string; offset: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const date = week.days[0].date;
      const month = date.getMonth();

      if (month !== lastMonth) {
        const monthName = date.toLocaleString('default', { month: 'short' });
        labels.push({ label: monthName, offset: index });
        lastMonth = month;
      }
    });

    this.monthLabels.set(labels);
  }

  private generateDonutOption(
    entries: MoodEntry[],
    moods: Mood[],
  ): EChartsOption {
    const moodCounts: {
      [key: string]: { count: number; color: string; name: string };
    } = {};

    entries.forEach((entry) => {
      let mood: Mood | undefined;
      if (entry.moodId) {
        mood = moods.find((m) => m.id === entry.moodId);
      } else if (entry.mood) {
        mood = moods.find(
          (m) => m.name['en'] === entry.mood || m.name['es'] === entry.mood,
        );
      }

      if (mood) {
        const id = mood.id;
        if (!moodCounts[id]) {
          moodCounts[id] = {
            count: 0,
            color: mood.color,
            name: mood.name['es'] || mood.name['en'],
          };
        }
        moodCounts[id].count++;
      }
    });

    const data = Object.values(moodCounts).map((item) => ({
      value: item.count,
      name: item.name,
      itemStyle: { color: item.color },
    }));

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: '0%',
        left: 'center',
      },
      series: [
        {
          name: 'Estados de Ánimo',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
            smooth: 0.2,
            length: 10,
            length2: 20,
          },
          data: data,
        },
      ],
    };
  }

  private generateRadarOption(
    entries: MoodEntry[],
    moods: Mood[],
  ): EChartsOption {
    // Map specific moods to axes
    const moodCounts: { [key: string]: number } = {};
    const moodColors: { [key: string]: string } = {};
    const moodNames: string[] = [];
    const indicators: { name: string; max: number; color?: string }[] = [];

    // Initialize counts for all available moods
    moods.forEach((mood) => {
      const name = mood.name['es'] || mood.name['en'];
      moodCounts[name] = 0;
      moodColors[name] = mood.color;
      if (!moodNames.includes(name)) {
        moodNames.push(name);
      }
    });

    // Count occurrences
    entries.forEach((entry) => {
      let mood: Mood | undefined;
      if (entry.moodId) {
        mood = moods.find((m) => m.id === entry.moodId);
      } else if (entry.mood) {
        mood = moods.find(
          (m) => m.name['en'] === entry.mood || m.name['es'] === entry.mood,
        );
      }

      if (mood) {
        const name = mood.name['es'] || mood.name['en'];
        if (moodCounts[name] !== undefined) {
          moodCounts[name]++;
        }
      }
    });

    const maxCount = Math.max(...Object.values(moodCounts)) + 1;

    moodNames.forEach((name) => {
      indicators.push({
        name,
        max: maxCount,
        color: moodColors[name] || '#999',
      });
    });

    // Main Series Data (The Shape)
    const mainData = moodNames.map((name) => moodCounts[name]);

    // Auxiliary Series for Colored Points
    const pointSeries = moodNames.map((name, index) => {
      // Create an array of 0s, with the value only at the specific index
      const data = new Array(moodNames.length).fill(0);
      data[index] = moodCounts[name];

      return {
        name: name,
        type: 'radar',
        symbol: 'circle',
        symbolSize: (val: number) => (val > 0 ? 8 : 0), // Hide point if value is 0
        itemStyle: {
          color: moodColors[name],
        },
        lineStyle: { width: 0 }, // Hide line
        areaStyle: { opacity: 0 }, // Hide area
        data: [
          {
            value: data,
            name: name,
          },
        ],
        z: 10, // Ensure points are on top
      };
    });

    return {
      tooltip: {},
      radar: {
        indicator: indicators,
        shape: 'circle',
        splitNumber: 5,
        axisName: {
          fontWeight: 'bold',
          color: '#6b7280', // Gray-500 for better visibility in light mode
        },
        splitLine: {
          lineStyle: {
            color: [
              'rgba(139, 92, 246, 0.1)', // Violet-500 with opacity
              'rgba(139, 92, 246, 0.2)',
              'rgba(139, 92, 246, 0.4)',
              'rgba(139, 92, 246, 0.6)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(139, 92, 246, 1)',
            ].reverse(),
          },
        },
        splitArea: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(139, 92, 246, 0.5)',
          },
        },
      },
      series: [
        // Main Shape
        {
          name: 'Perfil Emocional',
          type: 'radar',
          data: [
            {
              value: mainData,
              name: 'Frecuencia',
              areaStyle: {
                color: 'rgba(139, 92, 246, 0.5)', // Violet-500 with opacity
              },
              itemStyle: {
                color: '#8b5cf6', // Violet-500
              },
            },
          ],
          z: 1,
        },
        // Colored Points
        ...(pointSeries as any),
      ],
    };
  }
}
