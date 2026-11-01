import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePath } from '../../router/Router';
import { AssistantFab } from '../assistant/AssistantFab';
import { AssistantSheet } from '../assistant/AssistantSheet';
import { Drawer } from './Drawer';
import { Footer } from './Footer';
import { Header } from './Header';

/** The frame around every page: skip link, header, menu, content, footer and the assistant button. */
export function Layout({ children }: { children: ReactNode }) {
  const path = usePath();
  // The menu is open only for the page it was opened on, so any change of page (link, Back, Forward) closes it
  // in the same render, with no flash of the menu over the new page.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === path;
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After moving to a new page, put keyboard and screen-reader focus on the page content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [path]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header menuOpen={menuOpen} onMenu={() => setMenuOpenAt(path)} />
      <Drawer open={menuOpen} onClose={() => setMenuOpenAt(null)} />
      <main id="main" tabIndex={-1} ref={mainRef}>
        {children}
      </main>
      <Footer />
      <AssistantFab />
      <AssistantSheet />
    </>
  );
}
