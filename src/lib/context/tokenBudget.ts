export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function trimToCharBudget(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;

  const headLength = Math.floor(maxChars * 0.62);
  const tailLength = Math.max(0, maxChars - headLength - 90);

  return `${text.slice(0, headLength)}

/* ... trimmed for context budget ... */

${text.slice(text.length - tailLength)}`;
}

export function allocateFileBudget(totalBudget: number, fileCount: number) {
  if (fileCount <= 0) return totalBudget;

  return Math.max(1200, Math.floor(totalBudget / fileCount));
}
