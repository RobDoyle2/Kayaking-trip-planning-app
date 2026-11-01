import type { ReactNode } from 'react';
import { equipmentChecklist, leaderChecklist } from './content/leadership/checklists';
import { groupGuide, preparingGuide, responsibilitiesGuide } from './content/leadership/guides';
import { ChecklistPage } from './pages/leadership/ChecklistPage';
import { GuidePage } from './pages/leadership/GuidePage';
import { ReviewPage } from './pages/leadership/ReviewPage';
import { RiskPage } from './pages/leadership/RiskPage';
import { SheetsPage } from './pages/leadership/SheetsPage';

/** Pages built so far, by path. Section pages and the fixed pages are handled in App.tsx. */
export const toolRoutes: Record<string, () => ReactNode> = {
  '/leadership/preparing': () => <GuidePage guide={preparingGuide} />,
  '/leadership/responsibilities': () => <GuidePage guide={responsibilitiesGuide} />,
  '/leadership/group': () => <GuidePage guide={groupGuide} />,
  '/leadership/checklist': () => <ChecklistPage def={leaderChecklist} savedId="leader-checklist" />,
  '/leadership/equipment': () => <ChecklistPage def={equipmentChecklist} savedId="equipment-checklist" />,
  '/leadership/sheets': () => <SheetsPage />,
  '/leadership/risk': () => <RiskPage />,
  '/leadership/review': () => <ReviewPage />,
};
