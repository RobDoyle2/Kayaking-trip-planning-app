import { useState } from 'react';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { Button, ButtonLink, Notice, PageHeader } from '../../components/ui';
import { tripTypeInfo, tripTypes, type TripType } from '../../content/trip/fields';
import { formatDate } from '../../content/trip/output';
import { createTrip, MAX_TRIPS, newTripId, tripDateRange, tripGaps, tripTitle, type Trip, type TripStore } from '../../content/trip/trip';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';
import { clockTime } from '../../lib/storage';
import { Link, useNavigate } from '../../router/Router';

/** Long names are cut in buttons and questions so they cannot push the page wider than the screen. */
const shorten = (text: string) => (text.length > 40 ? `${text.slice(0, 40)}…` : text);

const blurb: Record<TripType, string> = {
  day: 'One day on the water: route, people, weather, tides, safety, communications and transport.',
  'multi-day': 'Several days with accommodation. Each day has its own route, weather and tides.',
  camping: 'Several days with camping. Each day has its own route, weather, tides and camp, and the trip has camping gear, food and water.',
};

export function TripListPage({ type }: { type: TripType }) {
  const info = tripTypeInfo(type);
  useDocumentTitle(info.title);
  const navigate = useNavigate();
  const { value, setValue, state, ready, saveNow } = usePersisted<TripStore>('trips', {});
  const [message, setMessage] = useState('');
  const all: Trip[] = Object.values(value as TripStore);
  const mine = all.filter((t) => t.type === type).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const create = () => {
    if (all.length >= MAX_TRIPS) {
      setMessage(`This device already holds ${MAX_TRIPS} trip plans. Delete one before starting another.`);
      return;
    }
    const id = newTripId();
    setValue((prev) => ({ ...prev, [id]: createTrip(type, id) }));
    saveNow();
    navigate(`/trip-planning/trip/${id}`);
  };

  return (
    <div className="container page">
      <PageHeader title={info.title} intro={blurb[type]} icon="trip" crumb={{ label: 'Trip Planning', to: '/trip-planning' }} />

      <Notice tone="warning" title="Built, but not approved by the club">
        The fields follow the approved specification. ECSKC has not yet approved the wording, and the app does not fill anything in for you: it does
        not fetch weather, calculate tides or suggest a route.
      </Notice>

      <SaveStatus state={state} />

      <p>
        <Button size="large" onClick={create} disabled={!ready || state.kind === 'error'}>
          Start a new plan
        </Button>
      </p>
      {state.kind === 'error' && (
        <p className="muted">Starting a plan is switched off because this browser is not letting the app save, and a plan that cannot be saved would be lost as soon as you leave it.</p>
      )}
      <p className="export-bar__message" role="status">
        {message}
      </p>

      <section className="block-tight" aria-labelledby="saved-trips">
        <h2 id="saved-trips">Your saved plans ({mine.length})</h2>
        {!ready ? (
          <p className="muted">Looking for plans saved on this device…</p>
        ) : mine.length === 0 ? (
          <p className="muted">No {info.short.toLowerCase()} plans are saved on this device yet.</p>
        ) : (
          <ul className="saved-list">
            {mine.map((trip) => {
              const gaps = tripGaps(trip).length;
              const range = tripDateRange(trip);
              return (
                <li key={trip.id} className="saved-item">
                  <div>
                    <p className="saved-item__title">
                      <Link to={`/trip-planning/trip/${trip.id}`}>{tripTitle(trip)}</Link>
                    </p>
                    <p className="muted">
                      {range ? formatDate(range.split(' to ')[0]!) + (range.includes(' to ') ? ' onwards' : '') : 'No date yet'}. {gaps === 0 ? 'Nothing missing.' : `${gaps} still to fill in.`} Last
                      changed {clockTime(trip.updatedAt)} on {new Date(trip.updatedAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}.
                    </p>
                  </div>
                  <ButtonLink to={`/trip-planning/trip/${trip.id}`} size="small">
                    Open
                  </ButtonLink>
                  <ConfirmButton
                    label="Delete"
                    ariaLabel={`Delete ${shorten(tripTitle(trip))}`}
                    question={`Delete “${shorten(tripTitle(trip))}”?`}
                    confirmLabel="Yes, delete it"
                    onConfirm={() => {
                      setValue((prev) => {
                        const next = { ...prev };
                        delete next[trip.id];
                        return next;
                      });
                      saveNow();
                      setMessage(`Deleted “${shorten(tripTitle(trip))}”.`);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="block-tight" aria-labelledby="other-types">
        <h2 id="other-types">Other kinds of trip</h2>
        <ul className="plain-list">
          {tripTypes
            .filter((t) => t.id !== type)
            .map((t) => (
              <li key={t.id}>
                <Link to={t.path}>{t.title}</Link>
              </li>
            ))}
        </ul>
        <p className="muted">
          Plans are saved in this browser only. To keep a copy or move to another device, open a plan and download its trip file, or use{' '}
          <Link to="/my-plans">My plans</Link>.
        </p>
      </section>
    </div>
  );
}
