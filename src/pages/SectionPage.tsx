import { Notice, PageHeader, StatusBadge, ButtonLink } from '../components/ui';
import { BUILD_STAGE, type Section } from '../content/sections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Every section page is built from the same registry entry, so the six sections stay consistent. */
export function SectionPage({ section }: { section: Section }) {
  useDocumentTitle(section.title);

  const blocked = section.items.filter((item) => item.status === 'blocked').length;

  return (
    <div className="container page">
      <PageHeader title={section.title} intro={section.intro} icon={section.icon} crumb={{ label: 'Home', to: '/' }} />

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
    </div>
  );
}
