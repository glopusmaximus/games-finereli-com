import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface GameEntry {
  slug: string;
  title: string;
  description: string;
  icon: string;
  component: LazyExoticComponent<ComponentType>;
}

export const games: GameEntry[] = [
  {
    slug: 'word-chain',
    title: 'Word Chain',
    description: 'Each word changes just one letter! See how long a chain you can build.',
    icon: '🔗',
    component: lazy(() => import('./word-chain/WordChain')),
  },
  {
    slug: 'clock-next',
    title: 'Read O\'Clock',
    description: 'Learn to read clocks and tell time! Collect stars along the way.',
    icon: '🕐',
    component: lazy(() => import('./clock-next/ClockNext')),
  },
];
