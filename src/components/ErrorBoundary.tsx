import { Component, type ErrorInfo, type ReactNode } from 'react';
import { club } from '../clubs';

interface State {
  failed: boolean;
}

/**
 * Last line of defence: if any part of the app crashes while drawing, show a plain, helpful message instead of
 * a blank page. Technical details go to the browser console only. They are never shown on screen and never sent anywhere.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`${club.appName} could not draw a page.`, error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="container page" id="main">
        <h1>Something went wrong</h1>
        <p className="lead">
          This page could not be shown. Nothing you typed has been sent anywhere.
        </p>
        <p>
          Try reloading the page. If it keeps happening, tell the person who looks after the app which page you were on.
          You can still reach the club at{' '}
          <a href={club.website.url} target="_blank" rel="noopener noreferrer">
            {club.website.label}
          </a>
          .
        </p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </main>
    );
  }
}
