import { LinkCards } from '../../components/LinkCards';
import { Notice } from '../../components/ui';
import { awardWindLimitForce, beaufort, weatherGuide, weatherLinks } from '../../content/nav/weather';
import { GuidePage } from '../leadership/GuidePage';

export function WeatherPage() {
  return (
    <GuidePage guide={weatherGuide} crumb={{ label: 'Navigation and Tides', to: '/navigation' }} icon="compass">
      <Notice title="No live weather here">
        This app shows no forecast and no buoy readings. A forecast must be current, and from a source that also gives weather warnings, so the links below go to the providers.
      </Notice>
      <section className="block-tight" aria-labelledby="beaufort-title">
        <h2 id="beaufort-title">The Beaufort scale</h2>
        <table className="calc__table">
          <caption className="sr-only">Beaufort force, wind speed in knots and name</caption>
          <thead>
            <tr>
              <th scope="col">Force</th>
              <th scope="col">Knots</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            {beaufort.map((b) => (
              <tr key={b.force}>
                <td>{b.force}</td>
                <td>{b.knots}</td>
                <td>{b.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          For information: the Sea Kayak Leader award’s wind limit is force {awardWindLimitForce}. That is the award’s limit, not a club rule and not a judgement of any day’s conditions.
        </p>
      </section>
      <LinkCards cards={weatherLinks} title="Where to get a forecast" />
    </GuidePage>
  );
}
