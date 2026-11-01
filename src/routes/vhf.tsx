import { StationsPage } from '../pages/vhf/StationsPage';

export default function VhfRoutes({ path }: { path: string }) {
  return path === '/vhf/stations' ? <StationsPage /> : null;
}
