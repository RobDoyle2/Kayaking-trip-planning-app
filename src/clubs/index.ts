import type { ClubConfig } from './types';
import ecskc from './ecskc/club.json';

/**
 * Registry of clubs bundled with this build.
 * To add a club: create src/clubs/<slug>/club.json, put its assets in public/clubs/<slug>/,
 * add one import and one line here, then build with CLUB=<slug>.
 */
const clubs: Record<string, ClubConfig> = {
  ecskc: ecskc as ClubConfig,
};

export function getClub(slug: string): ClubConfig {
  const found = clubs[slug];
  if (!found) {
    throw new Error(`Unknown club "${slug}". Add it to src/clubs/index.ts. Available: ${Object.keys(clubs).join(', ')}`);
  }
  return found;
}

// __CLUB_SLUG__ is injected by the build script; the fallback keeps unit tests working.
export const club: ClubConfig = getClub(typeof __CLUB_SLUG__ === 'string' ? __CLUB_SLUG__ : 'ecskc');
