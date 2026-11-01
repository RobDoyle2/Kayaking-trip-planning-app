import type { Guide } from '../leadership/guides';
import type { LinkCardData } from './weather';

export const tidesGuide: Guide = {
  id: 'tides-guide',
  title: 'Tidal information',
  intro: 'How to read tide information, and where to get predictions. This app does not show live tides, so every figure you use comes from a source you check.',
  caution:
    'Tide times and streams are predictions, and wind, pressure and swell can shift real timings and heights. This page is background reading and has not been approved by the ECSKC committee.',
  sections: [
    {
      heading: 'Springs and neaps',
      paragraphs: [
        'Springs come with the new and full moon: higher highs, lower lows and a large range. They expose areas that are not usually visible, flood others, and make tide races and overfalls stronger.',
        'Neaps come at the first and last quarter: lower highs, higher lows and less water moving. The course calls them better for expeditions and for tackling complicated tidal areas, and the best time to plan a big crossing.',
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Reading a tide table',
      paragraphs: [
        'A table gives the times and heights of high and low water, and the range between them. Check which time the table uses: many tables give universal time (UT), and in summer you add one hour for British Summer Time.',
        'Heights are measured from a datum, and datums differ between sources. Charted depths use chart datum, so check the datum before comparing a tide height with a charted depth.',
      ],
      links: [{ to: '/navigation/tools', label: 'Calculators: add one hour for BST, rule of twelfths' }],
      sources: ['shearwater'],
    },
    {
      heading: 'Streams, slack water and the rules of thirds and twelfths',
      paragraphs: [
        'A tidal stream atlas shows the direction and rate of the stream for each hour before or after high water at a named port. Short, thin arrows are weak streams and thick, long arrows are strong ones. Slack water is the short time between flood and ebb when no stream runs, and the course says to plan to be at the crux of a trip at slack water.',
        'The rule of thirds estimates how fast the stream runs in each hour, and the rule of twelfths estimates how far the tide has risen or fallen. Both are in the calculators, each with its assumptions.',
      ],
      links: [{ to: '/navigation/tools', label: 'Calculators' }],
      sources: ['shearwater'],
    },
    {
      heading: 'Races, overfalls and eddies',
      paragraphs: [
        'A tide race forms where a stream is squeezed through a constriction and speeds up. A headland jutting into a fast stream makes the water accelerate off its end, which can also make a race. Where a race runs over an uneven bed, the sea turns steep, close and breaking: that is an overfall. Eddies form in the lee of headlands.',
        'The Sea Kayak Leader award’s limits include no tide race or overfalls, and a stream of up to 2 knots. These are the award’s figures, not club rules.',
      ],
      links: [{ to: '/leadership/risk', label: 'Risk assessment' }],
      sources: ['shearwater', 'bcab'],
    },
  ],
};

/** Where to get tide predictions. Every one is a link to the provider: this app shows no live tides. */
export const tideLinks: LinkCardData[] = [
  {
    name: 'Marine Institute tide predictions',
    provider: 'Marine Institute (Ireland), open data under CC BY 4.0',
    gives: 'Predicted water level at stations including Dublin Port, Howth, Skerries and Arklow, up to the end of the dataset.',
    caution:
      'Heights are above local Lowest Astronomical Tide, which is close to chart datum. A related high-and-low summary dataset names its height column differently, so check the datum before mixing the two.',
    url: 'https://erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.html',
  },
  {
    name: 'Dublin Port Company tide tables',
    provider: 'Dublin Port Company',
    gives: 'Annual tide tables for Dublin North Wall, with time differences for nearby ports.',
    caution: 'Times in the tables are UT with a note on summer time. Read the notes in the booklet on datum and on times.',
    url: 'https://www.dublinport.ie/wp-content/uploads/2025/12/DP_Tide_Tables_Dublin_2026_v2.pdf',
  },
  {
    name: 'Tide-Forecast.com, Dublin',
    provider: 'Tide-Forecast.com',
    gives: 'Tide times and heights for Dublin for the next 30 days.',
    caution: 'Its heights are to Mean Lower Low Water, not chart datum, and its time-zone label has been inconsistent. Its terms were not reviewed, so no values are copied here.',
    url: 'https://www.tide-forecast.com/locations/Dublin-Ireland/tides/latest',
  },
  {
    name: 'East Coast Sea Kayaking Club website',
    provider: 'ECSKC',
    gives: 'The club’s own Trip Planning resources, including Dublin tide times and Oileáin extracts.',
    caution: 'Find them under Resources, then Trip Planning. The club’s pages were seen as search excerpts only.',
    url: 'https://ecskc.eu/',
  },
];

export const liveStatus = {
  heading: 'Why there are no live tides here yet',
  reasons: [
    'The security settings of this app stop it contacting other websites from your browser. That was a deliberate choice, and a live feed needs a small server function to be added and tested.',
    'The Marine Institute’s open prediction data looks suitable for the Dublin area, but its data was not downloaded or tested from here, and a tide figure on a safety app must not be shown unchecked.',
    'Where a datum or time zone is unclear, a live number could be wrong by a metre or an hour. Showing a link is safer than showing a number that might be misread.',
  ],
};
