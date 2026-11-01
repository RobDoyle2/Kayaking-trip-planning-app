import type { ReactNode } from 'react';

interface BaseProps {
  id: string;
  label: string;
  hint?: string | undefined;
  /** Needed for a complete result. Shown as words, not just a symbol. */
  needed?: boolean;
}

function describedBy(id: string, hint?: string): string | undefined {
  return hint ? `${id}-hint` : undefined;
}

function Label({ id, label, needed }: Pick<BaseProps, 'id' | 'label' | 'needed'>) {
  return (
    <label className="field__label" htmlFor={id}>
      {label}
      {needed && <span className="field__needed"> (needed)</span>}
    </label>
  );
}

function Hint({ id, hint }: Pick<BaseProps, 'id' | 'hint'>) {
  return hint ? (
    <p className="field__hint" id={`${id}-hint`}>
      {hint}
    </p>
  ) : null;
}

interface TextProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const MAX_FIELD_LENGTH = 500;
export const MAX_LONG_FIELD_LENGTH = 3000;

export function TextField({ id, label, hint, needed, value, onChange, maxLength = MAX_FIELD_LENGTH }: TextProps) {
  return (
    <div className="field">
      <Label id={id} label={label} needed={needed} />
      <Hint id={id} hint={hint} />
      <input
        id={id}
        className="input"
        type="text"
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        aria-describedby={describedBy(id, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TimeField({ id, label, hint, needed, value, onChange }: TextProps) {
  return (
    <div className="field">
      <Label id={id} label={label} needed={needed} />
      <Hint id={id} hint={hint} />
      <input
        id={id}
        className="input input--short"
        type="time"
        value={value}
        aria-describedby={describedBy(id, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TextAreaField({ id, label, hint, needed, value, onChange, maxLength = MAX_LONG_FIELD_LENGTH }: TextProps) {
  return (
    <div className="field">
      <Label id={id} label={label} needed={needed} />
      <Hint id={id} hint={hint} />
      <textarea
        id={id}
        className="input"
        rows={3}
        value={value}
        maxLength={maxLength}
        aria-describedby={describedBy(id, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

interface CheckProps {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  describedById?: string;
}

export function CheckField({ id, label, checked, onChange, describedById }: CheckProps) {
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} aria-describedby={describedById} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function DateField({ id, label, hint, needed, value, onChange }: TextProps) {
  return (
    <div className="field">
      <Label id={id} label={label} needed={needed} />
      <Hint id={id} hint={hint} />
      <input
        id={id}
        className="input input--short"
        type="date"
        value={value}
        aria-describedby={describedBy(id, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
