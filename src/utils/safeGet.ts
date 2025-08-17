/**
 * Production-safe: strict, tiny helper for optional/unknown shapes.
 * Note: Keep behavior identical to original getProp<T> in PDFReport.tsx.
 */
export function getProp<T>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
}
