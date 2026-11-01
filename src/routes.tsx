import { lazy, Suspense, type ReactNode } from 'react';
import type { SectionId } from './clubs/types';
import { equipmentChecklist, leaderChecklist } from './content/leadership/checklists';
import { groupGuide, preparingGuide, responsibilitiesGuide } from './content/leadership/guides';
import { isTripId } from './content/trip/trip';
import { ChecklistPage } from './pages/leadership/ChecklistPage';
import { GuidePage } from './pages/leadership/GuidePage';
import { ReviewPage } from './pages/leadership/ReviewPage';
import { RiskPage } from './pages/leadership/RiskPage';
import { SheetsPage } from './pages/leadership/SheetsPage';
// The trip planner is the largest part of the app and not every visit needs it, so it loads when first opened.
const TripListPage = lazy(() => import('./pages/trip/TripListPage').then((m) => ({ default: m.TripListPage })));
const TripEditorPage = lazy(() => import('./pages/trip/TripEditorPage').then((m) => ({ default: m.TripEditorPage })));

function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container page">
          <p className="muted" role="status">
            Loading…
          </p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

interface ToolRoute {
  section: SectionId;
  render: () => ReactNode;
}

/** Pages built so far, by path. Section pages and the fixed pages are handled in App.tsx. */
export const toolRoutes: Record<string, ToolRoute> = {
  '/leadership/preparing': { section: 'leadership', render: () => <GuidePage guide={preparingGuide} /> },
  '/leadership/responsibilities': { section: 'leadership', render: () => <GuidePage guide={responsibilitiesGuide} /> },
  '/leadership/group': { section: 'leadership', render: () => <GuidePage guide={groupGuide} /> },
  '/leadership/checklist': { section: 'leadership', render: () => <ChecklistPage def={leaderChecklist} savedId="leader-checklist" /> },
  '/leadership/equipment': { section: 'leadership', render: () => <ChecklistPage def={equipmentChecklist} savedId="equipment-checklist" /> },
  '/leadership/sheets': { section: 'leadership', render: () => <SheetsPage /> },
  '/leadership/risk': { section: 'leadership', render: () => <RiskPage /> },
  '/leadership/review': { section: 'leadership', render: () => <ReviewPage /> },
  '/trip-planning/day': { section: 'trip-planning', render: () => <Loading><TripListPage type="day" /></Loading> },
  '/trip-planning/multi-day': { section: 'trip-planning', render: () => <Loading><TripListPage type="multi-day" /></Loading> },
  '/trip-planning/camping': { section: 'trip-planning', render: () => <Loading><TripListPage type="camping" /></Loading> },
};

const TRIP_PATH = /^\/trip-planning\/trip\/([^/]+)$/;

/** The tool page for a path, or null. A club that has switched the section off gets nothing. */
export function matchToolRoute(path: string, enabled: SectionId[]): ReactNode | null {
  const fixed = toolRoutes[path];
  if (fixed) return enabled.includes(fixed.section) ? fixed.render() : null;
  const m = TRIP_PATH.exec(path);
  if (m && enabled.includes('trip-planning') && isTripId(m[1]!)) return <Loading><TripEditorPage id={m[1]!} /></Loading>;
  return null;
}
