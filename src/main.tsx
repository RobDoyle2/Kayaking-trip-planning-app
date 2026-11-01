import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { club } from './clubs';
import { applyTheme } from './lib/theme';
import './styles/index.css';

applyTheme(club.theme);

const root = document.getElementById('root');
if (!root) throw new Error('The page has no #root element to start the app in.');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
