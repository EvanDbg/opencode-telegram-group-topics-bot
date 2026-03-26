const MAX_STATUS_LINES = 12;
const MAX_STATUS_LENGTH = 3500;

function normalizeLine(text: string | null | undefined): string {
  return (text ?? "").trim();
}

export function buildThinkingMessage(
  thinkingText: string | null | undefined,
  updates: string[],
): string {
  const thinkingLine = normalizeLine(thinkingText);
  const normalizedUpdates = updates
    .map((update) => normalizeLine(update))
    .filter((update) => update.length > 0 && update !== thinkingLine);

  const lines = thinkingLine ? [thinkingLine, ...normalizedUpdates] : normalizedUpdates;
  const limitedLines = lines.slice(-MAX_STATUS_LINES);
  const joined = limitedLines.join("\n\n").trim();

  if (joined.length <= MAX_STATUS_LENGTH) {
    return joined;
  }

  return `...\n${joined.slice(-(MAX_STATUS_LENGTH - 4))}`;
}

export function hasOnlyThinkingLine(
  thinkingText: string | null | undefined,
  updates: string[],
): boolean {
  return normalizeLine(thinkingText).length > 0 && updates.length === 0;
}
