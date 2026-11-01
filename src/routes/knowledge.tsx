import { DocumentsPage } from '../pages/knowledge/DocumentsPage';
import { KnowledgeSearchPage } from '../pages/knowledge/KnowledgeSearchPage';

export default function KnowledgeRoutes({ path }: { path: string }) {
  if (path === '/knowledge/search') return <KnowledgeSearchPage />;
  if (path === '/knowledge/documents') return <DocumentsPage />;
  return null;
}
