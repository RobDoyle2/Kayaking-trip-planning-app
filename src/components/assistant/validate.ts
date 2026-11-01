export const MAX_QUESTION_LENGTH = 500;

export type QuestionCheck = { ok: true; text: string } | { ok: false; message: string };

/** Checks a typed question before it is used. The same rules will apply on the server in Stage 6. */
export function checkQuestion(raw: string): QuestionCheck {
  // Remove control characters (keeping tab and newline) and collapse runs of blank space.
  const text = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (text.length === 0) return { ok: false, message: 'Type a question first.' };
  if (text.length > MAX_QUESTION_LENGTH) {
    return { ok: false, message: `Please keep the question under ${MAX_QUESTION_LENGTH} characters (it is ${text.length}).` };
  }
  return { ok: true, text };
}
