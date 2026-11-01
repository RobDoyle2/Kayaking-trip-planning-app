import { useEffect, useRef, useState, type FormEvent } from 'react';
import { club } from '../../clubs';
import { findSection } from '../../content/sections';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Link, usePath } from '../../router/Router';
import { Icon } from '../Icon';
import { Button, ExternalLink, Notice } from '../ui';
import { useAssistant } from './AssistantContext';
import { checkQuestion } from './validate';

interface Message {
  id: number;
  from: 'you' | 'app';
  text: string;
}

/**
 * The assistant window. In Stage 1 it is the finished interface with no brain behind it:
 * it accepts and checks a question, then says plainly that it is not connected.
 * It never invents an answer and sends nothing over the network.
 * Stage 6 replaces the reply with a call to the server-side assistant endpoint.
 */
export function AssistantSheet() {
  const { open, seed, closeAssistant } = useAssistant();
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const path = usePath();
  const section = findSection(path);

  useFocusTrap(ref, open, closeAssistant);

  useEffect(() => {
    if (open) {
      setValue(seed);
      setError('');
    }
  }, [open, seed]);

  // Keep the newest message in view, so on a small screen the reply is not hidden below the notice.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [messages]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = checkQuestion(value);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError('');
    setMessages((current) => [
      ...current,
      { id: nextId.current++, from: 'you', text: check.text },
      {
        id: nextId.current++,
        from: 'app',
        text: 'The assistant is not connected yet, so there is no answer to give. Your question was not sent anywhere.',
      },
    ]);
    setValue('');
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
          <Notice title="Not connected yet">
            Stage 6 connects this window to the Claude assistant and the approved club documents. Until then it cannot
            answer questions, and nothing you type leaves your device.
          </Notice>

          {section && (
            <p className="sheet__context">
              You are in <strong>{section.title}</strong>. The finished assistant will use this to focus its search.
            </p>
          )}

          <div className="messages" aria-live="polite">
            {messages.map((message) => (
              <p key={message.id} className={`message message--${message.from}`}>
                <span className="message__who">{message.from === 'you' ? 'You' : 'Hub'}</span>
                {message.text}
              </p>
            ))}
          </div>

          {messages.length > 0 && (
            <p className="sheet__links">
              Meanwhile: <Link to="/emergency" onClick={closeAssistant}>Emergency card</Link>,{' '}
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
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}
