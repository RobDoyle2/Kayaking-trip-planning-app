import { ButtonLink, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container page">
      <PageHeader title="Page not found" intro="There is no page at this address. It may have moved, or the link may be mistyped." />
      <ButtonLink to="/" variant="primary">
        Back to Home
      </ButtonLink>
    </div>
  );
}
