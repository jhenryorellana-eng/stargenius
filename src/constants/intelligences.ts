import type { Intelligence } from '@/types';

export const INTELLIGENCES: Intelligence[] = [
  {
    code: 'mental',
    name: 'Mental',
    description: 'Lógica, análisis y pensamiento crítico',
    icon: 'psychology',
    color: '#a78bfa',
  },
  {
    code: 'emocional',
    name: 'Emocional',
    description: 'Inteligencia emocional y autoconocimiento',
    icon: 'favorite',
    color: '#dc79a8',
  },
  {
    code: 'social',
    name: 'Social',
    description: 'Habilidades interpersonales y liderazgo',
    icon: 'groups',
    color: '#60a5fa',
  },
  {
    code: 'financiera',
    name: 'Financiera',
    description: 'Educación financiera y negocios',
    icon: 'savings',
    color: '#34d399',
  },
  {
    code: 'creativa',
    name: 'Creativa',
    description: 'Innovación y pensamiento divergente',
    icon: 'palette',
    color: '#fbbf24',
  },
  {
    code: 'fisica',
    name: 'Física',
    description: 'Salud, energía y bienestar',
    icon: 'fitness_center',
    color: '#fb923c',
  },
  {
    code: 'espiritual',
    name: 'Espiritual',
    description: 'Propósito, valores y trascendencia',
    icon: 'spa',
    color: '#c084fc',
  },
];

export const getIntelligenceByCode = (code: string) =>
  INTELLIGENCES.find((i) => i.code === code);
