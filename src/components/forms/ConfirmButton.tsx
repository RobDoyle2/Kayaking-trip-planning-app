import { useState } from 'react';
import { Button } from '../ui';

interface Props {
  label: string;
  /** A fuller name for screen readers, when the visible label is short. It should start with the visible label. */
  ariaLabel?: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/** A two-step button for anything that deletes work: ask, then do. Keeps focus handling simple and works with a screen reader. */
export function ConfirmButton({ label, ariaLabel, question, confirmLabel, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="secondary" aria-label={ariaLabel} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <span className="confirm" role="group" aria-label={question}>
      <span className="confirm__question">{question}</span>
      <Button
        variant="danger"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        Keep it
      </Button>
    </span>
  );
}
