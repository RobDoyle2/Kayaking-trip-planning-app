/**
 * Leader checklists. Each item is a short paraphrase of something a source says, with the source named.
 * Nothing here is invented advice: an item without a source does not belong in this file (a unit test checks).
 */

export interface ChecklistItem {
  id: string;
  text: string;
  /** Key into leadershipSources. */
  source: string;
  /** Where in the source, when known. */
  where?: string;
  link?: { to: string; label: string };
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistDef {
  id: string;
  title: string;
  intro: string;
  groups: ChecklistGroup[];
}

export const leaderChecklist: ChecklistDef = {
  id: 'leader-preparation',
  title: 'Leader preparation checklist',
  intro: 'Work through this before the day. Ticks are saved on this device only.',
  groups: [
    {
      id: 'plan',
      title: 'Plan the trip',
      items: [
        { id: 'plan-3', text: 'The group is at least three paddlers.', source: 'ecskc-safety' },
        {
          id: 'plan-award',
          text: 'Every paddler has trained with an authorised provider and holds at least the Level 2 Sea Kayak Skills Award (Canoeing Ireland), as the club requires.',
          source: 'ecskc-safety',
        },
        { id: 'plan-suits', text: 'The trip suits the group’s experience, equipment and fitness.', source: 'ecskc-safety' },
        {
          id: 'plan-read',
          text: 'You have read the guides and resources for the area: its length, duration, difficulty, hazards and recent changes.',
          source: 'ecskc-safety',
        },
        {
          id: 'plan-aims',
          text: 'Group aims and the level of challenge are agreed with the group.',
          source: 'bcab',
          where: 'Safety, participant-focused leadership',
        },
        {
          id: 'plan-forecast',
          text: 'You have checked the weather forecast and water levels, and conditions are favourable.',
          source: 'ecskc-safety',
        },
        {
          id: 'plan-interplay',
          text: 'You have looked at more than one weather, tide and swell source, and considered how current, wind and fetch combine.',
          source: 'bcab',
          where: 'Knowledge: weather, planning, navigation',
        },
        {
          id: 'plan-access',
          text: 'You have checked access and landing restrictions, such as military zones, private land and places where landing is forbidden.',
          source: 'bcab',
          where: 'Knowledge: access and environment',
        },
        {
          id: 'plan-escape',
          text: 'You have worked out an escape route using a map and GPS.',
          source: 'bcab',
          where: 'Knowledge: weather, planning, navigation',
        },
      ],
    },
    {
      id: 'kit',
      title: 'Kit and communications',
      items: [
        { id: 'kit-vhf', text: 'You carry a VHF radio and can use it.', source: 'bcab', where: 'p. 12, Safety' },
        {
          id: 'kit-two',
          text: 'You carry at least two other ways of attracting attention (for example a personal locator beacon, flares, LED flares or a mobile phone) and can say why you chose them.',
          source: 'bcab',
          where: 'p. 12, Safety',
        },
        { id: 'kit-nav', text: 'You carry a map and compass and a GPS, and can use both.', source: 'bcab', where: 'Knowledge: weather, planning, navigation' },
        { id: 'kit-tow', text: 'Your tow system is ready for use at all times.', source: 'bcab', where: 'Rescue skills: towing' },
        {
          id: 'kit-aid',
          text: 'A first-aid kit and a repair kit are with the group, and you know what is in them.',
          source: 'bcab',
          where: 'Rescue skills: incident management',
        },
        {
          id: 'kit-equip',
          text: 'You have done the equipment check.',
          source: 'ecskc-safety',
          link: { to: '/leadership/equipment', label: 'Open the equipment check' },
        },
      ],
    },
    {
      id: 'ashore',
      title: 'People ashore and the accident plan',
      items: [
        { id: 'ashore-contact', text: 'You have left your trip details with a responsible person on shore.', source: 'ecskc-safety' },
        {
          id: 'ashore-plan',
          text: 'You know where the nearest phone, help and vehicle are, and where the first-aid kit, repair kit and spares are.',
          source: 'fsrt',
          where: 'Safety theory: accident plan',
        },
        {
          id: 'ashore-written',
          text: 'Each paddler has confirmed in writing that they will have a buoyancy aid, a helmet, and suitable clothing and footwear (the club asks for this for its trips).',
          source: 'ecskc-equipment',
        },
      ],
    },
    {
      id: 'brief',
      title: 'Brief and decide',
      items: [
        {
          id: 'brief-risk',
          text: 'You have done the risk assessment.',
          source: 'bcab',
          where: 'Safety: sound risk assessment throughout',
          link: { to: '/leadership/risk', label: 'Open the risk assessment' },
        },
        {
          id: 'brief-sheets',
          text: 'You have prepared the SHEETS briefing.',
          source: 'sheets',
          link: { to: '/leadership/sheets', label: 'Open the SHEETS briefing' },
        },
        {
          id: 'brief-emergency',
          text: 'You know the emergency steps and the rescue priority rules.',
          source: 'fsrt',
          link: { to: '/emergency', label: 'Open the emergency card' },
        },
      ],
    },
  ],
};

export const equipmentChecklist: ChecklistDef = {
  id: 'equipment-safety',
  title: 'Equipment and safety check',
  intro: 'Do this at the water before launching. Ticks are saved on this device only.',
  groups: [
    {
      id: 'personal',
      title: 'Each paddler',
      items: [
        { id: 'eq-pfd', text: 'Approved buoyancy aid, worn at all times.', source: 'ecskc-safety' },
        {
          id: 'eq-helmet',
          text: 'Helmet. The Basic Safety page asks for one on moving water, coastal or inland, and the club asks for one on its trips.',
          source: 'ecskc-safety',
        },
        { id: 'eq-clothes', text: 'Adequate clothing for the risk of hypothermia from cold-water immersion.', source: 'ecskc-safety' },
        { id: 'eq-food', text: 'Food, drink and spare clothes.', source: 'ecskc-safety' },
        { id: 'eq-boat', text: 'A boat with enough buoyancy to stay afloat if it capsizes.', source: 'ecskc-safety' },
        { id: 'eq-splitpaddle', text: 'A split paddle.', source: 'ecskc-safety' },
        { id: 'eq-throw', text: 'A throw line and a tow line.', source: 'ecskc-safety' },
      ],
    },
    {
      id: 'rescue-kit',
      title: 'Rescue kit the course notes recommend',
      items: [
        {
          id: 'rk-sling',
          text: 'Webbing sling with a large karabiner, a whistle and a knife.',
          source: 'fsrt',
          where: 'Course basics: recommended personal kit',
        },
        {
          id: 'rk-clean',
          text: 'Clean-rope rule: if you carry a rope, carry a knife, and keep line ends free of loops and knots that could snag.',
          source: 'fsrt',
          where: 'Safety theory',
        },
      ],
    },
    {
      id: 'group-kit',
      title: 'The group',
      items: [
        { id: 'gk-aid', text: 'First-aid kit.', source: 'ecskc-safety' },
        { id: 'gk-repair', text: 'Pin kit and repair kit.', source: 'ecskc-safety' },
        { id: 'gk-flares', text: 'Flares.', source: 'ecskc-safety' },
        { id: 'gk-shelter', text: 'A means of shelter.', source: 'ecskc-safety' },
        {
          id: 'gk-comms',
          text: 'A way to call for help: a mobile phone or VHF radio in a waterproof case.',
          source: 'ecskc-safety',
        },
        { id: 'gk-vhf', text: 'The leader carries a VHF radio and can use it, and the channel is agreed.', source: 'bcab', where: 'p. 12, Safety' },
      ],
    },
    {
      id: 'before-launch',
      title: 'Before launching',
      items: [
        {
          id: 'bl-check',
          text: 'Everyone has checked each other over, including drysuit zips and helmets if required.',
          source: 'sheets',
          where: 'Equipment',
        },
        {
          id: 'bl-know',
          text: 'Everyone carries safety gear they know how to use, such as a towline.',
          source: 'sheets',
          where: 'Equipment',
        },
      ],
    },
  ],
};

export function allItems(def: ChecklistDef): ChecklistItem[] {
  return def.groups.flatMap((g) => g.items);
}

export function checklistProgress(def: ChecklistDef, checked: Record<string, boolean>): { done: number; total: number } {
  const items = allItems(def);
  return { done: items.filter((i) => checked[i.id] === true).length, total: items.length };
}

/** Plain-text version of a checklist for copying, downloading or printing, with the source for each item. */
export function checklistText(def: ChecklistDef, checked: Record<string, boolean>): string {
  const out: string[] = [def.title, ''];
  for (const g of def.groups) {
    out.push(g.title);
    for (const i of g.items) out.push(`[${checked[i.id] === true ? 'x' : ' '}] ${i.text} (${i.source})`);
    out.push('');
  }
  const { done, total } = checklistProgress(def, checked);
  out.push(`${done} of ${total} ticked.`);
  return out.join('\n');
}
