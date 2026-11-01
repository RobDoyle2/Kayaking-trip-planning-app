/**
 * Irish Coast Guard VHF stations and channels, from Marine Notice No. 61 of 2020 (16 December 2020), read through the copy
 * published by afloat.ie. Every station also has channels 16 and 67 unless the row says otherwise; 67 is available when
 * required but may not be monitored at all times. This is a snapshot: later notices have not been checked.
 */
export interface VhfStation {
  name: string;
  /** Channels as the notice's poster lists them, in order. */
  channels: string[];
  /** DSC channel 70 listed on the poster. */
  dsc: boolean;
  /** The working channel before the December 2020 change, when it changed. */
  oldChannel?: string;
  note?: string;
}

export const vhfStations: VhfStation[] = [
  { name: 'Bantry', channels: ['16', '67', '05'], dsc: true, oldChannel: '23' },
  { name: 'Belmullet', channels: ['16', '67', '63'], dsc: true, oldChannel: '83' },
  { name: 'Carlingford', channels: ['16', '67', '04'], dsc: true },
  { name: 'Clew Bay', channels: ['16', '67', '05'], dsc: true },
  { name: 'Clifden', channels: ['16', '67', '03'], dsc: true, oldChannel: '26' },
  { name: 'Cork', channels: ['16', '67', '02'], dsc: true, oldChannel: '26' },
  { name: 'Donegal Bay', channels: ['16', '67', '02'], dsc: true },
  { name: 'Dublin', channels: ['16', '67', '03'], dsc: true, oldChannel: '83', note: 'Transmits from Howth.' },
  { name: 'Galley Head', channels: ['16'], dsc: false, note: 'Channel 16 only.' },
  { name: 'Galway', channels: ['16', '67', '04'], dsc: true },
  { name: 'Glen Head', channels: ['16', '67', '03'], dsc: true, oldChannel: '24' },
  { name: 'Lough Derg', channels: ['16', '61'], dsc: false, note: 'An inland lake.' },
  { name: 'Lough Ree', channels: ['16', '62'], dsc: false, note: 'An inland lake.' },
  { name: 'Malin Head', channels: ['16', '67', '05'], dsc: true, oldChannel: '23' },
  { name: 'Malin Head (local, Lough Swilly and Lough Foyle)', channels: ['16', '01'], dsc: false, oldChannel: '85', note: 'The notice lists the Scalp Mountain site, old channel 85, new channel 01. It does not say outright that this is the local station.' },
  { name: 'Mine Head', channels: ['16', '67', '03'], dsc: true, oldChannel: '83' },
  { name: 'Mizen Head', channels: ['16', '67', '04'], dsc: true },
  { name: 'Rosslare', channels: ['16', '67', '05'], dsc: true, oldChannel: '23' },
  { name: 'Shannon', channels: ['16', '67', '64'], dsc: true, oldChannel: '28' },
  { name: 'Valentia', channels: ['16', '67', '62'], dsc: true, oldChannel: '24' },
  { name: 'Wicklow Head', channels: ['16', '67', '02'], dsc: true },
];

export const vhfNotice = {
  number: 'Marine Notice No. 61 of 2020',
  date: '16 December 2020',
  gov: 'https://www.gov.ie/en/department-of-transport/collections/marine-notices-2020',
  reproduction: 'https://afloat.ie/safety/coastguard/item/48719-irish-coast-guard-confirms-recent-changes-to-vhf-working-channels',
};

/** The working channel is the last channel listed. */
export function workingChannel(s: VhfStation): string | null {
  return s.channels.length > 2 || (s.channels.length === 2 && s.channels[1] !== '67') ? (s.channels[s.channels.length - 1] ?? null) : null;
}
