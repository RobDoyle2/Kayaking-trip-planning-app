import type { Guide } from '../leadership/guides';

/** The Beaufort scale: force, wind speed in knots and name. (The slides add a column on the effect on paddlers; that is the author's own, so it is not copied.) */
export const beaufort: { force: number; knots: string; name: string }[] = [
  { force: 0, knots: '0 to 1', name: 'Calm' },
  { force: 1, knots: '1 to 3', name: 'Light air' },
  { force: 2, knots: '4 to 6', name: 'Light breeze' },
  { force: 3, knots: '7 to 10', name: 'Gentle breeze' },
  { force: 4, knots: '11 to 16', name: 'Moderate breeze' },
  { force: 5, knots: '17 to 21', name: 'Fresh breeze' },
  { force: 6, knots: '22 to 27', name: 'Strong breeze' },
  { force: 7, knots: '28 to 33', name: 'Near gale' },
  { force: 8, knots: '34 to 40', name: 'Gale' },
  { force: 9, knots: '41 to 47', name: 'Severe gale' },
  { force: 10, knots: '48 to 55', name: 'Storm' },
  { force: 11, knots: '56 to 63', name: 'Violent storm' },
  { force: 12, knots: '64 to 71', name: 'Hurricane' },
];

/** Force 4 is the wind limit in the Sea Kayak Leader award (BCAB guidance, page 3). Information only. */
export const awardWindLimitForce = 4;

export const weatherGuide: Guide = {
  id: 'weather-guide',
  title: 'Weather information',
  intro: 'What the navigation course says about wind, weather systems and forecasts. This app does not fetch weather, so check a current forecast before every trip.',
  caution:
    'This is background reading from a training course. It is not a forecast and does not replace one. It has not been approved by the ECSKC committee.',
  sections: [
    {
      heading: 'Wind',
      paragraphs: [
        'Wind direction is the direction it comes from, and its strength is given as a Beaufort force. How far the wind has blown without interruption is its fetch.',
        'An offshore wind hides its danger from the shore, and it gets steadily worse as you paddle out. With an onshore wind, what you see is what you get. Headlands and cliffs change the strength of the wind locally.',
        'Wind against the tide steepens the sea. Wind with the tide gives a smoother sea.',
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Depressions and fronts',
      paragraphs: [
        'A depression is born at the polar front, where cold polar air meets warm tropical air. In its classic stage it has a warm front, a cold front and a warm sector between them.',
        'The first signs ahead of the system are high cloud such as cirrus. Rain comes at the warm front, the warm sector brings low, thin cloud and drizzle, and heavy showers come at the cold front. After the cold front passes, the wind veers to the north-west.',
        'The course lists old warnings as well: a backing wind with a falling barometer means beware of gales and squalls.',
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Anticyclones',
      paragraphs: ['In an anticyclone the winds blow clockwise, the isobars are far apart and the winds are slack. The course calls it the time to plan the major offshore trip.'],
      sources: ['shearwater'],
    },
    {
      heading: 'What a forecast gives you',
      paragraphs: [
        'A sea area forecast gives the time, the area (so know your major headlands), wind direction and strength, visibility, barometric pressure, pressure tendency and a prognosis. A full shipping forecast also has gale warnings, a general synopsis and coastal station reports.',
        'The course lists twelve forecast sources: VHF radio, national and local radio, television, Marine Call, the internet, teletext, the Met Office, Navtex, weatherfax, the Coastguard, newspapers, and your own look at the sky and the barometer.',
      ],
      bullets: [
        'Speed of a system in a synopsis: slowly 0 to 15 knots; steadily 15 to 25; rather rapidly 25 to 35; rapidly 35 to 45; very rapidly 45 or more.',
        'Timing words: imminent means within 6 hours of issue; soon means 6 to 12 hours; later means 12 to 24 hours.',
        'Use more than one source for weather, tide and swell, and think about how current, wind and fetch combine.',
      ],
      sources: ['shearwater', 'bcab'],
    },
  ],
};

export interface LinkCardData {
  name: string;
  provider: string;
  gives: string;
  caution: string;
  url: string;
}

/** Where to get weather. Every one is a link to the provider: this app shows no live weather. */
export const weatherLinks: LinkCardData[] = [
  {
    name: 'Met Éireann',
    provider: 'Met Éireann, the Irish national meteorological service',
    gives: 'Forecasts, marine forecasts and weather warnings.',
    caution: 'Check its weather warnings as well as the forecast.',
    url: 'https://www.met.ie/',
  },
  {
    name: 'Windy',
    provider: 'Windy',
    gives: 'Animated wind and wave forecast maps, with buoy and station observations.',
    caution: 'Which layers and buoys it shows, and whether it shows swell, was not checked. Windy limits embedding, so this is a link only.',
    url: 'https://www.windy.com/',
  },
  {
    name: 'Tide-Forecast.com sea conditions, Dublin',
    provider: 'Tide-Forecast.com',
    gives: 'Wave height, swell direction and period, and tide times for Dublin.',
    caution: 'Its terms were not reviewed, so no values are copied here.',
    url: 'https://www.tide-forecast.com/locations/Dublin-Ireland/forecasts/latest',
  },
];
