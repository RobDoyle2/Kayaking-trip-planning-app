import { club } from '../../clubs';
import { Link } from '../../router/Router';
import { Icon } from '../Icon';

interface HeaderProps {
  menuOpen: boolean;
  onMenu: () => void;
}

export function Header({ menuOpen, onMenu }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button
          type="button"
          className="icon-btn"
          aria-label="Open the menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-haspopup="dialog"
          onClick={onMenu}
        >
          <Icon name="menu" />
        </button>

        <Link to="/" className="brand">
          <img className="brand__logo" src={club.logo.src} alt="" width={club.logo.width} height={club.logo.height} />
          <span className="brand__text">
            <span className="brand__title">{club.appName}</span>
            <span className="brand__club">{club.name}</span>
          </span>
        </Link>

        <a className="header-link" href={club.website.url} target="_blank" rel="noopener noreferrer">
          <span>{club.website.label}</span>
          <Icon name="external" size={16} />
          <span className="sr-only"> (club website, opens in a new tab)</span>
        </a>
      </div>
    </header>
  );
}
