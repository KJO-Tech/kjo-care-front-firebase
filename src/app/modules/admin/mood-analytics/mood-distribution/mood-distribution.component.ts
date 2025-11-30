import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MoodAnalyticsResponse } from '../../../../core/interfaces/mood-analytics.response';
import { Mood } from '../../../../core/models/mood.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MoodStateService } from '../../../../core/services/mood-tracking.service';

interface MoodData {
  label: string;
  value: number;
  percent: number;
  color: string;
  icon: string;
  image?: string;
}

@Component({
  selector: 'mood-distribution',
  templateUrl: './mood-distribution.component.html',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodDistributionComponent {
  private analyticsService = inject(AnalyticsService);
  private moodService = inject(MoodStateService);
  private route = inject(ActivatedRoute);

  // View mode
  viewMode = signal<'donut' | 'chart' | 'table'>('donut');

  // Data
  moods = signal<MoodData[]>([]);
  loading = signal<boolean>(false);

  // Time range
  selectedTimeRange = signal<string>('Last Month');

  // Chart configuration
  // ...

  // Para las animaciones y el renderizado
  animationInProgress = signal(false);

  // Load mood definitions
  moodDefinitions = rxResource({
    loader: () => this.moodService.getMoods(),
  });

  // Analytics resource
  analyticsResource = rxResource({
    request: () => ({ months: this.getMonthsForRange() }),
    loader: ({ request }) =>
      this.analyticsService.getMoodAnalytics(request.months),
  });

  constructor() {
    // Sync query params to selectedTimeRange
    this.route.queryParams.subscribe((params) => {
      if (params['range']) {
        this.selectedTimeRange.set(params['range']);
      }
    });

    // Si hay datos en el recurso de analytics, usamos esos
    effect(() => {
      const analyticsData = this.analyticsResource.value();
      const moodDefs = this.moodDefinitions.value();

      if (analyticsData && moodDefs) {
        this.processAnalyticsData(analyticsData, moodDefs);
      } else if (!analyticsData && !this.analyticsResource.isLoading()) {
        // De lo contrario, cargamos datos de demostración si no hay datos reales y no está cargando
        // Pero mejor esperar a que carguen los moods definidos
        if (moodDefs) {
          this.loadDemoData(moodDefs);
        }
      }
    });
  }

  loadDemoData(moodDefs: Mood[]): void {
    // Simulamos una carga con animación
    this.animationInProgress.set(true);

    setTimeout(() => {
      const demoMoods: MoodData[] = moodDefs.slice(0, 5).map((m) => ({
        label: m.name['es'] || m.name['en'] || 'Unknown',
        value: Math.floor(Math.random() * 50) + 10,
        percent: 0, // Will calc below
        color: m.color,
        icon: 'mood', // Default icon, logic to pick specific one if needed
        image: m.image,
      }));

      const total = demoMoods.reduce((sum, m) => sum + m.value, 0);
      demoMoods.forEach(
        (m) => (m.percent = Number(((m.value / total) * 100).toFixed(1))),
      );
      demoMoods.sort((a, b) => b.percent - a.percent);

      this.moods.set(demoMoods);

      this.animationInProgress.set(false);
    }, 800);
  }

  processAnalyticsData(data: MoodAnalyticsResponse, moodDefs: Mood[]): void {
    const totalMoods = data.totalEntries || 0;
    const moodCounts = data.moodCounts || {};

    const processedMoods: MoodData[] = [];

    // Iterate over defined moods instead of hardcoded list
    moodDefs.forEach((moodDef) => {
      // Try to match by ID first, then by name (legacy)
      const possibleKeys = [
        moodDef.id,
        moodDef.name['en'],
        moodDef.name['es'],
      ].filter((k) => !!k);

      let value = 0;

      Object.keys(moodCounts).forEach((key) => {
        if (
          possibleKeys.includes(key) ||
          key === moodDef.name['en'] ||
          key === moodDef.name['es']
        ) {
          value += moodCounts[key] || 0;
        }
      });

      if (value > 0 || moodDef.isActive) {
        const percent =
          totalMoods > 0 ? Number(((value / totalMoods) * 100).toFixed(1)) : 0;
        processedMoods.push({
          label: moodDef.name['es'] || moodDef.name['en'] || 'Unknown',
          value: value,
          percent: percent,
          color: moodDef.color,
          icon: 'mood', // Use a default or map if possible. The template handles images now?
          image: moodDef.image,
        });
      }
    });

    // Ordenamos por porcentaje de mayor a menor
    processedMoods.sort((a, b) => b.percent - a.percent);

    this.moods.set(processedMoods);
  }

  toggleView(mode: 'chart' | 'table' | 'donut'): void {
    if (this.viewMode() !== mode) {
      this.animationInProgress.set(true);
      this.viewMode.set(mode);

      // Simulamos el tiempo de la animación
      setTimeout(() => {
        this.animationInProgress.set(false);
      }, 300);
    }
  }

  // Método para obtener el total de entradas
  getTotalEntries(): number {
    return this.moods().reduce((sum, mood) => sum + mood.value, 0);
  }

  // Método para evaluar el balance de estado de ánimo
  getMoodBalance(): number {
    const happy = this.moods().find((m) => m.label === 'Happy')?.percent || 0;
    const sad = this.moods().find((m) => m.label === 'Sad')?.percent || 0;
    const anxious =
      this.moods().find((m) => m.label === 'Anxious')?.percent || 0;

    return happy - (sad + anxious);
  }

  // Método para acceder a un mood por índice con seguridad
  getMoodAtIndex(index: number): MoodData | undefined {
    if (index < 0 || index >= this.moods().length) {
      return undefined;
    }
    return this.moods()[index];
  }

  // Para gráfico circular: Devuelve el ángulo CENTRO del sector para posicionar etiquetas
  getAngleForLabel(index: number): number {
    const data = this.moods();
    let totalPreceding = 0;
    for (let i = 0; i < index; i++) {
      totalPreceding += data[i].percent;
    }
    // Angle should be center of the slice: preceding + half of current
    return (totalPreceding + data[index].percent / 2) * 3.6;
  }

  // Para gráfico circular: Calcula la posición X para la etiqueta
  getLabelX(index: number): number {
    const mood = this.moods()[index];
    if (!mood) return 100;

    // SVG rotation usually starts at 3 o'clock (0 deg).
    // If we rotate the chart -90deg (start at 12 o'clock), we need to adjust.
    // Let's assume the chart starts at 12 o'clock.
    // 0 deg = 12 o'clock. 90 deg = 3 o'clock.
    // Math.cos/sin take radians where 0 is 3 o'clock.
    // So 12 o'clock is -90 deg (-PI/2).

    const angleDeg = this.getAngleForLabel(index);
    const angleRad = (angleDeg - 90) * (Math.PI / 180);

    // Radius should be centered in the slice.
    // For Donut: r=90 (outer), inner=72. Center ~81. But icons are outside or inside?
    // User said donut is fine.
    // For Pie: r=50 (center of stroke), stroke=100 (covers 0-100). Center is 50.
    // If we use same method for both, we need dynamic radius.
    // But viewMode is available.

    const radius = this.viewMode() === 'donut' ? 70 : 50;
    return 100 + radius * Math.cos(angleRad);
  }

  // Para gráfico circular: Calcula la posición Y para la etiqueta
  getLabelY(index: number): number {
    const mood = this.moods()[index];
    if (!mood) return 100;

    const angleDeg = this.getAngleForLabel(index);
    const angleRad = (angleDeg - 90) * (Math.PI / 180);

    const radius = this.viewMode() === 'donut' ? 70 : 50;
    return 100 + radius * Math.sin(angleRad);
  }

  // Para gráfico de donut: Calcula la circunferencia total
  getCircumference(): number {
    return 2 * Math.PI * 90; // Radio 90
  }

  // Para gráfico de donut: Calcula el offset de inicio para cada segmento
  getStrokeDashoffset(index: number): number {
    const circumference = this.getCircumference();
    let offset = 0;

    for (let i = 0; i < index; i++) {
      offset += (this.moods()[i].percent / 100) * circumference;
    }

    // Offset must be negative to shift the start point clockwise (or counter-clockwise depending on implementation)
    // Usually for "stacking" segments visually, we want the next segment to start where the previous ended.
    // With dasharray "length gap", dashoffset shifts the pattern.
    // A negative offset -L shifts the pattern so it starts L units later.
    return -offset;
  }

  // Para gráfico de donut: Calcula el largo de cada segmento
  getStrokeDasharray(mood: MoodData): string {
    const circumference = this.getCircumference();
    const strokeLength = (mood.percent / 100) * circumference;
    // Ensure there is a gap if needed, or just full circumference for the gap part
    return `${strokeLength} ${circumference}`;
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
        return 3;
    }
  }

  // Helper for Pie Chart (r=50)
  private getPieCircumference(): number {
    return 2 * Math.PI * 50;
  }

  getPieStrokeDasharray(mood: MoodData): string {
    const c = this.getPieCircumference();
    const length = (mood.percent / 100) * c;
    return `${length} ${c}`;
  }

  getPieStrokeDashoffset(index: number): number {
    const c = this.getPieCircumference();
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (this.moods()[i].percent / 100) * c;
    }
    return -offset;
  }
}
