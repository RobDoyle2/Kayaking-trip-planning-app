import type { ReactNode } from 'react';
import { AssistantProvider } from './components/assistant/AssistantContext';
import { Layout } from './components/layout/Layout';
import { club } from './clubs';
import { sectionsForClub } from './content/sections';
import { EmergencyCard } from './pages/EmergencyCard';
import { Home } from './pages/Home';
import { MyPlans } from './pages/MyPlans';
import { NotFound } from './pages/NotFound';
import { SectionPage } from './pages/SectionPage';
import { SourcesAndLimits } from './pages/SourcesAndLimits';
import { Router, usePath } from './router/Router';
import { matchToolRoute } from './routes';

function Routes(): ReactNode {
  const path = usePath();
  if (path === '/') return <Home />;
  if (path === '/emergency') return <EmergencyCard />;
  if (path === '/sources') return <SourcesAndLimits />;
  if (path === '/my-plans') return <MyPlans />;
  const tool = matchToolRoute(path, club.enabledSections);
  if (tool) return tool;
  const section = sectionsForClub(club.enabledSections).find((s) => s.path === path);
  if (section) return <SectionPage section={section} />;
  return <NotFound />;
}

export function App() {
  return (
    <Router>
      <AssistantProvider>
        <Layout>
          <Routes />
        </Layout>
      </AssistantProvider>
    </Router>
  );
}
