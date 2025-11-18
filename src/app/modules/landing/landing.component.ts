import { Component, effect, signal } from '@angular/core';
import { ThemeControllerComponent } from '../../shared/components/layout/theme-controller/theme-controller.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  imports: [ThemeControllerComponent, NgClass],
})
export default class LandingComponent {
  isVisible = signal(false);
  scrollY = signal(0);

  constructor() {
    // effect(() => {
    this.isVisible.set(true);
    // const handleScroll = () => this.scrollY.set(window.scrollY);
    // window.addEventListener('scroll', handleScroll);
    // return () => window.removeEventListener('scroll', handleScroll);
    // });
  }

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
