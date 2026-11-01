import type { ChecklistDef } from '../leadership/checklists';

/**
 * Personal development checklists. Each line is a short paraphrase of something a named source lists as a skill or an area of
 * knowledge. A tick means "I have practised this or I understand it": it is a private record, not an assessment, and it does
 * not mean anyone is qualified or ready to lead. Nothing here is advice the sources do not give.
 */

const RECORD =
  'Tick a line when you have practised it or understand it. This is your own record: it does not mean you are qualified, assessed or ready to lead.';

export const fsrtChecklist: ChecklistDef = {
  id: 'dev-fsrt',
  title: 'Safety and rescue skills (FSRT)',
  intro: `The lines of the Skills Competency Checklist at the end of the British Canoeing Foundation Safety and Rescue Training course. ${RECORD}`,
  groups: [
    {
      id: 'essential',
      title: 'Essential',
      items: [
        { id: 'f-base', text: 'Paddle Explore or 2 Star level skills in your boat (or safeguarding strategies, if you are bank-based).', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-swimmer', text: 'Rescue a swimmer.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-deep', text: 'Deep-water rescue in your chosen craft.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-unconscious', text: 'Rescue an unconscious or entrapped paddler.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-towlines', text: 'Use purpose-made towlines.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-self', text: 'Self-rescue in your chosen craft.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-allin', text: 'All-in rescue.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-problem', text: 'Problem-solving rescues.', source: 'fsrt', where: 'Skills Competency Checklist' },
      ],
    },
    {
      id: 'bank',
      title: 'Essential if you are bank-based, desirable if you are boat-based',
      items: [
        { id: 'f-coach', text: 'Coach a swimmer to shore.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-rigid', text: 'Rescue a swimmer with a rigid aid, such as a paddle.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-throw', text: 'Rescue a swimmer with a throwline.', source: 'fsrt', where: 'Skills Competency Checklist' },
      ],
    },
    {
      id: 'desirable',
      title: 'Desirable',
      items: [
        { id: 'f-aid', text: 'First aid.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-theory', text: 'Theory and planning.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-protocols', text: 'The rescue protocols: Self, Team, Victim, Equipment; and Shout, Reach, Throw, Row, Go.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-other-craft', text: 'Rescue another type of craft.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-improvised', text: 'Improvised towlines.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-self-other', text: 'Self-rescue in another type of craft.', source: 'fsrt', where: 'Skills Competency Checklist' },
        { id: 'f-scenarios', text: 'Rescue scenarios.', source: 'fsrt', where: 'Skills Competency Checklist' },
      ],
    },
  ],
};

export const leaderRescueChecklist: ChecklistDef = {
  id: 'dev-leader-rescue',
  title: 'Sea Kayak Leader: rescue skills',
  intro: `The rescue lines (area C) of the BCAB Sea Kayak Leader Skills Checklist, with the specific rescues the assessment guidance names. ${RECORD}`,
  groups: [
    {
      id: 'rescues',
      title: 'Rescues',
      items: [
        { id: 'r-deep', text: 'Deep-water rescue that gets the casualty back in their kayak ready to continue.', source: 'bcab', where: 'Rescue skills' },
        { id: 'r-swamped', text: 'Swamped sea kayak: understand the dangers and recover one.', source: 'bcab-checklist', where: 'C. Rescue' },
        { id: 'r-landing', text: 'Landing an injured paddler in a variety of moderate conditions.', source: 'bcab-checklist', where: 'C. Rescue' },
        { id: 'r-noprogress', text: 'Helping a paddler who cannot make progress, with a range of options.', source: 'bcab', where: 'Rescue skills' },
        { id: 'r-tow', text: 'Towing a casualty, with single and multiple tows, and a tow system ready at all times.', source: 'bcab-checklist', where: 'C. Rescue' },
        { id: 'r-separated', text: 'Dealing with a separated paddler and kayak.', source: 'bcab-checklist', where: 'C. Rescue' },
        { id: 'r-unconscious', text: 'Rescuing an unconscious paddler, keeping an open airway, and explaining what happens next.', source: 'bcab-checklist', where: 'C. Rescue' },
        { id: 'r-incident', text: 'Incident management: keeping an overview so nobody is forgotten, and controlling the group.', source: 'bcab-checklist', where: 'C. Rescue' },
      ],
    },
    {
      id: 'principles',
      title: 'Principles and procedure',
      items: [
        { id: 'r-stvq', text: 'Self, Team, Victim, Equipment, and Shout, Reach, Throw, Row, Go.', source: 'bcab', where: 'Rescue skills' },
        { id: 'r-emergency', text: 'The emergency steps: assess, consider options, raise the alarm, stabilise, execute the plan.', source: 'bcab', where: 'Rescue skills' },
        { id: 'r-call', text: 'Know who to call and what information they need, and give it accurately.', source: 'bcab', where: 'Rescue skills' },
        { id: 'r-kit', text: 'Keep all your own equipment through every rescue and plan what happens next.', source: 'bcab', where: 'Rescue skills' },
      ],
    },
  ],
};

export const leaderBackgroundChecklist: ChecklistDef = {
  id: 'dev-leader-background',
  title: 'Sea Kayak Leader: paddling and background',
  intro: `The personal paddling lines (area B) and the background lines (area D) of the BCAB Sea Kayak Leader Skills Checklist, with detail from the assessment guidance. Leadership (area A) is covered by the ratings on the development plan. ${RECORD}`,
  groups: [
    {
      id: 'paddling',
      title: 'Personal paddling',
      items: [
        { id: 'p-technical', text: 'Control the kayak in real conditions, efficiently and consistently.', source: 'bcab-checklist', where: 'B. Personal paddling' },
        { id: 'p-tactical', text: 'Change tactics as conditions change, and use wind, tide and waves to your advantage.', source: 'bcab-checklist', where: 'B. Personal paddling' },
        { id: 'p-launch', text: 'Launch and land in varied situations, including rocky landings and surf.', source: 'bcab', where: 'Personal paddling skills' },
        { id: 'p-roll', text: 'Roll reliably in moderate conditions.', source: 'bcab', where: 'Personal paddling skills' },
        { id: 'p-selfrescue', text: 'One further self-rescue that is not a roll.', source: 'bcab', where: 'Personal paddling skills' },
        { id: 'p-wellbeing', text: 'Manage fatigue, hydration, nutrition and warmth, and keep a sensible attitude to risk.', source: 'bcab', where: 'Personal paddling skills' },
      ],
    },
    {
      id: 'background',
      title: 'Background knowledge and understanding',
      items: [
        { id: 'b-equipment', text: 'A range of personal and group safety kit: how to evaluate, maintain, carry or wear it.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-comms', text: 'Carry and use a VHF radio, with at least two further ways of attracting attention, and explain why you chose them.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-weather', text: 'Use several weather, tide and swell sources and interpret them to predict real conditions.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-nav', text: 'Navigate with both map and compass and a GPS, and work out an escape route with them.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-buoyage', text: 'Understand seamanship and buoyage.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-access', text: 'Know the access issues in your area, where to find the information, and how to protect the environment.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-experience', text: 'Keep evidence of your experience, such as a logbook.', source: 'bcab', where: 'Underpinning knowledge' },
        { id: 'b-deployment', text: 'Understand deployment matters: first aid, safeguarding, duty of care, incident reporting, insurance and the deployer’s procedures.', source: 'bcab', where: 'Underpinning knowledge' },
      ],
    },
  ],
};

export const developmentChecklists: { path: string; def: ChecklistDef; blurb: string }[] = [
  { path: '/training/checklists/fsrt', def: fsrtChecklist, blurb: 'The skills at the end of the Foundation Safety and Rescue Training course.' },
  { path: '/training/checklists/leader-rescue', def: leaderRescueChecklist, blurb: 'The rescue skills the Sea Kayak Leader assessment looks for.' },
  { path: '/training/checklists/leader-background', def: leaderBackgroundChecklist, blurb: 'Personal paddling, and the knowledge behind leading a trip.' },
];
