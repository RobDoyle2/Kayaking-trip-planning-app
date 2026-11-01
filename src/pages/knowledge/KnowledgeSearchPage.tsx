import { useEffect, useMemo, useState } from 'react';
import { TextField } from '../../components/forms/fields';
import { Button, ExternalLink, Notice, PageHeader } from '../../components/ui';
import { useAssistant } from '../../components/assistant/AssistantContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { buildIndex, search } from '../../knowledge/search.js';
import type { KnowledgeBase } from '../../knowledge/collect';
import { Link } from '../../router/Router';

/**
 * Search the assistant's library directly, with no AI and no server: the same keyword search the assistant uses to pick
 * passages, shown as passages with their sources. It works when the assistant is not switched on.
 */
export function KnowledgeSearchPage() {
  useDocumentTitle('Search the documents');
  const { openAssistant } = useAssistant();
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let live = true;
    import('../../knowledge/kb.json')
      .then((m) => live && setKb((m.default ?? m) as unknown as KnowledgeBase))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const index = useMemo(() => (kb ? buildIndex(kb.passages, kb.docs) : null), [kb]);
  const hits = useMemo(() => (index && query.trim() ? search(index, query.trim(), { limit: 12 }) : []), [index, query]);
  const searched = query.trim() !== '';

  return (
    <div className="container page">
      <PageHeader
        title="Search the documents"
        icon="book"
        intro="Look through the passages the assistant draws on. No question is sent anywhere: the search runs on your device."
        crumb={{ label: 'Knowledge Centre', to: '/knowledge' }}
      />
      <Notice title="Background reading, not approved, not live">
        These passages are paraphrased from documents supplied to this project. The ECSKC committee has not approved them, and they are not live conditions. Each result names its source,
        so check the source before you rely on it. See <Link to="/knowledge/documents">what the documents cover</Link>.
      </Notice>

      {failed ? (
        <p className="calc__result calc__result--problem" role="alert">
          The library could not be loaded. Check your connection and reload the page.
        </p>
      ) : !kb ? (
        <p className="muted" role="status">
          Loading the library…
        </p>
      ) : (
        <>
          <form onSubmit={(e) => e.preventDefault()} role="search" noValidate>
            <TextField id="kb-query" label="Search the documents" hint={`${kb.passages.length} passages from ${Object.keys(kb.docs).length} sources. For example: slack water, deep water rescue, VHF Dublin.`} value={query} onChange={setQuery} maxLength={200} />
          </form>
          <p role="status" className="muted kb-count">
            {!searched ? 'Type a word or a question to search.' : hits.length === 0 ? 'No passage matches strongly enough. Try different words.' : `${hits.length} ${hits.length === 1 ? 'passage' : 'passages'} found, best match first.`}
          </p>
          {searched && (
            <p>
              <Button variant="secondary" onClick={() => openAssistant(query.trim())}>
                Ask the Kayaking Assistant this question
              </Button>
            </p>
          )}
          <ul className="item-list">
            {hits.map((h) => (
              <li key={h.passage.id} className="item-card">
                <div className="item-card__head">
                  <h2>{h.passage.title}</h2>
                  {h.passage.kind === 'gap' && <span className="badge badge--blocked">Not covered</span>}
                </div>
                <ul className="plain-list">
                  {h.passage.blocks.slice(0, 5).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {h.passage.blocks.length > 5 && <p className="muted">…and {h.passage.blocks.length - 5} more lines on the page.</p>}
                <p className="muted">
                  {h.passage.docs.length > 0 ? (
                    <>
                      Source:{' '}
                      {h.passage.docs.map((d, i) => (
                        <span key={d}>
                          {i > 0 ? '; ' : ''}
                          {kb.docs[d]?.url ? <ExternalLink href={kb.docs[d]!.url!}>{kb.docs[d]!.short}</ExternalLink> : (kb.docs[d]?.short ?? d)}
                        </span>
                      ))}
                      {h.passage.where ? `, ${h.passage.where}` : ''}.{' '}
                    </>
                  ) : null}
                  Not yet approved by the club.
                </p>
                <p>
                  <Link to={h.passage.href}>Open the page in this app</Link>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
