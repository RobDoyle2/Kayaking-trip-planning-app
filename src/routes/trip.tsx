import { TripEditorPage } from '../pages/trip/TripEditorPage';
import { TripListPage } from '../pages/trip/TripListPage';
import type { TripType } from '../content/trip/fields';

const lists: Record<string, TripType> = {
  '/trip-planning/day': 'day',
  '/trip-planning/multi-day': 'multi-day',
  '/trip-planning/camping': 'camping',
};

const TRIP_PATH = /^\/trip-planning\/trip\/([^/]+)$/;

export default function TripRoutes({ path }: { path: string }) {
  const type = lists[path];
  if (type) return <TripListPage type={type} />;
  const m = TRIP_PATH.exec(path);
  return m ? <TripEditorPage id={m[1]!} /> : null;
}
