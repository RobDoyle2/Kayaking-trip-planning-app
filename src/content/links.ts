import { isRecord } from '../lib/guards';

/**
 * "My links": web addresses a member wants close to hand, each with a note of their own and a category.
 * Saved in this browser only (see savedItems.ts), exactly like trip plans. The app never visits the address.
 */

export type LinkCategory = 'trip-planning' | 'leadership' | 'training' | 'other';

export const linkCategories: { id: LinkCategory; label: string }[] = [
  { id: 'trip-planning', label: 'Trip Planning' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'training', label: 'Training and Skills' },
  { id: 'other', label: 'Other' },
];

export function categoryLabel(id: LinkCategory): string {
  return linkCategories.find((c) => c.id === id)?.label ?? 'Other';
}

export function isLinkCategory(x: unknown): x is LinkCategory {
  return typeof x === 'string' && linkCategories.some((c) => c.id === x);
}

export interface LinkEntry {
  id: string;
  /** A full web address starting with http:// or https://, as the browser writes it. */
  url: string;
  /** The member's own words. May be empty; the page then shows the website name instead. */
  description: string;
  category: LinkCategory;
  addedAt: string;
}

export const MAX_LINKS = 200;
export const MAX_URL_LENGTH = 2000;
export const MAX_DESCRIPTION_LENGTH = 300;

export function newLinkId(random: () => number = Math.random, now: Date = new Date()): string {
  return `l${now.getTime().toString(36)}${Math.floor(random() * 36 ** 3).toString(36).padStart(3, '0')}`;
}

/** Schemes that are never saved, so an address can never run code or open a local file. Anything else must be http or https. */
const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|blob|about|chrome|mailto|tel|sms|ftp|ws|wss):/i;

/**
 * True for a web address that is safe to put in a link: http or https, a real-looking host name, no user name or password,
 * and not too long. Used on what the member types and again on anything imported from a file.
 */
export function isSafeWebUrl(text: string): boolean {
  if (text.length === 0 || text.length > MAX_URL_LENGTH || /\s/.test(text)) return false;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username !== '' || parsed.password !== '') return false;
  return parsed.hostname.includes('.') && !parsed.hostname.startsWith('.') && !parsed.hostname.endsWith('.');
}

export type UrlResult = { ok: true; url: string } | { ok: false; message: string };

/** Turns what the member typed into a saved address, adding https:// when they left it off. */
export function normaliseUrl(input: string): UrlResult {
  const text = input.trim();
  if (text === '') return { ok: false, message: 'Type or paste the web address.' };
  if (/\s/.test(text)) return { ok: false, message: 'A web address has no spaces in it. Check what you pasted.' };
  if (BLOCKED_SCHEME.test(text)) return { ok: false, message: 'Only web addresses that start with http or https can be saved.' };
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text.replace(/^\/\//, '')}`;
  if (withScheme.length > MAX_URL_LENGTH) return { ok: false, message: `That address is longer than ${MAX_URL_LENGTH} characters.` };
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, message: 'That does not look like a web address. An example is www.canoe.ie.' };
  }
  if (parsed.username !== '' || parsed.password !== '') return { ok: false, message: 'Addresses with a user name or password in them are not saved.' };
  if (!isSafeWebUrl(parsed.href)) return { ok: false, message: 'That does not look like a web address. An example is www.canoe.ie.' };
  return { ok: true, url: parsed.href };
}

/** The site name to show under a link: the host without a leading www. */
export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** What to show as the link text: the member's note if there is one, otherwise the site name. */
export function linkLabel(link: Pick<LinkEntry, 'url' | 'description'>): string {
  return link.description.trim() !== '' ? link.description.trim() : siteName(link.url);
}

export function isLinkEntry(x: unknown): x is LinkEntry {
  if (!isRecord(x)) return false;
  return (
    typeof x.id === 'string' &&
    /^l[a-z0-9]{3,24}$/.test(x.id) &&
    typeof x.url === 'string' &&
    isSafeWebUrl(x.url) &&
    typeof x.description === 'string' &&
    x.description.length <= MAX_DESCRIPTION_LENGTH &&
    isLinkCategory(x.category) &&
    typeof x.addedAt === 'string' &&
    x.addedAt.length <= 40
  );
}

export function isLinkList(x: unknown): x is LinkEntry[] {
  if (!Array.isArray(x) || x.length > MAX_LINKS) return false;
  if (!x.every(isLinkEntry)) return false;
  return new Set(x.map((l) => l.id)).size === x.length;
}

/** Import merge: links with the same id are replaced by the imported one, the rest are kept. Null if that would be too many. */
export function mergeLinkLists(existing: unknown, incoming: unknown): LinkEntry[] | null {
  if (!isLinkList(incoming)) return null;
  const base = isLinkList(existing) ? existing : [];
  const incomingIds = new Set(incoming.map((l) => l.id));
  const merged = [...base.filter((l) => !incomingIds.has(l.id)), ...incoming];
  return merged.length > MAX_LINKS ? null : merged;
}

export function linksIn(list: LinkEntry[], category: LinkCategory): LinkEntry[] {
  return list.filter((l) => l.category === category).sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}
