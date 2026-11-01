import type { ReactNode } from 'react';
import { developmentChecklists } from '../content/training/checklists';
import { trainingGuide } from '../content/training/guidance';
import { ChecklistPage } from '../pages/leadership/ChecklistPage';
import { GuidePage } from '../pages/leadership/GuidePage';
import { ChecklistsIndexPage } from '../pages/training/ChecklistsIndexPage';
import { DevelopmentPlanPage } from '../pages/training/DevelopmentPlanPage';
import { QualificationsPage } from '../pages/training/QualificationsPage';

const crumb = { label: 'Training and Skills', to: '/training' };

const pages: Record<string, () => ReactNode> = {
  '/training/guidance': () => <GuidePage guide={trainingGuide} crumb={crumb} icon="training" />,
  '/training/plan': () => <DevelopmentPlanPage />,
  '/training/checklists': () => <ChecklistsIndexPage />,
  '/training/qualifications': () => <QualificationsPage />,
  ...Object.fromEntries(
    developmentChecklists.map((c): [string, () => ReactNode] => [c.path, () => <ChecklistPage def={c.def} savedId={c.def.id} crumb={crumb} icon="training" />]),
  ),
};

export default function TrainingRoutes({ path }: { path: string }) {
  return <>{pages[path]?.() ?? null}</>;
}
