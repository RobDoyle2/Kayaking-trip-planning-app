import { isBooleanRecord, isStringOrBooleanRecord } from './guards';
import { readSaved, removeSaved, writeSaved, type KeyValueStore, type Saved } from './storage';
import { isRiskAssessment } from '../content/leadership/risk';
import { isReview } from '../content/leadership/review';

/**
 * Everything the app can save on the user's device, in one list. The My plans page, the export file and the import
 * check all work from this list, so nothing can be saved that the user cannot see, export or delete.
 */
export interface SavedItemDef {
  id: string;
  label: string;
  href: string;
  version: number;
  isValid: (data: unknown) => boolean;
}

export const savedItemDefs: SavedItemDef[] = [
  { id: 'leader-checklist', label: 'Leader preparation checklist', href: '/leadership/checklist', version: 1, isValid: isBooleanRecord },
  { id: 'equipment-checklist', label: 'Equipment and safety check', href: '/leadership/equipment', version: 1, isValid: isBooleanRecord },
  { id: 'sheets-briefing', label: 'SHEETS briefing', href: '/leadership/sheets', version: 1, isValid: isStringOrBooleanRecord },
  { id: 'risk-assessment', label: 'Risk assessment', href: '/leadership/risk', version: 1, isValid: isRiskAssessment },
  { id: 'post-trip-review', label: 'Post-trip review', href: '/leadership/review', version: 1, isValid: isReview },
];

export function defById(id: string): SavedItemDef | undefined {
  return savedItemDefs.find((d) => d.id === id);
}

export function storageKey(slug: string, id: string): string {
  return `skh:${slug}:${id}`;
}

export interface SavedSummary {
  id: string;
  label: string;
  href: string;
  status: 'saved' | 'empty' | 'unreadable' | 'unavailable';
  savedAt?: string;
}

export function listSaved(store: KeyValueStore | null, slug: string, defs: SavedItemDef[] = savedItemDefs): SavedSummary[] {
  return defs.map((def) => {
    const result = readSaved(store, storageKey(slug, def.id), def.version, (d): d is unknown => def.isValid(d));
    const base = { id: def.id, label: def.label, href: def.href };
    switch (result.status) {
      case 'ok':
        return { ...base, status: 'saved' as const, savedAt: result.saved.savedAt };
      case 'empty':
        return { ...base, status: 'empty' as const };
      case 'unavailable':
        return { ...base, status: 'unavailable' as const };
      default:
        return { ...base, status: 'unreadable' as const };
    }
  });
}

export function deleteSaved(store: KeyValueStore | null, slug: string, id: string): boolean {
  return removeSaved(store, storageKey(slug, id));
}

export function deleteAllSaved(store: KeyValueStore | null, slug: string, defs: SavedItemDef[] = savedItemDefs): number {
  let n = 0;
  for (const def of defs) if (deleteSaved(store, slug, def.id)) n++;
  return n;
}

export interface ExportFile {
  app: 'sea-kayaking-hub';
  club: string;
  exportedAt: string;
  items: Record<string, Saved<unknown>>;
}

/** Everything saved, as one JSON file the user can keep or move to another device. */
export function exportAll(
  store: KeyValueStore | null,
  slug: string,
  defs: SavedItemDef[] = savedItemDefs,
  now: () => Date = () => new Date(),
): { json: string; count: number } {
  const items: Record<string, Saved<unknown>> = {};
  for (const def of defs) {
    const result = readSaved(store, storageKey(slug, def.id), def.version, (d): d is unknown => def.isValid(d));
    if (result.status === 'ok') items[def.id] = result.saved;
  }
  const file: ExportFile = { app: 'sea-kayaking-hub', club: slug, exportedAt: now().toISOString(), items };
  return { json: JSON.stringify(file, null, 2), count: Object.keys(items).length };
}

export const MAX_IMPORT_BYTES = 1_000_000;

export type ParseResult = { ok: true; items: { def: SavedItemDef; saved: Saved<unknown> }[] } | { ok: false; message: string };

/** Checks an import file completely before anything is written. Anything unexpected rejects the whole file. */
export function parseImport(text: string, slug: string, defs: SavedItemDef[] = savedItemDefs): ParseResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, message: 'That file is too large to be one of this app’s exports.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: 'That file is not a valid export. It could not be read as JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ok: false, message: 'That file is not an export from this app.' };
  const file = parsed as Record<string, unknown>;
  if (file.app !== 'sea-kayaking-hub') return { ok: false, message: 'That file is not an export from the Sea Kayaking Hub.' };
  if (file.club !== slug) return { ok: false, message: 'That file was exported for a different club, so it was not imported.' };
  const items = file.items;
  if (typeof items !== 'object' || items === null || Array.isArray(items)) return { ok: false, message: 'That file has no saved items in it.' };
  const found: { def: SavedItemDef; saved: Saved<unknown> }[] = [];
  for (const [id, value] of Object.entries(items as Record<string, unknown>)) {
    const def = defs.find((d) => d.id === id);
    if (!def) return { ok: false, message: `The file contains an item this app does not know ("${id.slice(0, 40)}"), so nothing was imported.` };
    if (typeof value !== 'object' || value === null) return { ok: false, message: `"${def.label}" in the file is damaged, so nothing was imported.` };
    const saved = value as Record<string, unknown>;
    if (typeof saved.v !== 'number' || saved.v > def.version || typeof saved.savedAt !== 'string' || !def.isValid(saved.data)) {
      return { ok: false, message: `"${def.label}" in the file is damaged or from a newer version of the app, so nothing was imported.` };
    }
    found.push({ def, saved: { v: saved.v, savedAt: saved.savedAt, data: saved.data } });
  }
  if (found.length === 0) return { ok: false, message: 'That file has no saved items in it.' };
  return { ok: true, items: found };
}

export function applyImport(store: KeyValueStore | null, slug: string, items: { def: SavedItemDef; saved: Saved<unknown> }[]): { written: number; failed: number } {
  let written = 0;
  let failed = 0;
  for (const { def, saved } of items) {
    const result = writeSaved(store, storageKey(slug, def.id), def.version, saved.data, () => new Date(saved.savedAt));
    if (result.ok) written++;
    else failed++;
  }
  return { written, failed };
}
