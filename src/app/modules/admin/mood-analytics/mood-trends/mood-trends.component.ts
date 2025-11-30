import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MoodEntry } from '../../../../core/interfaces/mood-entry.interface';
import { Mood } from '../../../../core/models/mood.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MoodStateService } from '../../../../core/services/mood-tracking.service';

interface TrendPoint {
  date: Date;
  moods: {
    [key: string]: number;
  };
  dominant: string;
}

interface MoodTrend {
  label: string;
  color: string;
  icon: string;
  points: number[];
  trend: 'up' | 'down' | 'stable';
  change: number;
}

@Component({
  selector: 'mood-trends',
  templateUrl: './mood-trends.component.html',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodTrendsComponent {
  private analyticsService = inject(AnalyticsService);
  private moodService = inject(MoodStateService);
  private route = inject(ActivatedRoute);

  // Datos para la visualización
  trendData = signal<TrendPoint[]>([]);
  moodTrends = signal<MoodTrend[]>([]);

  // Períodos de tiempo para visualizar
  // timeRangeOptions = signal<string[]>(['Last Week', 'Last Month', 'Last 3 Months', 'Last Year']);
  selectedTimeRange = signal<string>('Last Month');

  // Días de la semana
  weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Animación de carga
  loading = signal<boolean>(false);

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  // Recurso para datos analíticos
  analyticsResource = rxResource({
    request: () => ({ months: this.getMonthsForRange() }),
    loader: ({ request }) =>
      this.analyticsService.getMoodEntries(request.months),
  });

  // Para las estadísticas
  overallTrend = signal<'up' | 'down' | 'stable'>('stable');
  positivityRate = signal<number>(0);
  moodVariability = signal<number>(0);

  constructor() {
    // Sync query params to selectedTimeRange
    this.route.queryParams.subscribe((params) => {
      if (params['range']) {
        this.selectedTimeRange.set(params['range']);
        // Trigger reload? rxResource should handle it if request depends on signal.
        // Yes, getMonthsForRange uses selectedTimeRange().
      }
    });

    effect(() => {
      const entries = this.analyticsResource.value();
      const moods = this.moodDefinitions.value();

      if (entries && moods) {
        this.processRealData(entries, moods);
      }
    });
  }

  processRealData(entries: MoodEntry[], moods: Mood[]) {
    const timePoints = this.getTimePoints();
    const now = new Date();
    const trendPoints: TrendPoint[] = [];

    // Group entries by date (day, week, or month depending on range)
    // For simplicity, let's group by day for now, or by the granularity needed.
    // The demo data generated points for each unit of "timePoints".

    // Create a map of date string -> entries
    const entriesByDate: { [key: string]: MoodEntry[] } = {};

    entries.forEach((entry) => {
      const date = entry.createdAt.toDate();
      let key = '';
      if (this.selectedTimeRange() === 'Last Year') {
        key = `${date.getFullYear()}-${date.getMonth()}`; // Group by month
      } else if (this.selectedTimeRange() === 'Last 3 Months') {
        // Group by week? Or just day. Let's stick to day for now unless too many points.
        // 90 points is fine.
        key = date.toDateString();
      } else {
        key = date.toDateString();
      }

      if (!entriesByDate[key]) entriesByDate[key] = [];
      entriesByDate[key].push(entry);
    });

    // Generate points
    // We need to iterate backwards from now to cover the range, filling in gaps with 0 or carrying over?
    // Demo data generated points for every step.

    for (let i = 0; i < timePoints; i++) {
      const date = new Date();
      if (this.selectedTimeRange() === 'Last Year') {
        date.setMonth(now.getMonth() - (timePoints - 1 - i));
      } else {
        date.setDate(now.getDate() - (timePoints - 1 - i));
      }

      let key = '';
      if (this.selectedTimeRange() === 'Last Year') {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      } else {
        key = date.toDateString();
      }

      const dailyEntries = entriesByDate[key] || [];
      const moodValues: { [key: string]: number } = {};

      // Initialize all moods to 0
      moods.forEach((m) => {
        const mKey = m.name['en'] || m.name['es'] || m.id;
        moodValues[mKey] = 0;
      });

      // Count moods for this period
      dailyEntries.forEach((entry) => {
        let moodKey = '';
        if (entry.moodId) {
          const m = moods.find((x) => x.id === entry.moodId);
          if (m) moodKey = m.name['en'] || m.name['es'] || m.id;
        } else if (entry.mood) {
          const m = moods.find(
            (x) => x.name['en'] === entry.mood || x.name['es'] === entry.mood,
          );
          moodKey = m ? m.name['en'] || m.name['es'] || m.id : entry.mood;
        }

        if (moodKey) {
          moodValues[moodKey] = (moodValues[moodKey] || 0) + 1;
        }
      });

      // Find dominant
      let dominant = 'None';
      let maxVal = 0;
      Object.entries(moodValues).forEach(([m, val]) => {
        if (val > maxVal) {
          maxVal = val;
          dominant = m;
        }
      });

      trendPoints.push({
        date: new Date(date), // Clone to avoid reference issues
        moods: moodValues,
        dominant,
      });
    }

    this.trendData.set(trendPoints);
    this.calculateMoodTrends(trendPoints, moods);
    this.calculateOverallStats(trendPoints, moods);
  }

  calculateMoodTrends(data: TrendPoint[], moods: Mood[]) {
    const moodTrends: MoodTrend[] = [];

    moods.forEach((mood) => {
      const moodKey = mood.name['en'] || mood.name['es'] || mood.id;

      // Extraer puntos para este estado de ánimo
      const points = data.map((point) => point.moods[moodKey] || 0);

      // If no points, skip? Or show 0?
      // Assuming 'isActive' is a property on Mood, if not, remove this condition.
      if (points.every((p) => p === 0) && !mood.isActive) return;

      // Calcular el cambio
      const firstHalf = points.slice(0, Math.floor(points.length / 2));
      const secondHalf = points.slice(Math.floor(points.length / 2));
      const firstAvg =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
          : 0;
      const secondAvg =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
          : 0;

      let change = 0;
      if (firstAvg > 0) {
        change = ((secondAvg - firstAvg) / firstAvg) * 100;
      } else if (secondAvg > 0) {
        change = 100; // From 0 to something is 100% increase?
      }

      // Determinar la tendencia
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';

      moodTrends.push({
        label: mood.name['es'] || mood.name['en'] || 'Unknown',
        color: mood.color,
        icon: 'mood', // Default icon, maybe map if possible
        points,
        trend,
        change: Number(change.toFixed(2)),
      });
    });

    // Ordenar por puntuación más alta en el último punto
    moodTrends.sort(
      (a, b) => b.points[b.points.length - 1] - a.points[a.points.length - 1],
    );

    this.moodTrends.set(moodTrends);
  }

  calculateOverallStats(data: TrendPoint[], moods: Mood[]) {
    // Calcular la tasa de positividad (proporción de estados de ánimo positivos)
    // We need to know which moods are "positive".
    // Assuming high value moods are positive.

    let positiveCount = 0;
    data.forEach((point) => {
      if (point.dominant !== 'None') {
        // Find mood def for dominant
        const mood = moods.find(
          (m) =>
            m.name['en'] === point.dominant ||
            m.name['es'] === point.dominant ||
            m.id === point.dominant,
        );
        if (mood) {
          // Heuristic: Moods with value >= 7 are considered positive
          if (mood.value >= 7) {
            positiveCount++;
          }
        }
      }
    });

    this.positivityRate.set(
      data.length > 0
        ? Number(((positiveCount / data.length) * 100).toFixed(2))
        : 0,
    );

    // Calcular la variabilidad (cuántos cambios de estado de ánimo dominante hay)
    let changes = 0;
    let validPoints = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].dominant !== 'None' && data[i - 1].dominant !== 'None') {
        validPoints++;
        if (data[i].dominant !== data[i - 1].dominant) {
          changes++;
        }
      }
    }

    this.moodVariability.set(
      validPoints > 0 ? Number(((changes / validPoints) * 100).toFixed(2)) : 0,
    );

    // Determinar tendencia general
    // Let's compare first half vs second half positivity
    const half = Math.floor(data.length / 2);
    let firstHalfPos = 0;
    let secondHalfPos = 0;

    for (let i = 0; i < half; i++) {
      const point = data[i];
      const mood = moods.find(
        (m) =>
          m.name['en'] === point.dominant || m.name['es'] === point.dominant,
      );
      if (mood && mood.value >= 7) firstHalfPos++;
    }

    for (let i = half; i < data.length; i++) {
      const point = data[i];
      const mood = moods.find(
        (m) =>
          m.name['en'] === point.dominant || m.name['es'] === point.dominant,
      );
      if (mood && mood.value >= 7) secondHalfPos++;
    }

    if (secondHalfPos > firstHalfPos) this.overallTrend.set('up');
    else if (secondHalfPos < firstHalfPos) this.overallTrend.set('down');
    else this.overallTrend.set('stable');
  }

  updateTimeRange(range: string) {
    this.selectedTimeRange.set(range);
    this.loading.set(true);

    // Simular recarga de datos
    setTimeout(() => {
      // this.generateDemoData(); // Removed demo data call
      // Trigger reload of resource
      this.analyticsResource.reload();
      this.loading.set(false);
    }, 600);
  }

  getTimePoints(): number {
    switch (this.selectedTimeRange()) {
      case 'Last Week':
        return 7;
      case 'Last Month':
        return 30;
      case 'Last 3 Months':
        return 90;
      case 'Last Year':
        return 52; // Usar semanas para años para que sea manejable
      default:
        return 30;
    }
  }

  getMonthsForRange(): number {
    switch (this.selectedTimeRange()) {
      case 'Last Week':
        return 0.25;
      case 'Last Month':
        return 1;
      case 'Last 3 Months':
        return 3;
      case 'Last Year':
        return 12;
      default:
        return 1;
    }
  }

  // Obtener las etiquetas para el eje X basado en el rango de tiempo
  getXAxisLabels(): string[] {
    const data = this.trendData();
    const timeRange = this.selectedTimeRange();

    if (!data.length) return [];

    const labels: string[] = [];

    switch (timeRange) {
      case 'Last Week':
        return data.map((point) => this.weekdays[point.date.getDay()]);
      case 'Last Month':
        if (data.length > 10) {
          // Mostrar solo algunas fechas para evitar amontonamiento
          for (let i = 0; i < data.length; i += 3) {
            labels.push(
              `${data[i].date.getDate()}/${data[i].date.getMonth() + 1}`,
            );
          }
          if (
            labels[labels.length - 1] !==
            `${data[data.length - 1].date.getDate()}/${data[data.length - 1].date.getMonth() + 1}`
          ) {
            labels.push(
              `${data[data.length - 1].date.getDate()}/${data[data.length - 1].date.getMonth() + 1}`,
            );
          }
        } else {
          data.forEach((point) => {
            labels.push(`${point.date.getDate()}/${point.date.getMonth() + 1}`);
          });
        }
        return labels;
      case 'Last 3 Months':
        // Agrupar por semanas
        for (let i = 0; i < data.length; i += 7) {
          labels.push(
            `${data[i].date.getDate()}/${data[i].date.getMonth() + 1}`,
          );
        }
        if (
          labels[labels.length - 1] !==
          `${data[data.length - 1].date.getDate()}/${data[data.length - 1].date.getMonth() + 1}`
        ) {
          labels.push(
            `${data[data.length - 1].date.getDate()}/${data[data.length - 1].date.getMonth() + 1}`,
          );
        }
        return labels;
      case 'Last Year':
        // Agrupar por meses
        const monthNames = [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        const months: { [key: string]: boolean } = {};

        data.forEach((point) => {
          const monthKey = `${monthNames[point.date.getMonth()]}`;
          if (!months[monthKey]) {
            months[monthKey] = true;
            labels.push(monthKey);
          }
        });
        return labels;
      default:
        return data.map((_, i) => i.toString());
    }
  }

  // Función para normalizar los puntos de datos para mostrarlos en la gráfica
  normalizePoints(points: number[], maxHeight: number = 100): number[] {
    if (!points.length) return [];
    const max = Math.max(...points);
    return points.map((p) => (max > 0 ? (p / max) * maxHeight : 0));
  }

  // Generar path SVG para la gráfica
  generatePath(points: number[], maxHeight: number = 100): string {
    const normalized = this.normalizePoints(points, maxHeight);
    const width = 100 / (normalized.length - 1);

    return normalized
      .map((point, i) => {
        const x = i * width;
        const y = maxHeight - point;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  // Generar área bajo la curva para gráficas
  generateArea(points: number[], maxHeight: number = 100): string {
    const path = this.generatePath(points, maxHeight);
    const width = 100;
    return `${path} L ${width} ${maxHeight} L 0 ${maxHeight} Z`;
  }

  // Métodos para conseguir el color de la tarjeta según la tendencia
  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'border-success';
      case 'down':
        return 'border-error';
      default:
        return 'border-base-300';
    }
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  getTrendText(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-base-content';
    }
  }
}
