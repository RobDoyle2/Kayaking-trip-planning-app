import { LinkCards } from '../../components/LinkCards';
import { Notice } from '../../components/ui';
import { liveStatus, tideLinks, tidesGuide } from '../../content/nav/tides';
import { GuidePage } from '../leadership/GuidePage';

export function TidesPage() {
  return (
    <GuidePage guide={tidesGuide} crumb={{ label: 'Navigation and Tides', to: '/navigation' }} icon="compass">
      <Notice title="Predictions, not live readings">
        This app does not show tide times or heights. Where it points to a source below, every value there is a prediction, and the source’s own datum and time zone apply.
      </Notice>
      <LinkCards cards={tideLinks} title="Where to get tide predictions" />
      <section className="block-tight" aria-labelledby="live-title">
        <h2 id="live-title">{liveStatus.heading}</h2>
        <ul className="plain-list">
          {liveStatus.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </GuidePage>
  );
}
