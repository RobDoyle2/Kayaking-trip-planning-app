import { SourceList } from '../../components/forms/SourceList';
import { Notice, PageHeader } from '../../components/ui';
import { sourceShort } from '../../content/leadership/sources';
import type { Guide } from '../../content/leadership/guides';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** A written guide: sections of text and lists, each saying where it comes from. */
export function GuidePage({ guide }: { guide: Guide }) {
  useDocumentTitle(guide.title);
  return (
    <div className="container page prose">
      <PageHeader title={guide.title} intro={guide.intro} icon="leadership" crumb={{ label: 'Leadership', to: '/leadership' }} />
      {guide.caution && (
        <Notice tone="warning" title="Not yet approved by the club">
          {guide.caution}
        </Notice>
      )}
      {guide.sections.map((section) => {
        const id = `g-${slug(section.heading)}`;
        return (
          <section key={section.heading} aria-labelledby={id}>
            <h2 id={id}>{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.bullets && (
              <ul className="plain-list">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {section.links && (
              <p className="link-row">
                {section.links.map((l) => (
                  <Link key={l.to} to={l.to} className="btn btn--secondary btn--small">
                    {l.label}
                  </Link>
                ))}
              </p>
            )}
            <p className="muted source-line">Source: {section.sources.map(sourceShort).join('; ')}</p>
          </section>
        );
      })}
      <SourceList ids={guide.sections.flatMap((s) => s.sources)} />
    </div>
  );
}
