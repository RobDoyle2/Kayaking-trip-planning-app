/**
 * Written guidance for the Leadership section. All text is paraphrased from the named sources (none is copied),
 * and each section names where it comes from. Anything the sources do not say is not here.
 */

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: { to: string; label: string }[];
  /** Keys into leadershipSources. */
  sources: string[];
}

export interface Guide {
  id: string;
  title: string;
  intro: string;
  /** A caution shown at the top of the page. */
  caution?: string;
  sections: GuideSection[];
}

export const preparingGuide: Guide = {
  id: 'preparing',
  title: 'Preparing to lead a trip',
  intro:
    'A trip goes through five steps: plan it, check the kit, brief the group, lead it, then review it. Each step has a tool in this section.',
  caution:
    'This guidance is drawn from published documents and has not been approved by the ECSKC committee. It does not replace training or your own judgement.',
  sections: [
    {
      heading: '1. Plan',
      paragraphs: [
        'Read about the area first: how long and hard the trip is and what has changed recently. Match it to your group’s experience, equipment and fitness. A group should be at least three paddlers.',
        'Check the forecast and water levels, and go only in favourable conditions. Look at more than one source for weather, tide and swell, and think about how current, wind and fetch combine.',
      ],
      links: [
        { to: '/leadership/checklist', label: 'Leader preparation checklist' },
        { to: '/leadership/risk', label: 'Risk assessment' },
      ],
      sources: ['ecskc-safety', 'bcab'],
    },
    {
      heading: '2. Check the kit',
      paragraphs: [
        'Everyone needs a buoyancy aid, a helmet and suitable clothing and footwear, and the group needs rescue and communication kit. The leader carries a VHF radio and at least two other ways of attracting attention.',
      ],
      links: [{ to: '/leadership/equipment', label: 'Equipment and safety check' }],
      sources: ['ecskc-safety', 'bcab'],
    },
    {
      heading: '3. Brief the group',
      paragraphs: [
        'Use the SHEETS briefing to cover safety and signals, the people in the group, equipment, the environment and timings, and then ask the group to say the key points back.',
      ],
      links: [{ to: '/leadership/sheets', label: 'SHEETS briefing' }],
      sources: ['sheets'],
    },
    {
      heading: '4. Lead',
      paragraphs: [
        'Keep an overview of the whole group so nobody is forgotten, and position yourself where you can cover safety while still giving people freedom. Know the emergency steps before you launch.',
      ],
      links: [
        { to: '/leadership/group', label: 'Group management' },
        { to: '/emergency', label: 'Emergency card' },
      ],
      sources: ['bcab', 'fsrt'],
    },
    {
      heading: '5. Review',
      paragraphs: ['Afterwards, look at what went well, what to change, and any incident or near miss, and rate yourself so you can plan what to develop next.'],
      links: [{ to: '/leadership/review', label: 'Post-trip review' }],
      sources: ['bcab-checklist', 'hqol'],
    },
    {
      heading: 'Limits used to assess Sea Kayak Leaders (information only)',
      paragraphs: [
        'British Canoeing assesses Sea Kayak Leaders for moderate conditions. These are the limits it uses. They are not ECSKC rules, and the club has not said whether it applies them to its trips.',
      ],
      bullets: [
        'Straightforward landing points no more than 2 nautical miles apart, and crossings no longer than 2 nautical miles (page 3).',
        'Tidal flow up to 2 knots, with no tide race or overfalls (page 3).',
        'Wind not above Beaufort force 4 (page 3).',
        'Surf up to 1 metre, trough to crest, for launching and landing (page 3).',
        'An assessed group of 3 to 6 paddlers (pages 3 and 4).',
      ],
      sources: ['bcab'],
    },
  ],
};

export const responsibilitiesGuide: Guide = {
  id: 'responsibilities',
  title: 'Leadership responsibilities',
  intro: 'What a Sea Kayak Leader is expected to do, as the British Canoeing assessment guidance describes it.',
  caution:
    'These are British Canoeing documents. A Canoeing Ireland leader equivalent has not been supplied, so check how ECSKC applies them.',
  sections: [
    {
      heading: 'The eight leadership areas',
      bullets: [
        'Judgement and decision making: plan ahead in slow time, and decide well under pressure in real time.',
        'Venue selection: choose places that suit the participants’ needs, from a repertoire that covers all the environments the award allows.',
        'Safety: assess risk soundly throughout, stay aware of hazards, pitch the trip to the group’s aims and level of challenge, position yourself to cover safety while allowing freedom, and use an effective way of communicating.',
        'Vision: be a positive role model with a passion for paddlesport.',
        'Support and challenge: create a positive atmosphere and help people choose suitable challenges.',
        'Leadership style: match it to the people, the task and the environment, empowering where you can and taking firmer control when safety needs it.',
        'Equipment: choose personal, group and safety kit that suits the trip, including craft choice and outfitting.',
        'Environmental impact: limit your impact on the environment, local communities and other water users.',
      ],
      sources: ['bcab', 'bcab-checklist'],
    },
    {
      heading: 'Deployment matters a leader should understand',
      bullets: [
        'First-aid training and keeping up to date with best practice.',
        'Safeguarding training and disclosure.',
        'Continuing professional development and equality.',
        'Medical declarations and working with injuries.',
        'Duty of care, a code of conduct and incident reporting.',
        'Injury prevention and manual handling.',
        'Insurance, and the organisation’s own risk assessment and operating procedures.',
      ],
      sources: ['bcab'],
    },
    {
      heading: 'Who carries the responsibility',
      paragraphs: [
        'Responsibility for safety management rests mainly with the leader, instructor or coach in charge. In good practice the group also takes part in risk management when planning, during the trip and in the debrief, because managing risk is itself a skill worth learning.',
      ],
      sources: ['hqol'],
    },
  ],
};

export const groupGuide: Guide = {
  id: 'group',
  title: 'Group management',
  intro: 'How to keep a group together and safe on the water.',
  caution: 'Drawn from published documents. It has not been approved by the ECSKC committee.',
  sections: [
    {
      heading: 'Group size',
      bullets: [
        'The club says not to paddle alone, and a group should have at least three paddlers (ECSKC Basic Safety).',
        'British Canoeing assesses leaders with a group of 3 to 6 (guidance, pages 3 and 4).',
      ],
      sources: ['ecskc-safety', 'bcab'],
    },
    {
      heading: 'CLAP: four prompts',
      paragraphs: [
        'The rescue course notes list four prompts for managing a group, and its sample programmes call them CLAP. An outside article expands the letters the same way.',
      ],
      bullets: [
        'Communication: keep it simple.',
        'Line of sight: stay where you can see the others.',
        'Avoidance: steer clear of hazards, which beats dealing with them.',
        'Position of maximum usefulness: be where you can help most.',
      ],
      sources: ['fsrt', 'clap'],
    },
    {
      heading: 'Safety and signals (from the SHEETS briefing)',
      bullets: [
        'Decide how tightly to control the group for today’s conditions and name a number two.',
        'Keep everyone in sight of each other.',
        'Teach signals for stop, left, right, come to me and OK.',
      ],
      links: [{ to: '/leadership/sheets', label: 'SHEETS briefing' }],
      sources: ['sheets'],
    },
    {
      heading: 'Position and control',
      bullets: [
        'Position yourself in the group so you cover safety while still allowing freedom.',
        'Match your leadership style to the people, the task and the environment.',
        'Keep an overview so nobody in the group is forgotten, including during a rescue.',
        'Judge the conditions and the group’s standard, and change the route plan when they do not match.',
        'Take extra care when moving a group through harder conditions.',
      ],
      sources: ['bcab'],
    },
    {
      heading: 'If someone swims',
      paragraphs: ['Use the rescue priority rules on the emergency card, and work from the lowest-risk option that will do the job.'],
      links: [{ to: '/emergency', label: 'Emergency card' }],
      sources: ['fsrt', 'bcab'],
    },
  ],
};
