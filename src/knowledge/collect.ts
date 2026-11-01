import clubJson from '../clubs/ecskc/club.json';
import { emergencyNotIncluded, knowBeforeLaunch, rescuePriorities } from '../content/emergency';
import { equipmentChecklist, leaderChecklist, type ChecklistDef } from '../content/leadership/checklists';
import { groupGuide, preparingGuide, responsibilitiesGuide, type Guide } from '../content/leadership/guides';
import { hazardPrompts } from '../content/leadership/risk';
import { sheetsSections, sheetsSource } from '../content/leadership/sheets';
import { leadershipSources } from '../content/leadership/sources';
import { sections } from '../content/sections';
import { calcRules } from '../content/nav/calc';
import { navReferenceGuide } from '../content/nav/reference';
import { oileainRegions } from '../content/nav/oileain';
import { tidesGuide } from '../content/nav/tides';
import { vhfNotice, vhfStations, workingChannel } from '../content/nav/vhf';
import { beaufort, weatherGuide } from '../content/nav/weather';
import { developmentChecklists } from '../content/training/checklists';
import { trainingGuide } from '../content/training/guidance';
import { awardLevels } from '../content/training/qualifications';

/**
 * The assistant's library: short passages, each from content the app already shows, with the sources it came from. It is
 * generated from the app's own content modules, so the assistant can only say what the app says, with the same sources.
 * Run `npm run kb` after changing any content; a test fails if the committed file is out of date.
 */

export interface KbDoc {
  title: string;
  short: string;
  url?: string;
  howRead: string;
}

export interface KbPassage {
  id: string;
  /** Source keys (see `docs`). */
  docs: string[];
  title: string;
  /** Page or section inside the source, when known. */
  where?: string;
  /** The page in this app that shows the same content. */
  href: string;
  /** One sentence or list item per block, so a citation can point at a single line. */
  blocks: string[];
  /** 'gap' passages say what the library does not cover. */
  kind: 'reference' | 'gap';
  safety: boolean;
  approved: boolean;
}

export interface KnowledgeBase {
  version: 1;
  club: string;
  /** The club's emergency wording, shown with safety answers. */
  emergency: { numbers: string; vhfChannel: string; source: string };
  docs: Record<string, KbDoc>;
  /** The app's section addresses; a question may say which one the visitor is in. */
  sectionPaths: string[];
  passages: KbPassage[];
}

const SAFETY = /rescu|emergenc|capsiz|hypotherm|drown|casualt|distress|mayday|\bvhf\b|coast ?guard|flare|\btow|tide race|overfall|\brace\b|surf|beaufort|wind|limit|unconscious|first.aid|swim|danger|hazard|fog|offshore|crossing|stream|tidal|tide/i;

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

/** Splits a paragraph into sentences, so each can be cited on its own. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9‘“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function makePassage(args: { id: string; docs: string[]; title: string; where?: string; href: string; blocks: string[]; kind?: 'reference' | 'gap' }): KbPassage {
  const blocks = args.blocks.map((b) => b.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const base: KbPassage = {
    id: args.id,
    docs: args.docs,
    title: args.title,
    href: args.href,
    blocks,
    kind: args.kind ?? 'reference',
    safety: SAFETY.test(`${args.title} ${blocks.join(' ')}`),
    approved: false,
  };
  return args.where ? { ...base, where: args.where } : base;
}

function guidePassages(guide: Guide, href: string): KbPassage[] {
  return guide.sections.map((s, i) =>
    makePassage({
      id: `${slug(guide.id)}.${i + 1}-${slug(s.heading)}`,
      docs: s.sources,
      title: `${guide.title}: ${s.heading}`,
      href,
      blocks: [...(s.paragraphs ?? []).flatMap(sentences), ...(s.bullets ?? [])],
    }),
  );
}

function checklistPassages(def: ChecklistDef, href: string): KbPassage[] {
  return def.groups.map((g) => {
    const docs = Array.from(new Set(g.items.map((i) => i.source)));
    const wheres = Array.from(new Set(g.items.map((i) => i.where).filter((w): w is string => !!w)));
    return makePassage({
      id: `${slug(def.id)}.${slug(g.id)}`,
      docs,
      title: `${def.title}: ${g.title}`,
      ...(wheres.length ? { where: wheres.join('; ') } : {}),
      href,
      blocks: g.items.map((i) => i.text),
    });
  });
}

export function collectKnowledgeBase(): KnowledgeBase {
  const passages: KbPassage[] = [];

  passages.push(...guidePassages(preparingGuide, '/leadership/preparing'));
  passages.push(...guidePassages(responsibilitiesGuide, '/leadership/responsibilities'));
  passages.push(...guidePassages(groupGuide, '/leadership/group'));
  passages.push(...checklistPassages(leaderChecklist, '/leadership/checklist'));
  passages.push(...checklistPassages(equipmentChecklist, '/leadership/equipment'));

  for (const h of hazardPrompts) {
    passages.push(
      makePassage({
        id: `risk.${slug(h.id)}`,
        docs: [h.source],
        title: `Hazard to consider: ${h.hazard}`,
        ...(h.where ? { where: h.where } : {}),
        href: '/leadership/risk',
        blocks: sentences(h.why),
      }),
    );
  }

  for (const s of sheetsSections) {
    passages.push(
      makePassage({
        id: `sheets.${slug(s.id)}`,
        docs: ['sheets'],
        title: `SHEETS briefing: ${s.letter}, ${s.heading}`,
        where: `${sheetsSource.url}, section ${s.heading}`,
        href: '/leadership/sheets',
        blocks: s.prompts,
      }),
    );
  }

  passages.push(
    makePassage({
      id: 'emergency.numbers',
      docs: ['ecskc-safety'],
      title: 'Emergency card: who to call',
      href: '/emergency',
      blocks: [`In an emergency dial ${clubJson.emergency.numbers} and ask for the Coast Guard.`, `To reach the Coast Guard by radio, use VHF channel ${clubJson.emergency.vhfChannel}.`],
    }),
    makePassage({
      id: 'emergency.priorities',
      docs: ['fsrt', 'bcab'],
      title: 'Emergency card: while you act',
      href: '/emergency',
      blocks: rescuePriorities.map((r) => `${r.title} ${r.text}`),
    }),
    makePassage({
      id: 'emergency.know-before-launch',
      docs: ['fsrt'],
      title: 'Emergency card: know before you launch',
      href: '/emergency',
      blocks: [knowBeforeLaunch],
    }),
  );

  passages.push(...guidePassages(trainingGuide, '/training/guidance'));
  for (const c of developmentChecklists) passages.push(...checklistPassages(c.def, c.path));
  passages.push(
    makePassage({
      id: 'training.awards',
      docs: ['ci-awards'],
      title: 'Canoeing Ireland Sea Kayak Skills Awards',
      href: '/training/qualifications',
      blocks: awardLevels.map((l) => `Level ${l.level}, ${l.name}: ${l.note}`),
    }),
  );

  passages.push(...guidePassages(navReferenceGuide, '/navigation/reference'));
  passages.push(...guidePassages(tidesGuide, '/navigation/tides'));
  passages.push(...guidePassages(weatherGuide, '/navigation/weather'));
  passages.push(
    makePassage({
      id: 'weather.beaufort',
      docs: ['shearwater'],
      title: 'The Beaufort scale',
      href: '/navigation/weather',
      blocks: beaufort.map((b) => `Force ${b.force}: ${b.name}, ${b.knots} knots.`),
    }),
  );

  for (const [id, r] of Object.entries(calcRules)) {
    passages.push(
      makePassage({
        id: `calc.${id}`,
        docs: id === 'fromhw' ? ['oileain', 'shearwater'] : ['shearwater'],
        title: `Calculator: ${r.title}`,
        href: '/navigation/tools',
        blocks: [`Rule: ${r.formula}`, ...r.assumptions],
      }),
    );
  }

  passages.push(
    makePassage({
      id: 'oileain.standard-ports',
      docs: ['oileain'],
      title: 'Oileáin: the standard port for each coast',
      href: '/navigation/oileain',
      blocks: [
        'Oileáin gives high water and tidal stream times as hours before or after high water at a standard port, and the port changes round the coast.',
        ...oileainRegions.map((r) => `${r.coast}: ${r.port}.${r.note ? ` ${r.note}` : ''}`),
      ],
    }),
  );

  passages.push(
    makePassage({
      id: 'vhf.notice',
      docs: ['mn61'],
      title: 'VHF stations: the notice and its limits',
      where: `${vhfNotice.number}, ${vhfNotice.date}`,
      href: '/vhf/stations',
      blocks: [
        `The station list comes from ${vhfNotice.number}, dated ${vhfNotice.date}, as published by afloat.ie. Later notices have not been checked.`,
        'Every station listens on channel 16, which the changes did not affect.',
        'Channel 67 is available when required but may not be monitored at all times.',
      ],
    }),
  );
  for (const s of vhfStations) {
    const working = workingChannel(s);
    passages.push(
      makePassage({
        id: `vhf.${slug(s.name)}`,
        docs: ['mn61'],
        title: `VHF station: ${s.name}`,
        where: `${vhfNotice.number}, ${vhfNotice.date}`,
        href: '/vhf/stations',
        blocks: [
          `${s.name} Coast Guard Radio: channels listed ${s.channels.join(', ')}${working ? `, working channel ${working}` : ', no working channel listed'}.`,
          s.dsc ? 'DSC channel 70 is listed for this station.' : 'DSC channel 70 is not listed for this station.',
          s.oldChannel ? `The working channel was changed by the December 2020 notice, from channel ${s.oldChannel}.` : 'The working channel was not changed by the December 2020 notice.',
          ...(s.note ? [s.note] : []),
        ],
      }),
    );
  }

  // What the library does not cover: every item the app shows as blocked, and a few standing facts.
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.status === 'blocked' && item.blockedBy) {
        passages.push(
          makePassage({
            id: `gap.${slug(sec.id)}-${slug(item.id)}`,
            docs: [],
            title: `Not covered: ${item.title}`,
            href: sec.path,
            blocks: [`${item.title} is not available in this app.`, ...sentences(item.blockedBy)],
            kind: 'gap',
          }),
        );
      }
    }
  }
  passages.push(
    makePassage({
      id: 'gap.live',
      docs: [],
      title: 'Not covered: live conditions',
      href: '/sources',
      blocks: [
        'This app and its assistant do not have live weather, tide or radio information.',
        'Tide times, forecasts and stream rates in any document are predictions or background reading, not today’s conditions.',
        'Check a current forecast, tide table and chart before every trip.',
      ],
      kind: 'gap',
    }),
    makePassage({
      id: 'gap.camping-kit',
      docs: [],
      title: 'Not covered: a camping kit list',
      href: '/trip-planning/camping',
      blocks: [
        'ECSKC has not supplied a camping kit list, so camping gear, food and water are free text in a camping trip plan and the app does not suggest what to take.',
        'The equipment lists in the app are the club Basic Safety list and the leader and rescue-course kit lists, not a camping list.',
      ],
      kind: 'gap',
    }),
    makePassage({
      id: 'gap.coastguard-call',
      docs: [],
      title: 'Not covered: what to tell the Coast Guard',
      href: '/emergency',
      blocks: sentences(emergencyNotIncluded),
      kind: 'gap',
    }),
    makePassage({
      id: 'gap.approval',
      docs: [],
      title: 'Approval status of the documents',
      href: '/knowledge/documents',
      blocks: [
        'None of the material in this library has been approved by the ECSKC committee.',
        'It is paraphrased from the documents and web pages supplied to this project, and each passage names its source.',
        'It is background reading and does not replace training, a current forecast, chart work or the leader’s judgement.',
      ],
      kind: 'gap',
    }),
    makePassage({
      id: 'gap.risk-template',
      docs: [],
      title: 'Not covered: the club risk assessment template',
      href: '/leadership/risk',
      blocks: ['ECSKC has not supplied the risk assessment template it uses, so the app has a plain generic layout with no scoring.'],
      kind: 'gap',
    }),
  );

  const used = new Set(passages.flatMap((p) => p.docs));
  const docs: Record<string, KbDoc> = {};
  for (const key of [...used].sort()) {
    const d = leadershipSources[key];
    if (!d) throw new Error(`Passage cites unknown source "${key}"`);
    docs[key] = { title: d.title, short: d.short, ...(d.url ? { url: d.url } : {}), howRead: d.howRead };
  }

  const ids = new Set<string>();
  for (const p of passages) {
    if (ids.has(p.id)) throw new Error(`Duplicate passage id ${p.id}`);
    ids.add(p.id);
  }

  return { version: 1, club: clubJson.slug, sectionPaths: sections.map((s) => s.path), emergency: { numbers: clubJson.emergency.numbers, vhfChannel: clubJson.emergency.vhfChannel, source: clubJson.emergency.source }, docs, passages };
}
