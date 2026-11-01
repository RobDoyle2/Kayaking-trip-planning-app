import type { ReactNode } from 'react';
import { navReferenceGuide } from '../content/nav/reference';
import { GuidePage } from '../pages/leadership/GuidePage';
import { CalculatorsPage } from '../pages/navigation/CalculatorsPage';
import { OileainPage } from '../pages/navigation/OileainPage';
import { TidesPage } from '../pages/navigation/TidesPage';
import { WeatherPage } from '../pages/navigation/WeatherPage';

const pages: Record<string, () => ReactNode> = {
  '/navigation/reference': () => <GuidePage guide={navReferenceGuide} crumb={{ label: 'Navigation and Tides', to: '/navigation' }} icon="compass" />,
  '/navigation/tools': () => <CalculatorsPage />,
  '/navigation/oileain': () => <OileainPage />,
  '/navigation/tides': () => <TidesPage />,
  '/navigation/weather': () => <WeatherPage />,
};

export default function NavigationRoutes({ path }: { path: string }) {
  return <>{pages[path]?.() ?? null}</>;
}
