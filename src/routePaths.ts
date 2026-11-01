import type { SectionId } from './clubs/types';

/**
 * Every page address that has a built tool behind it, with the section it belongs to. This is only a list of strings, so it
 * stays in the main bundle; the pages themselves load on demand (see routes.tsx). A unit test checks that every item in the
 * section registry that has an address appears here.
 */
export const toolPaths: Record<string, SectionId> = {
  '/leadership/preparing': 'leadership',
  '/leadership/responsibilities': 'leadership',
  '/leadership/group': 'leadership',
  '/leadership/checklist': 'leadership',
  '/leadership/equipment': 'leadership',
  '/leadership/sheets': 'leadership',
  '/leadership/risk': 'leadership',
  '/leadership/review': 'leadership',
  '/trip-planning/day': 'trip-planning',
  '/trip-planning/multi-day': 'trip-planning',
  '/trip-planning/camping': 'trip-planning',
  '/training/guidance': 'training',
  '/training/plan': 'training',
  '/training/checklists': 'training',
  '/training/checklists/fsrt': 'training',
  '/training/checklists/leader-rescue': 'training',
  '/training/checklists/leader-background': 'training',
  '/training/qualifications': 'training',
  '/navigation/reference': 'navigation',
  '/navigation/tools': 'navigation',
  '/navigation/oileain': 'navigation',
  '/navigation/tides': 'navigation',
  '/navigation/weather': 'navigation',
  '/vhf/stations': 'vhf',
  '/knowledge/search': 'knowledge',
  '/knowledge/documents': 'knowledge',
};

/** Addresses handled outside the section tools (see App.tsx). */
export const fixedPaths = ['/', '/emergency', '/sources', '/my-plans'];
