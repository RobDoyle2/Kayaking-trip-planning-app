import type { ReactNode } from 'react';
import { SourceList } from '../../components/forms/SourceList';
import { Notice, PageHeader } from '../../components/ui';
import { sourceShort } from '../../content/leadership/sources';
import type { Guide } from '../../content/leadership/guides';
import type { IconName } from '../../content/sections';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** A written guide: sections of text and lists, each saying where it comes from. */
interface GuideProps {
  guide: Guide;
  /** Where the breadcrumb leads. Defaults to the Leadership section. */
  crumb?: { label: string; to: string };
  icon?: IconName;
  /** Extra content shown after the sections and before the source list. */
  children?: ReactNode;
}

export function GuidePage({ guide, crumb = { label: 'Leadership', to: '/leadership' }, icon = 'leadership', children }: GuideProps) {
  useDocumentTitle(guide.title);
  return (
    <div className="container page prose">
      <PageHeader title={guide.title} intro={guide.intro} icon={icon} crumb={crumb} />
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
      {children}
      <SourceList ids={guide.sections.flatMap((s) => s.sources)} />
    </div>
  );
}
