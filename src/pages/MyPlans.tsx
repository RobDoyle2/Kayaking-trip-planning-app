import { useMemo, useRef, useState } from 'react';
import { ConfirmButton } from '../components/forms/ConfirmButton';
import { Button, Notice, PageHeader } from '../components/ui';
import { club } from '../clubs';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { downloadText, safeFileName } from '../lib/files';
import { applyImport, deleteAllSaved, deleteSaved, exportAll, listSaved, parseImport } from '../lib/savedItems';
import { browserStore, clockTime } from '../lib/storage';
import { Link } from '../router/Router';

const statusText = {
  saved: 'Saved',
  empty: 'Nothing saved',
  unreadable: 'Saved data could not be read',
  unavailable: 'Browser storage is blocked',
} as const;

/** Everything the app has saved on this device: see it, download it, bring it back from a file, or delete it. */
export function MyPlans() {
  useDocumentTitle('My plans');
  const store = useMemo(() => browserStore(), []);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const items = useMemo(() => listSaved(store, club.slug), [store, refresh]);
  const savedCount = items.filter((i) => i.status === 'saved').length;

  async function onImport(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setMessage('That file is too large to be one of this app’s exports.');
      return;
    }
    const parsed = parseImport(await file.text(), club.slug);
    if (!parsed.ok) {
      setMessage(parsed.message);
    } else {
      const { written, failed } = applyImport(store, club.slug, parsed.items);
      setMessage(
        failed === 0
          ? `Imported ${written} saved ${written === 1 ? 'item' : 'items'}, replacing any saved here with the same name.`
          : `Imported ${written}, but ${failed} could not be saved: the browser refused, or it would take you over the limit of 40 trip plans.`,
      );
      setRefresh((n) => n + 1);
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <div className="container page">
      <PageHeader
        title="My plans"
        icon="plans"
        intro="Everything this app has saved on this device, in one place."
        crumb={{ label: 'Home', to: '/' }}
      />

      <Notice title="Saved on this device only">
        Your checklists, briefing, risk assessment, review, trip plans and skills development plan are kept in this browser, on this device. They are not sent to a server, so they will not
        appear on another phone, computer or browser, and clearing your browser’s data erases them. To keep a copy or move to another device, download a
        file below and import it there.
      </Notice>

      {store === null && (
        <Notice tone="warning" title="This browser is blocking saving">
          Private windows and some privacy settings stop the app saving anything. You can still fill things in and print or download them, but they will be
          lost when you leave.
        </Notice>
      )}

      <section className="block-tight" aria-labelledby="saved-title">
        <h2 id="saved-title">What is saved</h2>
        <ul className="saved-list">
          {items.map((item) => (
            <li key={item.id} className="saved-item">
              <div>
                <p className="saved-item__title">
                  <Link to={item.href}>{item.label}</Link>
                </p>
                <p className="muted">
                  {statusText[item.status]}
                  {item.status === 'saved' && item.savedAt ? `, last at ${clockTime(item.savedAt)} on ${new Date(item.savedAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                </p>
              </div>
              {(item.status === 'saved' || item.status === 'unreadable') && (
                <ConfirmButton
                  label={`Delete ${item.label}`}
                  question={`Delete the saved ${item.label}?`}
                  confirmLabel="Yes, delete it"
                  onConfirm={() => {
                    deleteSaved(store, club.slug, item.id);
                    setMessage(`Deleted the saved ${item.label}.`);
                    setRefresh((n) => n + 1);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="block-tight" aria-labelledby="move-title">
        <h2 id="move-title">Keep a copy or move to another device</h2>
        <div className="export-bar__buttons">
          <Button
            disabled={savedCount === 0}
            onClick={() => {
              const { json, count } = exportAll(store, club.slug);
              downloadText(safeFileName('sea-kayaking-hub-saved', 'json'), json, 'application/json');
              setMessage(`Downloaded a file with ${count} saved ${count === 1 ? 'item' : 'items'}.`);
            }}
          >
            Download everything
          </Button>
          <ConfirmButton
            label="Delete everything"
            question="Delete everything saved on this device?"
            confirmLabel="Yes, delete it all"
            onConfirm={() => {
              deleteAllSaved(store, club.slug);
              setMessage('Deleted everything saved on this device.');
              setRefresh((n) => n + 1);
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="import-file">
            Bring saved work back from a downloaded file
          </label>
          <p className="field__hint" id="import-file-hint">
            Choose a file you downloaded here earlier. Items in the file replace saved items with the same name on this device, except trip plans: those are added to the ones you already have, and a plan with the same identity is replaced. A file that is damaged or
            from another club is refused and nothing changes.
          </p>
          <input
            id="import-file"
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-describedby="import-file-hint"
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
        </div>
        <p className="export-bar__message" role="status">
          {message}
        </p>
      </section>
    </div>
  );
}
