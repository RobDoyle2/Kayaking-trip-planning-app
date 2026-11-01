import type { Guide } from '../leadership/guides';

/**
 * Navigation reference: a paraphrase of the Chartwork, Tides and Pilotage decks of the Shearwater navigation course.
 * Diagram-only content, slide figures that looked garbled, and the Chart 5011 key are not included. Nothing is added
 * from outside the sources except where a line says it is a standard definition.
 */
export const navReferenceGuide: Guide = {
  id: 'nav-reference',
  title: 'Navigation reference',
  intro: 'Chartwork, buoyage, tides and pilotage notes from the navigation course supplied to this project, in short.',
  caution:
    'This is background reading from a training course, paraphrased. It does not replace a course, a current chart or your own judgement, and the ECSKC committee has not approved it.',
  sections: [
    {
      heading: 'Position, distance and bearings',
      paragraphs: [
        'A position is given as latitude and longitude. One minute of latitude is one nautical mile (NM), and one nautical mile is ten cables. Measure distance on the latitude scale at the side of the chart.',
        'The course’s worked example: from the Martello Tower on Ireland’s Eye to the beacon at the entrance to Howth Harbour is 8.5 cables, which is 0.85 NM.',
        'Variation is the angle between true north and magnetic north, and the chart’s compass rose shows it. In the course’s worked example a true bearing of 174° becomes a magnetic bearing of 180° with 6° added, because the variation there is westerly.',
      ],
      links: [{ to: '/navigation/tools', label: 'Calculators: cables and nautical miles' }],
      sources: ['shearwater'],
    },
    {
      heading: 'Reading heights and depths',
      paragraphs: [
        'The charted height of a light or feature is measured above mean high water springs. Charted depths are measured below chart datum, and a drying height is measured above chart datum. The height of the tide is the sea surface above chart datum.',
        'The abbreviations the course lists are HW, LW, MHWS, MHWN, MLWS, MLWN, LAT, HAT and CD. As standard definitions: high water, low water, mean high and low water springs and neaps, lowest and highest astronomical tide, and chart datum.',
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Buoyage and lights',
      paragraphs: [
        'IALA buoyage has five types: lateral, cardinal, safe water, isolated danger and special.',
        'A light’s characteristics are written in short form. For example F is a fixed white light that is always on, and Fl 4s is a white light that flashes once every 4 seconds. The course lists fixed, flashing, occulting, isophase, quick flashing, group flashing and interrupted quick flashing.',
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Transits',
      paragraphs: ['A transit is two fixed objects in line. Keeping them in line keeps you on a course from A to B, and the course shows three states: nearing the transit, on it and past it.'],
      sources: ['shearwater'],
    },
    {
      heading: 'Tides and streams',
      paragraphs: [
        'The course covers springs and neaps, high water, low water and slack water, flooding and ebbing, the difference between a tidal stream and a current, races, rips, overfalls and clapotis, and where to find tidal information.',
        'Tidal diamonds on a chart are lettered magenta diamonds. Each points to a table that gives the direction and rate of the stream, at springs and at neaps, by hour before or after high water.',
        'Local guides give stream times in the same way. The course’s example from the Oileáin guide is Lambay: local high water is the same as at Dublin, and the stream floods northwards from 4 hours 30 minutes after Dublin high water until 1 hour 30 minutes before the next.',
      ],
      links: [
        { to: '/navigation/tides', label: 'Tidal information' },
        { to: '/navigation/oileain', label: 'Oileáin guidance' },
      ],
      sources: ['shearwater'],
    },
    {
      heading: 'Pilotage and dead reckoning',
      paragraphs: [
        'The course uses these short forms: CTP, course to paddle; CTS, course to steer; COG, course over ground; and EP, estimated position.',
        'The sideways drift in a stream is the stream speed divided by your paddling speed, multiplied by the distance you travel across it. As a quick allowance, the offset angle is the stream speed divided by paddling speed multiplied by 60° for a stream on the beam, and by 40° for one on the bow or quarter.',
        'To estimate a position offshore, take back bearings on identifiable features. To estimate the speed of a stream, divide the distance made good by the time to get speed over the ground, then subtract your own speed through the water.',
      ],
      links: [{ to: '/navigation/tools', label: 'Calculators: offset angle, stream speed' }],
      sources: ['shearwater'],
    },
    {
      heading: 'What is left out',
      paragraphs: [
        'The slide decks rely on diagrams that are not transcribed here: the frontal cross-section, tidal stream atlas pages, tidal diamond tables and the Skerries chart exercises. A few slide figures looked garbled, such as the table linking offset angle to stream speed and the horizon-distance formula, so they are not repeated here. The Chart 5011 symbols key is Crown copyright and is not reproduced.',
      ],
      sources: ['shearwater'],
    },
  ],
};
