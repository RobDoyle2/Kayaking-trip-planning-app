import { CheckField } from '../../components/forms/fields';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { ExportBar } from '../../components/forms/ExportBar';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { SourceList } from '../../components/forms/SourceList';
import { Notice, PageHeader } from '../../components/ui';
import { allItems, checklistProgress, checklistText, type ChecklistDef } from '../../content/leadership/checklists';
import { sourceShort } from '../../content/leadership/sources';
import { usePersisted } from '../../hooks/usePersisted';
import type { IconName } from '../../content/sections';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

interface Props {
  def: ChecklistDef;
  /** Must match an entry in savedItemDefs. */
  savedId: string;
  /** Where the breadcrumb leads. Defaults to the Leadership section. */
  crumb?: { label: string; to: string };
  icon?: IconName;
}

export function ChecklistPage({ def, savedId, crumb = { label: 'Leadership', to: '/leadership' }, icon = 'leadership' }: Props) {
  useDocumentTitle(def.title);
  const { value, setValue, state, clear } = usePersisted<Record<string, boolean>>(savedId, {});
  const progress = checklistProgress(def, value);
  const text = checklistText(def, value);

  return (
    <div className="container page">
      <PageHeader title={def.title} intro={def.intro} icon={icon} crumb={crumb} />
      <Notice tone="warning" title="Not yet approved by the club">
        These items come from the documents named beside each one. The ECSKC committee has not yet approved them as the club’s checklist.
      </Notice>

      <div className="progress-line no-print">
        <progress max={progress.total} value={progress.done} aria-label="Items ticked" />
        <span>
          {progress.done} of {progress.total} ticked
        </span>
      </div>
      <div className="no-print">
        <SaveStatus state={state} />
      </div>

      {def.groups.map((group) => (
        <fieldset key={group.id} className="group">
          <legend>{group.title}</legend>
          <ul className="check-list">
            {group.items.map((item) => {
              const id = `${savedId}-${item.id}`;
              return (
                <li key={item.id} className="check-item">
                  <CheckField
                    id={id}
                    label={item.text}
                    checked={value[item.id] === true}
                    describedById={`${id}-src`}
                    onChange={(checked) => setValue((prev) => ({ ...prev, [item.id]: checked }))}
                  />
                  <p className="check__meta" id={`${id}-src`}>
                    Source: {sourceShort(item.source)}
                    {item.where ? `, ${item.where}` : ''}.
                    {item.link && (
                      <>
                        {' '}
                        <Link to={item.link.to} className="no-print">
                          {item.link.label}
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      <ExportBar title={def.title} text={text} />
      <div className="no-print danger-zone">
        <ConfirmButton label="Clear all ticks" question="Clear every tick on this checklist?" confirmLabel="Yes, clear them" onConfirm={clear} />
      </div>

      <SourceList ids={allItems(def).map((i) => i.source)} />
    </div>
  );
}
