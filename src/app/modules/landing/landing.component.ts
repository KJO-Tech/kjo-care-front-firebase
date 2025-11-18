import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { ThemeControllerComponent } from '../../shared/components/layout/theme-controller/theme-controller.component';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  imports: [ThemeControllerComponent, NgClass, RouterLink],
})
export default class LandingComponent implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;
  private cardInterval: any;

  activeIndex = signal(0);

  ngAfterViewInit() {
    this.initAnimations();
    this.startCardCarousel();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    clearInterval(this.cardInterval);
  }

  private initAnimations() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    const elements =
      this.elementRef.nativeElement.querySelectorAll('.animate-on-scroll');
    elements.forEach((el: Element) => this.observer?.observe(el));
  }

  private startCardCarousel() {
    this.cardInterval = setInterval(() => {
      this.activeIndex.update(
        (current) => (current + 1) % this.heroCards.length,
      );
    }, 3000);
  }

  getCardStatus(index: number): 'is-active' | 'is-next' | 'is-previous' | '' {
    const active = this.activeIndex();
    const total = this.heroCards.length;

    if (index === active) {
      return 'is-active';
    }

    const nextIndex = (active + 1) % total;
    if (index === nextIndex) {
      return 'is-next';
    }

    const prevIndex = (active - 1 + total) % total;
    if (index === prevIndex) {
      return 'is-previous';
    }

    return '';
  }


  heroCards = [
    { icon: '🧠', text: 'Entiéndete' },
    { icon: '💪', text: 'Fortalécete' },
    { icon: '🌟', text: 'Brilla' },
  ];

  features = [
    {
      icon: 'cognition_2',
      title: 'Diario de Ánimo',
      description: 'Registra tus emociones y descubre patrones en tu bienestar',
      color: 'from-primary via-primary/70 to-secondary',
      image: '🧠',
    },
    {
      icon: 'bolt',
      title: 'Ejercicios Guiados',
      description: 'Meditación, respiración y movimiento personalizado',
      color: 'from-secondary via-secondary/70 to-accent',
      image: '⚡',
    },
    {
      icon: 'diversity_3',
      title: 'Comunidad Segura',
      description: 'Conecta con otros jóvenes y comparte experiencias',
      color: 'from-accent via-accent/70 to-primary',
      image: '🤝',
    },
    {
      icon: 'draft_orders',
      title: 'Blog Interactivo',
      description: 'Artículos, videos y contenido exclusivo para ti',
      color: 'from-primary via-accent/60 to-secondary',
      image: '📝',
    },
  ];

  benefits = [
    { icon: '🧘', title: 'Personalizado', desc: 'Tu ritmo, tu forma' },
    { icon: '🤝', title: 'Comunidad', desc: 'No estás solo' },
    { icon: '🛡️', title: 'Privado', desc: 'Tu seguridad primero' },
    { icon: '📊', title: 'Seguimiento', desc: 'Ve tu progreso' },
    { icon: '⚡', title: 'Accesible', desc: 'Siempre disponible' },
    { icon: '🎯', title: 'Científico', desc: 'Basado en evidencia' },
  ];

  testimonials = [
    {
      name: 'Sofia M.',
      text: 'Cambió mi manera de entender mis emociones. Ahora tengo herramientas reales.',
      avatar: '✨',
    },
    {
      name: 'Lucas R.',
      text: 'Los ejercicios me ayudan a mantener el estrés bajo control cada día.',
      avatar: '💪',
    },
    {
      name: 'Emma G.',
      text: 'La comunidad es increíble. Siento que realmente me entienden. ¡Gracias!',
      avatar: '❤️',
    },
  ];

  comingSoon = [
    {
      icon: 'mode_heat',
      title: 'Análisis Avanzado',
      desc: 'IA que entiende tus patrones',
    },
    {
      icon: 'shield',
      title: 'Conexión con Psicólogos',
      desc: 'Apoyo profesional cuando lo necesites',
    },
    {
      icon: 'auto_awesome',
      title: 'Retos de Bienestar',
      desc: 'Desafíos divertidos con recompensas',
    },
  ];
}
