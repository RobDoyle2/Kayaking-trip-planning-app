import { useEffect, useRef, useState, type FormEvent } from 'react';
import { club } from '../../clubs';
import { findSection } from '../../content/sections';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { askAssistant, type AskResult, type SourceCard } from '../../lib/assistantClient';
import { Link, usePath } from '../../router/Router';
import { Icon } from '../Icon';
import { Button, ExternalLink, Notice } from '../ui';
import { useAssistant } from './AssistantContext';
import { checkQuestion } from './validate';

type Message =
  | { id: number; from: 'you'; text: string }
  | { id: number; from: 'app'; pending: true }
  | { id: number; from: 'app'; pending?: false; result: AskResult };

function Sources({ sources, onNavigate }: { sources: SourceCard[]; onNavigate: () => void }) {
  return (
    <details className="answer__sources" open>
      <summary>
        Where this comes from ({sources.length})
      </summary>
      <ul className="plain-list">
        {sources.map((s) => (
          <li key={`${s.passageId}-${s.quote.slice(0, 20)}`} className="source-card">
            <p className="source-card__title">
              <Link to={s.href} onClick={onNavigate}>
                {s.title}
              </Link>
            </p>
            <p className="source-card__quote">{s.quote}</p>
            <p className="muted source-card__meta">
              {s.docs.length > 0 ? (
                <>
                  {s.docs.map((d, i) => (
                    <span key={d.short}>
                      {i > 0 ? '; ' : ''}
                      {d.url ? <ExternalLink href={d.url}>{d.short}</ExternalLink> : d.short}
                    </span>
                  ))}
                  {s.where ? `, ${s.where}` : ''}.{' '}
                </>
              ) : null}
              {s.approved ? 'Approved by the club.' : 'Not yet approved by the club.'}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Reply({ result, onNavigate }: { result: AskResult; onNavigate: () => void }) {
  if (result.kind === 'error') {
    return (
      <>
        <p className="answer__text">{result.message}</p>
        {result.code !== 'not_configured' && (
          <p className="muted">
            You can still <Link to="/knowledge/search" onClick={onNavigate}>search the Knowledge Centre</Link>.
          </p>
        )}
      </>
    );
  }
  return (
    <>
      <p className="answer__text">{result.kind === 'answer' ? result.answer : result.message}</p>
      {result.kind === 'answer' && <Sources sources={result.sources} onNavigate={onNavigate} />}
      {result.safetyNote && (
        <p className="safety-note" role="note">
          {result.safetyNote}
        </p>
      )}
      <p className="muted answer__notices">{result.notices.join(' ')}</p>
      {result.kind === 'not_found' && (
        <p className="muted">
          <Link to="/knowledge/search" onClick={onNavigate}>Search the Knowledge Centre</Link> or see <Link to="/knowledge/documents" onClick={onNavigate}>what the documents cover</Link>.
        </p>
      )}
    </>
  );
}

export function AssistantSheet() {
  const { open, seed, closeAssistant } = useAssistant();
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const controller = useRef<AbortController | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [waiting, setWaiting] = useState(false);
  const path = usePath();
  const section = findSection(path);

  useFocusTrap(ref, open, closeAssistant);

  useEffect(() => {
    if (open) {
      setValue(seed);
      setError('');
    }
  }, [open, seed]);

  // Closing the window, or leaving the page, stops a question that is still waiting for its answer.
  useEffect(() => {
    if (!open) {
      controller.current?.abort();
      controller.current = null;
    }
  }, [open]);

  // Bring the newest message into view from its first line, so a long answer is read from the top and not from its last lines.
  useEffect(() => {
    const body = bodyRef.current;
    const last = body?.querySelector('.messages')?.lastElementChild;
    if (body && last) body.scrollTop = last.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
  }, [messages]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (waiting) return;
    const check = checkQuestion(value);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError('');
    const pendingId = nextId.current++;
    setMessages((current) => [...current, { id: nextId.current++, from: 'you', text: check.text }, { id: pendingId, from: 'app', pending: true }]);
    setValue('');
    setWaiting(true);
    const abort = new AbortController();
    controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 40_000);
    try {
      const result = await askAssistant(check.text, section?.path, abort.signal);
      setMessages((current) => current.map((m) => (m.id === pendingId ? { id: pendingId, from: 'app', result } : m)));
    } catch {
      // Aborted: the window was closed, or the wait was too long.
      setMessages((current) =>
        current.map((m) =>
          m.id === pendingId ? { id: pendingId, from: 'app', result: { kind: 'error', code: 'network', message: 'The assistant took too long to answer, so the question was stopped. Please try again.' } } : m,
        ),
      );
    } finally {
      window.clearTimeout(timer);
      if (controller.current === abort) controller.current = null;
      setWaiting(false);
    }
  }

  return (
    <div className="backdrop" onClick={closeAssistant}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        ref={ref}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 id="assistant-title">{club.assistantName}</h2>
          <button type="button" className="icon-btn" aria-label="Close the assistant" onClick={closeAssistant}>
            <Icon name="close" />
          </button>
        </header>

        <div className="sheet__body" ref={bodyRef}>
          <Notice title="How answers are made">
            Your question is sent to this app’s server and to Anthropic’s Claude, which writes an answer using only passages from the documents supplied to this project. Each
            answer shows the passages it rests on. They are paraphrased notes that the club has not approved, and they are not live conditions. Please do not type names or personal details.
          </Notice>

          {section && (
            <p className="sheet__context">
              You are in <strong>{section.title}</strong>. The assistant searches the whole library and gives matches from this section a little more weight.
            </p>
          )}

          <div className="messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`message message--${message.from}`}>
                <span className="message__who">{message.from === 'you' ? 'You' : 'Hub'}</span>
                {message.from === 'you' ? (
                  message.text
                ) : message.pending ? (
                  <span className="muted">Searching the documents…</span>
                ) : (
                  <Reply result={message.result} onNavigate={closeAssistant} />
                )}
              </div>
            ))}
          </div>

          {messages.length > 0 && (
            <p className="sheet__links">
              Meanwhile: <Link to="/emergency" onClick={closeAssistant}>Emergency card</Link>,{' '}
              <Link to="/knowledge/search" onClick={closeAssistant}>Knowledge Centre search</Link>,{' '}
              <Link to="/sources" onClick={closeAssistant}>Sources and limits</Link> or{' '}
              <ExternalLink href={club.website.url}>{club.website.label}</ExternalLink>.
            </p>
          )}
        </div>

        <form className="sheet__form" onSubmit={submit} noValidate>
          <label htmlFor="assistant-question">Your question</label>
          <textarea
            id="assistant-question"
            data-autofocus
            rows={3}
            maxLength={2000}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'assistant-error' : undefined}
            placeholder="For example: What should I consider before leading a trip?"
          />
          {error && (
            <p id="assistant-error" className="field-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={waiting}>
            {waiting ? 'Searching…' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}
