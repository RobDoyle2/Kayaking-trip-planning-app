import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '../router/Router';
import { Icon } from './Icon';
import { statusLabel, type IconName, type SectionItem, type Status } from '../content/sections';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'normal' | 'large' | 'small';

function buttonClass(variant: Variant, size: Size, extra?: string): string {
  return ['btn', `btn--${variant}`, size !== 'normal' ? `btn--${size}` : '', extra ?? ''].filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'normal', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

interface ButtonLinkProps {
  /** In-app route. */
  to?: string;
  /** Any other address: opens in a new tab with a hidden notice for screen readers. */
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ to, href, variant = 'secondary', size = 'normal', className, children }: ButtonLinkProps) {
  const cls = buttonClass(variant, size, className);
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  if (href?.startsWith('tel:')) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="external" size={18} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A link to another website. Always opens in a new tab and says so. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="ext-link">
      {children}
      <Icon name="external" size={16} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'notice' | 'good' | 'blocked'; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

const statusTone: Record<Status, 'neutral' | 'notice' | 'good' | 'blocked'> = {
  ready: 'good',
  preview: 'notice',
  planned: 'neutral',
  blocked: 'blocked',
};

export function StatusBadge({ item }: { item: Pick<SectionItem, 'status' | 'stage'> }) {
  return <Badge tone={statusTone[item.status]}>{statusLabel(item)}</Badge>;
}

interface NoticeProps {
  tone?: 'info' | 'warning';
  title: string;
  children: ReactNode;
}

/** A boxed message. Warning uses the club's alert colour and is reserved for safety or accuracy cautions. */
export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <aside className={`notice notice--${tone}`} role="note">
      <Icon name={tone === 'warning' ? 'alert' : 'info'} size={22} className="notice__icon" />
      <div>
        <p className="notice__title">{title}</p>
        <div className="notice__body">{children}</div>
      </div>
    </aside>
  );
}

interface PageHeaderProps {
  title: string;
  intro?: string;
  icon?: IconName;
  crumb?: { label: string; to: string };
}

export function PageHeader({ title, intro, icon, crumb }: PageHeaderProps) {
  return (
    <header className="page-header">
      {crumb && (
        <nav aria-label="Breadcrumb" className="crumb">
          <Link to={crumb.to}>{crumb.label}</Link>
        </nav>
      )}
      <div className="page-header__title">
        {icon && (
          <span className="page-header__icon">
            <Icon name={icon} size={30} />
          </span>
        )}
        <h1>{title}</h1>
      </div>
      {intro && <p className="lead">{intro}</p>}
    </header>
  );
}
