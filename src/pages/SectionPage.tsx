import { MyLinksPanel } from '../components/MyLinksPanel';
import { SectionCard } from '../components/SectionCard';
import { Notice, PageHeader, StatusBadge, ButtonLink } from '../components/ui';
import { club } from '../clubs';
import type { LinkCategory } from '../content/links';
import { BUILD_STAGE, sectionsForClub, type Section } from '../content/sections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Sections whose page shows the member's own links for the matching category. */
const linkCategoryFor: Partial<Record<Section['id'], LinkCategory>> = {
  'trip-planning': 'trip-planning',
  leadership: 'leadership',
  training: 'training',
};

/** Every section page is built from the same registry entry, so the six sections stay consistent. */
export function SectionPage({ section }: { section: Section }) {
  useDocumentTitle(section.title);

  const blocked = section.items.filter((item) => item.status === 'blocked').length;
  const all = sectionsForClub(club.enabledSections);
  const parent = section.parent ? all.find((s) => s.id === section.parent) : undefined;
  const children = all.filter((s) => s.parent === section.id).sort((a, b) => (a.parentOrder ?? 0) - (b.parentOrder ?? 0));
  const linkCategory = linkCategoryFor[section.id];

  return (
    <div className="container page">
      <PageHeader title={section.title} intro={section.intro} icon={section.icon} crumb={parent ? { label: parent.title, to: parent.path } : { label: 'Home', to: '/' }} />

      {children.length > 0 && (
        <section className="block-tight" aria-labelledby="inside-title">
          <h2 id="inside-title">Radio, tides and navigation</h2>
          <ul className="card-grid">
            {children.map((child) => (
              <li key={child.id}>
                <SectionCard section={child} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      {section.stage <= BUILD_STAGE ? (
        <Notice title="Built, but not yet approved by the club">
          Items marked Preview are built and usable, but their content has not been approved by the club.
          {blocked > 0 ? ` ${blocked === 1 ? 'One item is' : `${blocked} items are`} blocked until a document or answer arrives; the reason is given on each.` : ''}
        </Notice>
      ) : (
        <Notice title={`Tools for this section arrive in Stage ${section.stage}`}>
          {blocked > 0
            ? `Below is what is planned. ${blocked === 1 ? 'One item is' : `${blocked} items are`} blocked and cannot be built until a document or answer arrives; the reason is given on each.`
            : 'Below is what is planned. Each item shows its status.'}
        </Notice>
      )}

      <ul className="item-list">
        {section.items.map((item) => (
          <li key={item.id} className={`item-card item-card--${item.status}`}>
            <div className="item-card__head">
              <h2>{item.title}</h2>
              <StatusBadge item={item} />
            </div>
            <p>{item.summary}</p>
            {item.blockedBy && (
              <p className="item-card__blocked">
                <strong>Waiting on:</strong> {item.blockedBy}
              </p>
            )}
            {item.note && <p className="item-card__note">{item.note}</p>}
            {item.href && (
              <div className="item-card__action">
                <ButtonLink to={item.href} size="small">
                  {item.status === 'planned' ? 'See the placeholder page' : 'Open'}
                </ButtonLink>
              </div>
            )}
          </li>
        ))}
      </ul>

      {linkCategory && <MyLinksPanel category={linkCategory} />}
    </div>
  );
}
