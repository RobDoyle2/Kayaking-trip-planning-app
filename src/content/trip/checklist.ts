import { leaderChecklist, type ChecklistGroup } from '../leadership/checklists';

/**
 * The final planning checklist for a trip: the "Plan the trip" and "People ashore and the accident plan" groups from the
 * Leader preparation checklist, so every item already names its source. Ticks are kept inside each trip.
 */
export const finalChecklistGroups: ChecklistGroup[] = leaderChecklist.groups.filter((g) => g.id === 'plan' || g.id === 'ashore');

export const finalChecklistItems = finalChecklistGroups.flatMap((g) => g.items);

export function finalChecklistProgress(checks: Record<string, boolean>): { done: number; total: number } {
  return { done: finalChecklistItems.filter((i) => checks[i.id] === true).length, total: finalChecklistItems.length };
}
