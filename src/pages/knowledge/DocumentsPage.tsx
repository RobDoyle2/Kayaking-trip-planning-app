import { useEffect, useState } from 'react';
import { ExternalLink, Notice, PageHeader } from '../../components/ui';
import { approvalLabel, referenceDocuments } from '../../content/documents';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { KnowledgeBase } from '../../knowledge/collect';
import { Link } from '../../router/Router';

/** Which documents the assistant draws on, how each was read, and whether the club has approved it (none yet). */
export function DocumentsPage() {
  useDocumentTitle('What the documents cover');
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  useEffect(() => {
    let live = true;
    import('../../knowledge/kb.json').then((m) => live && setKb((m.default ?? m) as unknown as KnowledgeBase)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const count = (key: string) => kb?.passages.filter((p) => p.docs.includes(key)).length ?? 0;
  return (
    <div className="container page">
      <PageHeader
        title="What the documents cover"
        icon="book"
        intro="The sources the assistant draws on, how each was read, and what is not covered."
        crumb={{ label: 'Knowledge Centre', to: '/knowledge' }}
      />
      <Notice tone="warning" title="No document has been approved by the club yet">
        The assistant’s library is made from the app’s own sourced pages, which paraphrase the documents and web pages supplied to this project. Nothing in it has been approved by the ECSKC
        committee, so every answer says so. Who approves documents, and when, is still to be decided by the club.
      </Notice>

      <section aria-labelledby="cited-title">
        <h2 id="cited-title">Sources the library cites</h2>
        {!kb ? (
          <p className="muted" role="status">
            Loading…
          </p>
        ) : (
          <ul className="item-list">
            {Object.entries(kb.docs).map(([key, d]) => (
              <li key={key} className="item-card">
                <div className="item-card__head">
                  <h3>{d.short}</h3>
                  <span className="badge badge--notice">Not approved yet</span>
                </div>
                <p>{d.title}</p>
                <p className="muted">How it was read: {d.howRead}</p>
                <p className="muted">
                  {count(key)} {count(key) === 1 ? 'passage' : 'passages'} in the library.{' '}
                  {d.url ? <ExternalLink href={d.url}>Open the source</ExternalLink> : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="supplied-title" className="block-tight">
        <h2 id="supplied-title">Documents supplied to the project</h2>
        <p className="muted">Some were read directly and some only through the project’s notes. A few are not used in the library at all, for example the Chart 5011 key (Crown copyright).</p>
        <ul className="plain-list">
          {referenceDocuments.map((d) => (
            <li key={d.id}>
              <strong>{d.title}</strong>, {d.publisher}. {d.version}. Status: {approvalLabel(d.approval)}.
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="gaps-title" className="block-tight">
        <h2 id="gaps-title">What the library does not cover</h2>
        <p>
          The assistant says so when it meets one of these, using the library’s own “not covered” notes: skill descriptions, radio procedures, control areas and the station map, the Oileáin
          high-water allowance, a camping kit list, the club’s risk assessment template, what to tell the Coast Guard, and live weather, tides or radio information. See{' '}
          <Link to="/sources">Sources and limits</Link>.
        </p>
      </section>
    </div>
  );
}
