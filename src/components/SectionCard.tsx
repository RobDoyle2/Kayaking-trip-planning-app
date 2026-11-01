import { Link } from '../router/Router';
import { Icon } from './Icon';
import { BUILD_STAGE, type Section } from '../content/sections';

/** One of the six main sections, as shown on the home screen. */
export function SectionCard({ section }: { section: Section }) {
  return (
    <Link to={section.path} className="section-card">
      <span className="section-card__icon">
        <Icon name={section.icon} size={30} />
      </span>
      <span className="section-card__body">
        <span className="section-card__title">{section.title}</span>
        <span className="section-card__tagline">{section.tagline}</span>
        <span className="section-card__stage">
          {section.stage <= BUILD_STAGE ? 'Preview tools built' : `Tools arrive in Stage ${section.stage}`}
        </span>
      </span>
      <Icon name="arrow" size={20} className="section-card__arrow" />
    </Link>
  );
}
