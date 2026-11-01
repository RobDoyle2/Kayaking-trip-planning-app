import { club } from '../../clubs';
import { Link } from '../../router/Router';
import { ExternalLink } from '../ui';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          <strong>{club.appName}</strong> for {club.name} (<ExternalLink href={club.website.url}>{club.website.label}</ExternalLink>)
        </p>
        <p>
          A planning aid. It does not replace training, a current forecast, chart work or your own judgement.{' '}
          <Link to="/sources">Sources and limits</Link>
        </p>
      </div>
    </footer>
  );
}
