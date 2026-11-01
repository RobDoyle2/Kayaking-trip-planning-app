import { SourceList } from '../../components/forms/SourceList';
import { ExternalLink, Notice, PageHeader } from '../../components/ui';
import { oileainLinks, oileainRegions } from '../../content/nav/oileain';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

export function OileainPage() {
  useDocumentTitle('Oileáin guidance');
  return (
    <div className="container page prose">
      <PageHeader
        title="Oileáin guidance"
        icon="compass"
        intro="Which standard port the Oileáin guide uses for each coast, and how it gives tide times."
        crumb={{ label: 'Navigation and Tides', to: '/navigation' }}
      />
      <Notice tone="warning" title="An index, not the guide">
        Oileáin is David Walsh’s guide to the Irish coast and islands, published by Pesda Press. This page does not reproduce its text or its tide tables. The supplied PDF has 332
        pages and no stated edition, while the printed second edition is listed at 292 pages, so they are not the same text. Check any tide, landing or access note in the guide
        itself before a trip.
      </Notice>

      <section aria-labelledby="regions-title">
        <h2 id="regions-title">Standard port for each coast</h2>
        <p>
          Oileáin gives high water and tidal stream times as hours before or after high water at a standard port, and the port changes round the coast. These were counted from
          the mentions in the supplied PDF.
        </p>
        <table className="calc__table">
          <caption className="sr-only">Standard port used for times, by coast</caption>
          <thead>
            <tr>
              <th scope="col">Coast</th>
              <th scope="col">Standard port in Oileáin</th>
            </tr>
          </thead>
          <tbody>
            {oileainRegions.map((r) => (
              <tr key={r.coast}>
                <td>{r.coast}</td>
                <td>
                  {r.port}
                  {r.note ? <span className="muted"> ({r.note})</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="howto-title">
        <h2 id="howto-title">How the times are given</h2>
        <p>
          A place’s high water is often given as an offset from the standard port, and a stream as the hours before or after the standard port’s high water at which it starts or
          stops. The navigation course gives Lambay as an example: its high water is the same as Dublin’s, and the stream floods northwards from 4 hours 30 minutes after Dublin high
          water until 1 hour 30 minutes before the next.
        </p>
        <p>
          To turn an offset into a clock time, take the standard port’s high water from your own tide table, then use the{' '}
          <Link to="/navigation/tools">time-from-high-water calculator</Link>.
        </p>
      </section>

      <section aria-labelledby="allowance-title">
        <h2 id="allowance-title">The high-water time allowance: not available</h2>
        <p>
          The project brief refers to an extra-time rule around high water in Oileáin. The 332-page PDF supplied contains no such rule, and no introduction chapter, so nothing is
          built for it and the app will not guess one. If you know where it is printed (perhaps the introduction of the printed edition), tell the project and it can be added.
        </p>
      </section>

      <section aria-labelledby="links-title">
        <h2 id="links-title">Where to read more</h2>
        <ul className="plain-list">
          <li>
            <ExternalLink href={oileainLinks.site.url}>{oileainLinks.site.label}</ExternalLink>, the guide’s own website.
          </li>
          <li>
            <ExternalLink href={oileainLinks.club.url}>{oileainLinks.club.label}</ExternalLink>: the club publishes Dublin-area extracts by permission of the author, under Resources, Trip Planning.
          </li>
        </ul>
      </section>
      <SourceList ids={['oileain', 'shearwater']} />
    </div>
  );
}
