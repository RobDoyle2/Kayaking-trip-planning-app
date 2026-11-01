import type { ReactNode } from 'react';
import type { IconName } from '../content/sections';

/** Simple line icons (24 by 24, stroke follows the text colour). */
const paths: Record<IconName, ReactNode> = {
  leadership: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </>
  ),
  trip: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </>
  ),
  training: <path d="M12 3l2.6 5.8 6.4.7-4.8 4.3 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.5l6.4-.7z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  radio: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M8 9l8-6" />
      <circle cx="9" cy="14.5" r="2.2" />
      <path d="M14 13h3M14 16h3" />
    </>
  ),
  book: (
    <>
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 18a2 2 0 0 1 2-2h12" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  plans: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 3h6v3H9zM9 12h6M9 16h6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l10 17H2z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-10 10" />
      <path d="M18 14v5H5V6h5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Decorative by default: the text next to an icon carries the meaning. */
export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
