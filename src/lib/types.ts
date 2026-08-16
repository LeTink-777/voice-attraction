export type PlanId = 'basic' | 'full' | 'premium';

export interface Plan {
  id: PlanId;
  /** Название тарифа в терминах механики проекта. */
  name: string;
  price: number;
  oldPrice: number;
  /** Короткое описание того, что открывает тариф. */
  tagline: string;
  features: string[];
  featured?: boolean;
}

export interface SiteConfig {
  name: string;
  domain: string;
  url: string;
  accent: string;
  theme: 'dark' | 'light';
  pdfFont: 'PTSerif' | 'PTSans';
}

export type UserData = Record<string, string>;

export interface Section {
  title: string;
  content: string;
}

export const PLAN_LABELS: Record<PlanId, string> = {
  basic: 'Базовый',
  full: 'Полный',
  premium: 'Максимум',
};

export function normalizePlan(value: unknown): PlanId {
  return value === 'basic' || value === 'premium' ? value : 'full';
}
