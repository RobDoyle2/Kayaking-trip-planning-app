import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePath } from '../../router/Router';

interface AssistantState {
  open: boolean;
  /** Text typed on the home screen, carried into the assistant when it opens. */
  seed: string;
  openAssistant: (seed?: string) => void;
  closeAssistant: () => void;
}

const AssistantContext = createContext<AssistantState | null>(null);

/**
 * The assistant is open only for the page it was opened on, so any change of page (link, Back, Forward)
 * closes it in the same render. Must be used inside <Router>.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const path = usePath();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [seed, setSeed] = useState('');

  const openAssistant = useCallback(
    (text = '') => {
      setSeed(text);
      setOpenedAt(path);
    },
    [path],
  );
  const closeAssistant = useCallback(() => setOpenedAt(null), []);

  const open = openedAt === path;
  const value = useMemo(() => ({ open, seed, openAssistant, closeAssistant }), [open, seed, openAssistant, closeAssistant]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantState {
  const value = useContext(AssistantContext);
  if (!value) throw new Error('AssistantProvider is missing.');
  return value;
}
