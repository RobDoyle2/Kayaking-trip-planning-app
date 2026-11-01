import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { normalisePath } from './path';

/**
 * A very small history-based router (no dependency). It supports what Stage 1 needs:
 * path matching, in-app links, back/forward, and scroll reset.
 * If the app outgrows it, swap it for a library behind the same Link/usePath API.
 */

interface RouterState {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterState | null>(null);

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalisePath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalisePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) {
      window.location.assign(to);
      return;
    }
    const target = url.pathname + url.search + url.hash;
    if (options?.replace) window.history.replaceState(null, '', target);
    else window.history.pushState(null, '', target);
    setPath(normalisePath(url.pathname));
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter(): RouterState {
  const value = useContext(RouterContext);
  if (!value) throw new Error('Router is missing. Wrap the app in <Router>.');
  return value;
}

export function usePath(): string {
  return useRouter().path;
}

export function useNavigate() {
  return useRouter().navigate;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

/** An in-app link. Ordinary clicks navigate without reloading; modified clicks keep browser behaviour. */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== '_self') return;
    event.preventDefault();
    navigate(to);
  }
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
