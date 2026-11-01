/**
 * Saving on the user's own device (browser localStorage), with honest failure reporting.
 * Nothing here talks to a server. Every saved value is wrapped with a format version and a save time,
 * so a later version of the app can recognise and upgrade old saves instead of misreading them.
 */

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The browser's storage, or null if it is blocked (private windows, strict settings) or unavailable. */
export function browserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    const probe = '__skh_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export interface Saved<T> {
  v: number;
  savedAt: string;
  data: T;
}

export type ReadResult<T> =
  | { status: 'empty' }
  | { status: 'ok'; saved: Saved<T> }
  | { status: 'corrupt' }
  | { status: 'newer' }
  | { status: 'unavailable' };

export function readSaved<T>(
  store: KeyValueStore | null,
  key: string,
  version: number,
  isValid: (data: unknown) => data is T,
): ReadResult<T> {
  if (!store) return { status: 'unavailable' };
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { status: 'corrupt' };
    const wrapper = parsed as Record<string, unknown>;
    if (typeof wrapper.v !== 'number' || typeof wrapper.savedAt !== 'string') return { status: 'corrupt' };
    if (wrapper.v > version) return { status: 'newer' };
    if (!isValid(wrapper.data)) return { status: 'corrupt' };
    return { status: 'ok', saved: { v: wrapper.v, savedAt: wrapper.savedAt, data: wrapper.data } };
  } catch {
    return { status: 'corrupt' };
  }
}

export type WriteResult = { ok: true; savedAt: string } | { ok: false; reason: 'unavailable' | 'full' | 'error' };

export function writeSaved<T>(
  store: KeyValueStore | null,
  key: string,
  version: number,
  data: T,
  now: () => Date = () => new Date(),
): WriteResult {
  if (!store) return { ok: false, reason: 'unavailable' };
  const savedAt = now().toISOString();
  try {
    store.setItem(key, JSON.stringify({ v: version, savedAt, data } satisfies Saved<T>));
    return { ok: true, savedAt };
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    return { ok: false, reason: name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' ? 'full' : 'error' };
  }
}

export function removeSaved(store: KeyValueStore | null, key: string): boolean {
  if (!store) return false;
  try {
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Plain-language message for a failed save, shown to the user. */
export function writeFailureMessage(reason: 'unavailable' | 'full' | 'error'): string {
  switch (reason) {
    case 'unavailable':
      return 'This browser is not letting the app save (private windows and some privacy settings block it). Your entries will be lost when you leave. Use Download to keep a copy.';
    case 'full':
      return 'This browser has no room left to save. Download a copy of your work, then clear some saved items on the My plans page.';
    case 'error':
      return 'The browser refused to save. Use Download to keep a copy.';
  }
}

/** Short time like "14:32" for status lines. */
export function clockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}
