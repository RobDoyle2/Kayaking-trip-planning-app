import { useRef, useState, type FormEvent } from 'react';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { MAX_FIELD_LENGTH } from '../../components/forms/fields';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { Button, ExternalLink, Notice, PageHeader } from '../../components/ui';
import {
  isLinkCategory,
  linkCategories,
  linkLabel,
  linksIn,
  MAX_DESCRIPTION_LENGTH,
  MAX_LINKS,
  MAX_URL_LENGTH,
  newLinkId,
  normaliseUrl,
  siteName,
  type LinkCategory,
  type LinkEntry,
} from '../../content/links';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';
import { Link } from '../../router/Router';

/** Long notes are cut in buttons and questions so they cannot push the page wider than the screen. */
const shorten = (text: string) => (text.length > 40 ? `${text.slice(0, 40)}…` : text);

/**
 * My links: save a web address with a note of your own and a category. The links are kept in this browser only, like trip plans,
 * and each one also shows on the page for its category (Trip Planning, Leadership or Training and Skills). The app never
 * visits the address, so it cannot say whether the page still exists.
 */
export function LinksPage() {
  useDocumentTitle('My links');
  const { value, setValue, state, ready, saveNow } = usePersisted<LinkEntry[]>('links', []);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LinkCategory>('trip-planning');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const [message, setMessage] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);
  const links: LinkEntry[] = value;
  const editing = editingId !== null;

  const reset = () => {
    setAddress('');
    setDescription('');
    setEditingId(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const result = normaliseUrl(address);
    if (!result.ok) {
      setProblem(result.message);
      addressRef.current?.focus();
      return;
    }
    const note = description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
    if (editingId) {
      setValue((prev) => prev.map((l) => (l.id === editingId ? { ...l, url: result.url, description: note, category } : l)));
      setMessage('Changes saved.');
    } else {
      if (links.length >= MAX_LINKS) {
        setProblem(`This device already holds ${MAX_LINKS} links. Delete one before adding another.`);
        return;
      }
      const entry: LinkEntry = { id: newLinkId(), url: result.url, description: note, category, addedAt: new Date().toISOString() };
      setValue((prev) => [...prev, entry]);
      setMessage(`Added “${shorten(linkLabel(entry))}” under ${linkCategories.find((c) => c.id === category)?.label}.`);
    }
    saveNow();
    setProblem('');
    reset();
    addressRef.current?.focus();
  };

  const startEdit = (link: LinkEntry) => {
    setEditingId(link.id);
    setAddress(link.url);
    setDescription(link.description);
    setCategory(link.category);
    setProblem('');
    setMessage('');
    addressRef.current?.focus();
    addressRef.current?.scrollIntoView({ block: 'center' });
  };

  const remove = (link: LinkEntry) => {
    setValue((prev) => prev.filter((l) => l.id !== link.id));
    saveNow();
    if (editingId === link.id) reset();
    setMessage(`Deleted “${shorten(linkLabel(link))}”.`);
  };

  return (
    <div className="container page">
      <PageHeader
        title="My links"
        icon="trip"
        intro="Keep the web addresses you use, with a note of your own, and file each under a section."
        crumb={{ label: 'Trip Planning', to: '/trip-planning' }}
      />

      <Notice title="Kept on this device only">
        Your links are saved in this browser, like your trip plans. They are not shared with the club and do not appear on other devices unless you use{' '}
        <Link to="/my-plans">My plans</Link> to download them and import the file there. The app does not visit the address, so it cannot tell you whether a page still exists.
      </Notice>

      <SaveStatus state={state} />

      <form className="links-form" onSubmit={submit} noValidate aria-labelledby="links-form-title">
        <h2 id="links-form-title">{editing ? 'Change this link' : 'Add a link'}</h2>

        <div className="field">
          <label className="field__label" htmlFor="link-address">
            Web address <span className="field__needed">(needed)</span>
          </label>
          <p className="field__hint" id="link-address-hint">
            For example www.canoe.ie. If you leave off https://, the app adds it.
          </p>
          <input
            id="link-address"
            ref={addressRef}
            className="input"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            maxLength={MAX_URL_LENGTH}
            value={address}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? 'link-address-hint link-problem' : 'link-address-hint'}
            onChange={(event) => setAddress(event.target.value)}
          />
          {problem && (
            <p id="link-problem" className="field-error" role="alert">
              {problem}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="link-description">
            Your note about it
          </label>
          <p className="field__hint" id="link-description-hint">
            Optional. Shown as the link. If you leave it empty, the website name is shown.
          </p>
          <input
            id="link-description"
            className="input"
            type="text"
            autoComplete="off"
            maxLength={Math.min(MAX_DESCRIPTION_LENGTH, MAX_FIELD_LENGTH)}
            value={description}
            aria-describedby="link-description-hint"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="link-category">
            Section
          </label>
          <select
            id="link-category"
            className="input input--short"
            value={category}
            onChange={(event) => {
              if (isLinkCategory(event.target.value)) setCategory(event.target.value);
            }}
          >
            {linkCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="links-form__actions">
          <Button type="submit" size="large" disabled={!ready || state.kind === 'error'}>
            {editing ? 'Save changes' : 'Add link'}
          </Button>
          {editing && (
            <Button
              variant="secondary"
              size="large"
              onClick={() => {
                reset();
                setProblem('');
              }}
            >
              Cancel
            </Button>
          )}
        </p>
        {state.kind === 'error' && <p className="muted">Adding links is switched off because this browser is not letting the app save, and a link that cannot be saved would be lost as soon as you leave.</p>}
      </form>

      <p className="export-bar__message" role="status">
        {message}
      </p>

      <section className="block-tight" aria-labelledby="links-saved">
        <h2 id="links-saved">Your links ({links.length})</h2>
        {!ready ? (
          <p className="muted">Looking for links saved on this device…</p>
        ) : links.length === 0 ? (
          <p className="muted">No links are saved on this device yet.</p>
        ) : (
          linkCategories.map((c) => {
            const mine = linksIn(links, c.id);
            if (mine.length === 0) return null;
            return (
              <section key={c.id} className="links-group" aria-labelledby={`links-${c.id}`}>
                <h3 id={`links-${c.id}`}>
                  {c.label} ({mine.length})
                </h3>
                <ul className="saved-list">
                  {mine.map((link) => (
                    <li key={link.id} className="saved-item">
                      <div>
                        <p className="saved-item__title">
                          <ExternalLink href={link.url}>{linkLabel(link)}</ExternalLink>
                        </p>
                        <p className="muted">{siteName(link.url)}</p>
                      </div>
                      <Button variant="secondary" size="small" aria-label={`Change ${shorten(linkLabel(link))}`} onClick={() => startEdit(link)}>
                        Change
                      </Button>
                      <ConfirmButton
                        label="Delete"
                        ariaLabel={`Delete ${shorten(linkLabel(link))}`}
                        question={`Delete “${shorten(linkLabel(link))}”?`}
                        confirmLabel="Yes, delete it"
                        onConfirm={() => remove(link)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </section>
    </div>
  );
}
