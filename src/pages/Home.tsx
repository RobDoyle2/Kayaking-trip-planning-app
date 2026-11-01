import { useState, type FormEvent } from 'react';
import { useAssistant } from '../components/assistant/AssistantContext';
import { checkQuestion } from '../components/assistant/validate';
import { CoastalArt } from '../components/CoastalArt';
import { Icon } from '../components/Icon';
import { SectionCard } from '../components/SectionCard';
import { Badge, Button, ButtonLink, Notice } from '../components/ui';
import { club } from '../clubs';
import { sectionsForClub } from '../content/sections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Link } from '../router/Router';

export function Home() {
  useDocumentTitle();
  const { openAssistant } = useAssistant();
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty box just opens the assistant. Anything typed is checked first.
    if (question.trim() === '') {
      setError('');
      openAssistant();
      return;
    }
    const check = checkQuestion(question);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError('');
    openAssistant(check.text);
  }

  return (
    <>
      <section className="hero" aria-labelledby="home-title">
        <CoastalArt />
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">{club.name}</p>
            <h1 id="home-title">{club.appName}</h1>
            <p className="lead">{club.tagline}</p>

            <form className="ask" onSubmit={ask} noValidate>
              <label htmlFor="home-ask" className="ask__label">
                <span>{club.assistantName}</span>
                <Badge tone="notice">Not connected yet</Badge>
              </label>
              <div className="ask__row">
                <input
                  id="home-ask"
                  type="text"
                  autoComplete="off"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'home-ask-error' : 'home-ask-hint'}
                  placeholder="Type a question"
                />
                <Button type="submit">Ask</Button>
              </div>
              {error ? (
                <p id="home-ask-error" className="field-error" role="alert">
                  {error}
                </p>
              ) : (
                <p id="home-ask-hint" className="ask__hint">
                  The assistant window is built but not yet connected, so it cannot answer. That arrives in Stage 6.
                </p>
              )}
            </form>

            <div className="hero__actions">
              <ButtonLink href={club.website.url} variant="secondary">
                Visit the club website
              </ButtonLink>
              <ButtonLink to="/emergency" variant="secondary">
                <Icon name="alert" size={18} />
                Emergency card
              </ButtonLink>
            </div>
          </div>

          <div className="hero__logo">
            <img src={club.logo.src} alt={club.logo.alt} width={club.logo.width} height={club.logo.height} />
          </div>
        </div>
      </section>

      <section className="container block" aria-labelledby="sections-title">
        <h2 id="sections-title">Six sections</h2>
        <ul className="card-grid">
          {sectionsForClub(club.enabledSections).map((section) => (
            <li key={section.id}>
              <SectionCard section={section} />
            </li>
          ))}
        </ul>
      </section>

      <section className="container block">
        <Notice title="Build status: Stage 2 of 6">
          The framework and the Leadership tools are built. The other sections list what is planned and what is waiting on a
          document, and every item carries a status label so unfinished features do not look finished. See{' '}
          <Link to="/sources">Sources and limits</Link> for what the app can and cannot do.
        </Notice>
      </section>
    </>
  );
}
