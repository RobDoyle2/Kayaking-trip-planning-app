import { useCallback, useEffect, useRef, useState } from 'react';
import { club } from '../clubs';
import { defById, storageKey } from '../lib/savedItems';
import { browserStore, readSaved, removeSaved, writeFailureMessage, writeSaved, type KeyValueStore } from '../lib/storage';

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'loaded'; savedAt: string }
  | { kind: 'saved'; savedAt: string }
  | { kind: 'unreadable' }
  | { kind: 'error'; message: string };

/**
 * State that is saved on this device as the user changes it, and restored when they come back.
 * Nothing is written until the user changes something, and nothing leaves the browser.
 * `id` must be one of the entries in savedItemDefs, which is what makes the data listable, exportable and deletable.
 */
export function usePersisted<T>(id: string, initial: T) {
  const def = defById(id);
  if (!def) throw new Error(`"${id}" is not in the saved items list (src/lib/savedItems.ts).`);
  const key = storageKey(club.slug, id);

  const storeRef = useRef<KeyValueStore | null | undefined>(undefined);
  const getStore = useCallback(() => {
    if (storeRef.current === undefined) storeRef.current = browserStore();
    return storeRef.current;
  }, []);

  const initialRef = useRef(initial);
  const [value, setValueState] = useState<T>(initial);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const latest = useRef<T>(initial);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Restore what was saved earlier.
  useEffect(() => {
    const result = readSaved(getStore(), key, def.version, (d): d is T => def.isValid(d));
    if (result.status === 'ok') {
      latest.current = result.saved.data;
      setValueState(result.saved.data);
      setState({ kind: 'loaded', savedAt: result.saved.savedAt });
    } else if (result.status === 'corrupt' || result.status === 'newer') {
      setState({ kind: 'unreadable' });
    } else if (result.status === 'unavailable') {
      setState({ kind: 'error', message: writeFailureMessage('unavailable') });
    }
  }, [key, def, getStore]);

  const flush = useCallback(() => {
    if (!dirty.current) return;
    window.clearTimeout(timer.current);
    dirty.current = false;
    const result = writeSaved(getStore(), key, def.version, latest.current);
    setState(result.ok ? { kind: 'saved', savedAt: result.savedAt } : { kind: 'error', message: writeFailureMessage(result.reason) });
  }, [key, def, getStore]);

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(latest.current) : next;
      latest.current = resolved;
      setValueState(resolved);
      dirty.current = true;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 400);
    },
    [flush],
  );

  // Save straight away if the user leaves the page or closes the tab before the short delay has passed.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      flush();
    };
  }, [flush]);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    dirty.current = false;
    removeSaved(getStore(), key);
    latest.current = initialRef.current;
    setValueState(initialRef.current);
    setState({ kind: 'idle' });
  }, [key, getStore]);

  return { value, setValue, state, clear };
}
