import { lazy, Suspense, type ReactNode } from 'react';
import type { SectionId } from './clubs/types';
import { isTripId } from './content/trip/trip';
import { toolPaths } from './routePaths';

// Each section's pages load when first opened, so the home screen stays small.
const LeadershipRoutes = lazy(() => import('./routes/leadership'));
const TripRoutes = lazy(() => import('./routes/trip'));
const TrainingRoutes = lazy(() => import('./routes/training'));
const NavigationRoutes = lazy(() => import('./routes/navigation'));
const VhfRoutes = lazy(() => import('./routes/vhf'));
const KnowledgeRoutes = lazy(() => import('./routes/knowledge'));

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

const TRIP_PATH = /^\/trip-planning\/trip\/([^/]+)$/;

/** The tool page for a path, or null. A club that has switched the section off gets nothing. */
export function matchToolRoute(path: string, enabled: SectionId[]): ReactNode | null {
  let section: SectionId | undefined = toolPaths[path];
  if (!section) {
    const m = TRIP_PATH.exec(path);
    if (m && isTripId(m[1]!)) section = 'trip-planning';
  }
  if (!section || !enabled.includes(section)) return null;
  switch (section) {
    case 'leadership':
      return (
        <Loading>
          <LeadershipRoutes path={path} />
        </Loading>
      );
    case 'trip-planning':
      return (
        <Loading>
          <TripRoutes path={path} />
        </Loading>
      );
    case 'training':
      return (
        <Loading>
          <TrainingRoutes path={path} />
        </Loading>
      );
    case 'navigation':
      return (
        <Loading>
          <NavigationRoutes path={path} />
        </Loading>
      );
    case 'vhf':
      return (
        <Loading>
          <VhfRoutes path={path} />
        </Loading>
      );
    case 'knowledge':
      return (
        <Loading>
          <KnowledgeRoutes path={path} />
        </Loading>
      );
    default:
      return null;
  }
}
