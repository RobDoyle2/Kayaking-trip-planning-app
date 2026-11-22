import { Button } from '../ui';
import { useAssistant } from './AssistantContext';

/** "Ask the assistant this question". Only rendered in a build with the assistant switched on (see src/features.ts). */
export function AskAssistantButton({ question }: { question: string }) {
  const { openAssistant } = useAssistant();
  return (
    <p>
      <Button variant="secondary" onClick={() => openAssistant(question)}>
        Ask the Kayaking Assistant this question
      </Button>
    </p>
  );
}
