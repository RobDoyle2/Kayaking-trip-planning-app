import { Link } from '../router/Router';
import { Icon } from './Icon';
import { BUILD_STAGE, type Section } from '../content/sections';

/**
 * A section as a big button. `compact` leaves out the build-stage line, for the home screen and for the sections shown inside
 * another section's page, where it would only add words.
 */
export function SectionCard({ section, compact = false }: { section: Section; compact?: boolean }) {
  return (
    <Link to={section.path} className={`section-card${compact ? ' section-card--compact' : ''}`}>
      <span className="section-card__icon">
        <Icon name={section.icon} size={30} />
      </span>
      <span className="section-card__body">
        <span className="section-card__title">{section.title}</span>
        <span className="section-card__tagline">{section.tagline}</span>
        {!compact && (
          <span className="section-card__stage">{section.stage <= BUILD_STAGE ? 'Preview tools built' : `Tools arrive in Stage ${section.stage}`}</span>
        )}
      </span>
      <Icon name="arrow" size={20} className="section-card__arrow" />
    </Link>
  );
}
