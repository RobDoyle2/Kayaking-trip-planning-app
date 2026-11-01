import { useEffect } from 'react';
import { club } from '../clubs';

/** Sets the browser tab title: "Page | Sea Kayaking Hub | ECSKC". With no page name, the app name alone. */
export function useDocumentTitle(page?: string): void {
  useEffect(() => {
    const base = `${club.appName} | ${club.shortName}`;
    document.title = page ? `${page} | ${base}` : base;
  }, [page]);
}
