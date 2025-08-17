export function parseStrict<T = unknown>(
  answer: string,
  key: string
): T | null {
  try {
    const obj = JSON.parse(answer) as unknown;
    if (obj && typeof obj === 'object') {
      const val = (obj as Record<string, unknown>)[key];
      return typeof val === 'undefined' ? null : (val as T | null);
    }
    return null;
  } catch {
    return null;
  }
}
