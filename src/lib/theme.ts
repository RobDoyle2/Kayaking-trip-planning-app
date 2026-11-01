import type { ClubConfig } from '../clubs/types';

/** Writes the club's colours into CSS variables so one stylesheet serves every club. */
export function applyTheme(theme: ClubConfig['theme'], root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-dark', theme.primaryDark);
  root.style.setProperty('--tint', theme.tint);
  root.style.setProperty('--ink', theme.ink);
  root.style.setProperty('--danger', theme.danger);
}
