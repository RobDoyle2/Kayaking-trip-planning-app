import { clockTime } from '../../lib/storage';
import type { SaveState } from '../../hooks/usePersisted';

/**
 * Tells the user, in words, whether their work is saved and where. Failures are announced at once.
 * It never says "saved" unless a save actually succeeded.
 */
export function SaveStatus({ state }: { state: SaveState }) {
  switch (state.kind) {
    case 'idle':
      return (
        <p className="save-status" role="status">
          Nothing is saved yet. Anything you type is kept on this device only.
        </p>
      );
    case 'loaded':
      return (
        <p className="save-status save-status--ok" role="status">
          Restored your earlier entries, last saved at {clockTime(state.savedAt)} on this device.
        </p>
      );
    case 'saved':
      return (
        <p className="save-status save-status--ok" role="status">
          Saved on this device at {clockTime(state.savedAt)}. It will not appear on other devices or browsers.
        </p>
      );
    case 'unreadable':
      return (
        <p className="save-status save-status--warn" role="alert">
          An earlier save could not be read, so you are starting fresh. Typing here will replace it.
        </p>
      );
    case 'error':
      return (
        <p className="save-status save-status--warn" role="alert">
          {state.message}
        </p>
      );
  }
}
