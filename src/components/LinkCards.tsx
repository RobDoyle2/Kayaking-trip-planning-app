import type { LinkCardData } from '../content/nav/weather';
import { ExternalLink } from './ui';

/** Cards that link out to a provider. Each says what it gives, what to watch for, and that it is not live in this app. */
export function LinkCards({ cards, title }: { cards: LinkCardData[]; title: string }) {
  return (
    <section className="block-tight" aria-labelledby="linkcards-title">
      <h2 id="linkcards-title">{title}</h2>
      <ul className="item-list">
        {cards.map((c) => (
          <li key={c.url} className="item-card">
            <div className="item-card__head">
              <h3>{c.name}</h3>
              <span className="badge badge--neutral">Not live here</span>
            </div>
            <p className="muted">{c.provider}</p>
            <p>{c.gives}</p>
            <p className="item-card__note">{c.caution}</p>
            <p>
              <ExternalLink href={c.url}>Open {c.name}</ExternalLink>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
