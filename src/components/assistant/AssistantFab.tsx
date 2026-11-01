import { club } from '../../clubs';
import { Icon } from '../Icon';
import { useAssistant } from './AssistantContext';

/** The assistant button that stays on screen on every page. */
export function AssistantFab() {
  const { open, openAssistant } = useAssistant();
  return (
    <button type="button" className="fab" onClick={() => openAssistant()} aria-haspopup="dialog" aria-expanded={open}>
      <Icon name="chat" size={22} />
      <span className="fab__full">{club.assistantName}</span>
      <span className="fab__short">Ask the Assistant</span>
    </button>
  );
}
