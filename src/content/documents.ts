/**
 * The reference documents supplied to this project. This is a list of what exists and what is known
 * about each, not the documents' text. Stage 6 turns the approved ones into the assistant's searchable library.
 * Nothing is "approved" until an ECSKC decision-maker says so; the status field records that honestly.
 */
export type ApprovalStatus = 'awaiting-approval' | 'approved';

export interface ReferenceDocument {
  id: string;
  title: string;
  publisher: string;
  version: string;
  approval: ApprovalStatus;
}

export const referenceDocuments: ReferenceDocument[] = [
  {
    id: 'shearwater-nav',
    title: 'Essential Coastal Navigation, Level 4: chartwork, tides, weather and pilotage (four slide decks)',
    publisher: 'Shearwater Sea Kayaking',
    version: 'Undated. Supplied as "Navigation (tks Seamus)"',
    approval: 'awaiting-approval',
  },
  {
    id: 'chart-5011',
    title: 'Chart 5011: Symbols and Abbreviations used on Admiralty Charts',
    publisher: 'UK Hydrographic Office',
    version: 'Edition 4, October 2008',
    approval: 'awaiting-approval',
  },
  {
    id: 'tides-symbols',
    title: 'Tides and currents chart symbols (section H)',
    publisher: 'NOAA and INT chart symbols sheet',
    version: 'Printed pages 38 to 41',
    approval: 'awaiting-approval',
  },
  {
    id: 'bcab-guidance',
    title: 'Sea Kayak Leader Assessment Guidance (Tidal and Non-Tidal)',
    publisher: 'British Canoeing Awarding Body',
    version: 'October 2021 edition as supplied. A March 2024 edition (V1-6) is online with the same environment limits.',
    approval: 'awaiting-approval',
  },
  {
    id: 'bcab-checklist',
    title: 'Sea Kayak Leader Skills Checklist',
    publisher: 'British Canoeing Awarding Body',
    version: 'October 2021 edition as supplied (V1-2 in the file name)',
    approval: 'awaiting-approval',
  },
  {
    id: 'fsrt',
    title: 'Foundation Safety and Rescue Training course notes',
    publisher: 'British Canoeing',
    version: 'V2-5, February 2019',
    approval: 'awaiting-approval',
  },
  {
    id: 'hqol',
    title: 'High Quality Outdoor Learning',
    publisher: 'English Outdoor Council',
    version: '2015',
    approval: 'awaiting-approval',
  },
  {
    id: 'oileain',
    title: 'Oileáin, guide to the Irish coast and islands (332-page PDF)',
    publisher: 'Not stated in the file. Oileáin is by David Walsh.',
    version: 'Edition not stated. The printed second edition has 292 pages, so this is a different text.',
    approval: 'awaiting-approval',
  },
  {
    id: 'trip-planner',
    title: 'Trip Planner form',
    publisher: 'Pesda Press',
    version: 'File dated 13 February 2022',
    approval: 'awaiting-approval',
  },
  {
    id: 'vhf-sheet',
    title: 'Irish Coast Guard VHF stations sheet (printed map with handwritten notes)',
    publisher: 'Club copy of a published map',
    version: 'Shows older working channels for 11 of its 16 stations',
    approval: 'awaiting-approval',
  },
];

export function approvalLabel(status: ApprovalStatus): string {
  return status === 'approved' ? 'Approved' : 'Awaiting ECSKC approval';
}
