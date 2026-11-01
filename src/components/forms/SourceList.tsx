import { leadershipSources } from '../../content/leadership/sources';
import { ExternalLink } from '../ui';

/** The sources a page used, with how each was read. Shown on every Leadership page. */
export function SourceList({ ids }: { ids: string[] }) {
  const unique = Array.from(new Set(ids)).filter((id) => leadershipSources[id]);
  if (unique.length === 0) return null;
  return (
    <section className="sources-box no-print" aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources for this page</h2>
      <ul className="plain-list">
        {unique.map((id) => {
          const s = leadershipSources[id];
          return (
            <li key={id}>
              {s.url ? <ExternalLink href={s.url}>{s.title}</ExternalLink> : s.title}. <span className="muted">{s.howRead}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
