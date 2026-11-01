import { Notice, PageHeader } from '../../components/ui';
import { developmentChecklists } from '../../content/training/checklists';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

export function ChecklistsIndexPage() {
  useDocumentTitle('Personal checklists');
  return (
    <div className="container page">
      <PageHeader
        title="Personal checklists"
        icon="training"
        intro="Checklists you tick off over time. They stay on this device."
        crumb={{ label: 'Training and Skills', to: '/training' }}
      />
      <Notice tone="warning" title="A private record, not an assessment">
        A tick means you have practised something or understand it. It does not mean you are qualified, assessed or ready to lead. Each line names its source.
      </Notice>
      <ul className="saved-list">
        {developmentChecklists.map((c) => (
          <li key={c.path} className="saved-item">
            <div>
              <p className="saved-item__title">
                <Link to={c.path}>{c.def.title}</Link>
              </p>
              <p className="muted">{c.blurb}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted">
        Leadership (area A of the leader checklist) is covered by the ratings on the <Link to="/training/plan">skills development plan</Link>.
      </p>
    </div>
  );
}
