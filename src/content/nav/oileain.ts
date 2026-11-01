/**
 * The Oileáin region index. The standard port for each coast was counted from the "hours before or after [port] high water"
 * mentions in the supplied PDF (332 pages, edition not stated). The guide's own text and tide tables are not reproduced.
 */
export interface OileainRegion {
  coast: string;
  port: string;
  note?: string;
}

export const oileainRegions: OileainRegion[] = [
  { coast: 'North East, as far as Carlingford', port: 'Belfast' },
  { coast: 'East Coast', port: 'Dublin' },
  { coast: 'South Coast, West Cork and most of Kerry', port: 'Cobh' },
  { coast: 'Clare, Galway, Mayo and Donegal', port: 'Galway' },
  { coast: 'North Donegal', port: 'Galway and Belfast', note: 'Both appear in the PDF here, so check which the entry names.' },
];

export const oileainLinks = {
  site: { label: 'oileain.org', url: 'https://www.oileain.org/' },
  club: { label: 'East Coast Sea Kayaking Club', url: 'https://ecskc.eu/' },
};
