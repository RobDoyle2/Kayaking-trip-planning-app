import { useRef } from 'react';
import { club } from '../../clubs';
import { sectionsForClub, type IconName } from '../../content/sections';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Link, usePath } from '../../router/Router';
import { Icon } from '../Icon';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DrawerLinkProps {
  to: string;
  icon: IconName;
  label: string;
  onNavigate: () => void;
  current: string;
}

function DrawerLink({ to, icon, label, onNavigate, current }: DrawerLinkProps) {
  const isCurrent = current === to;
  return (
    <Link to={to} className={`drawer__link${isCurrent ? ' is-current' : ''}`} aria-current={isCurrent ? 'page' : undefined} onClick={onNavigate}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </Link>
  );
}

/** The hamburger menu: home, the six sections, then the shared pages. */
export function Drawer({ open, onClose }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePath();
  useFocusTrap(ref, open, onClose);

  if (!open) return null;

  return (
    <div className="backdrop backdrop--left" onClick={onClose}>
      <div
        id="site-menu"
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        ref={ref}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer__head">
          <img className="drawer__logo" src={club.logo.src} alt={club.logo.alt} width={club.logo.width} height={club.logo.height} />
          <button type="button" className="icon-btn" aria-label="Close the menu" data-autofocus onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label="Main">
          <ul className="drawer__list">
            <li>
              <DrawerLink to="/" icon="home" label="Home" onNavigate={onClose} current={path} />
            </li>
            {sectionsForClub(club.enabledSections).map((section) => (
              <li key={section.id}>
                <DrawerLink to={section.path} icon={section.icon} label={section.title} onNavigate={onClose} current={path} />
              </li>
            ))}
          </ul>

          <p className="drawer__heading">More</p>
          <ul className="drawer__list">
            <li>
              <DrawerLink to="/my-plans" icon="plans" label="My plans" onNavigate={onClose} current={path} />
            </li>
            <li>
              <DrawerLink to="/emergency" icon="alert" label="Emergency card" onNavigate={onClose} current={path} />
            </li>
            <li>
              <DrawerLink to="/sources" icon="info" label="Sources and limits" onNavigate={onClose} current={path} />
            </li>
          </ul>
        </nav>

        <a className="drawer__site" href={club.website.url} target="_blank" rel="noopener noreferrer">
          <span>{club.name} website</span>
          <Icon name="external" size={16} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
