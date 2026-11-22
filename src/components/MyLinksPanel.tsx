import { ButtonLink, ExternalLink } from './ui';
import { categoryLabel, linkLabel, linksIn, siteName, type LinkCategory, type LinkEntry } from '../content/links';
import { usePersisted } from '../hooks/usePersisted';

/**
 * The links a member filed under one section, shown at the bottom of that section's page. Read only here; adding, changing and
 * deleting happen on the My links page. Nothing is written by this panel.
 */
export function MyLinksPanel({ category }: { category: LinkCategory }) {
  const { value, ready, state } = usePersisted<LinkEntry[]>('links', []);
  const mine = linksIn(value, category);

  return (
    <section className="block-tight my-links" aria-labelledby={`my-links-${category}`}>
      <h2 id={`my-links-${category}`}>My links: {categoryLabel(category)}</h2>
      {!ready ? (
        <p className="muted">Looking for links saved on this device…</p>
      ) : state.kind === 'unreadable' || state.kind === 'error' ? (
        <p className="muted" role="status">
          Your saved links could not be read in this browser.
        </p>
      ) : mine.length === 0 ? (
        <p className="muted">You have not saved any links here. They stay on this device.</p>
      ) : (
        <ul className="saved-list">
          {mine.map((link) => (
            <li key={link.id} className="saved-item">
              <div>
                <p className="saved-item__title">
                  <ExternalLink href={link.url}>{linkLabel(link)}</ExternalLink>
                </p>
                <p className="muted">{siteName(link.url)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p>
        <ButtonLink to="/trip-planning/links" size="small">
          {mine.length === 0 ? 'Add a link' : 'Add or change links'}
        </ButtonLink>
      </p>
    </section>
  );
}
