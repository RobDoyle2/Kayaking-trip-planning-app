import type { Guide } from '../leadership/guides';

/**
 * Training guidance: how the Sea Kayak Leader checklist areas, the Foundation Safety and Rescue Training course and the
 * Canoeing Ireland awards fit together. Paraphrased from the named sources. Where the sources do not say how two schemes
 * compare, this page says so instead of guessing.
 */
export const trainingGuide: Guide = {
  id: 'training-guidance',
  title: 'Training guidance',
  intro: 'How the leader checklist, the safety and rescue course and the Canoeing Ireland awards fit together, and where to go next.',
  caution:
    'This guidance is drawn from published documents and has not been approved by the ECSKC committee. It does not replace a course or an instructor.',
  sections: [
    {
      heading: 'The four areas of the leader checklist',
      paragraphs: [
        'The Sea Kayak Leader Skills Checklist groups what a leader needs into four areas: A, participant-focused leadership; B, personal paddling; C, rescue; and D, background knowledge, which covers equipment, safety, weather, planning and navigation, access and environment, experience, and deployment matters.',
        'The assessment guidance describes the same four areas in more detail. The development plan and the personal checklists in this section follow them.',
      ],
      links: [
        { to: '/training/plan', label: 'Skills development plan' },
        { to: '/training/checklists', label: 'Personal checklists' },
      ],
      sources: ['bcab-checklist', 'bcab'],
    },
    {
      heading: 'How the ratings work',
      paragraphs: [
        'The leader checklist is a self-assessment sheet for shaping a development plan. You rate each line Strong, Competent or Develop.',
        'The Foundation Safety and Rescue Training course ends with its own competency checklist, completed by the provider and the participant together. It uses Strong, Competent and Needs developing.',
        'In this app the ratings are private to your device and nobody assesses them. Only a course provider or assessor can say you have met a standard.',
      ],
      sources: ['bcab-checklist', 'fsrt'],
    },
    {
      heading: 'The development plan page and reflective practice',
      paragraphs: [
        'The checklist’s development plan page has six boxes for notes and action points: participant-focused leadership; personal paddling; rescues and incident management; background knowledge and understanding; experience; and reflective practice.',
        'The checklist has a reflective practice box, but the assessment guidance does not describe reflection as an assessed area. So the app gives it a notes box and does not rate it.',
        'A guide to quality in outdoor learning, written for young people’s settings, treats reviewing and reflecting on an activity as a sign of good practice. The Post-trip review in the Leadership section is the place to do it after a trip.',
      ],
      links: [{ to: '/leadership/review', label: 'Post-trip review' }],
      sources: ['bcab-checklist', 'bcab', 'hqol'],
    },
    {
      heading: 'Foundation Safety and Rescue Training',
      paragraphs: [
        'The British Canoeing course notes describe a course in the key safety and rescue skills for looking after yourself and others. It is the base for safety and rescue in British Canoeing qualifications and is open to all craft types.',
      ],
      bullets: [
        'For boat-based participants the notes expect Paddle Explore, 2 Star or equivalent ability, and being able to swim in normal paddling clothing.',
        'A first-aid certificate is recommended, not required.',
        'The course runs at least 8 hours of teaching, with at most 6 participants to each provider.',
        'It ends with a skills competency checklist; the personal checklist in this section follows its lines.',
      ],
      links: [{ to: '/training/checklists/fsrt', label: 'Safety and rescue skills checklist' }],
      sources: ['fsrt'],
    },
    {
      heading: 'Canoeing Ireland awards',
      paragraphs: [
        'Canoeing Ireland runs the Sea Kayak Skills Awards at Levels 1 to 5. ECSKC asks every paddler on its trips to hold at least Level 2.',
        'The leader documents in this app are British Canoeing’s. The sources supplied do not say how Canoeing Ireland’s levels compare with British Canoeing awards, so this app makes no comparison. Ask the club or Canoeing Ireland.',
      ],
      links: [{ to: '/training/qualifications', label: 'Award pathway and links' }],
      sources: ['ci-awards', 'ecskc-safety'],
    },
    {
      heading: 'Check the editions',
      paragraphs: [
        'The leader guidance and checklist supplied are the October 2021 edition (the March 2024 edition gives the same limits), and the safety and rescue course notes are from February 2019. Check the current versions before relying on a requirement.',
      ],
      sources: ['bcab', 'bcab-checklist', 'fsrt'],
    },
  ],
};
