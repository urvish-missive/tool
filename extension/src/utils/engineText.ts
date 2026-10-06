/** Engine findings are prefixed with an internal rule code, e.g. "[GENERIC_BACKSTORY] Opening opens…". */
export function stripRuleCode(text: string): string {
  return text.replace(/^\[[A-Z0-9_]+\]\s*/, '').trim()
}
