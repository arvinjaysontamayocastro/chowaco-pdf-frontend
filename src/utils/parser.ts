
// utils/parser.ts
// Extracted helper functions from PDFReport.tsx

export function parseStrict(answer: string, key: string) {
  try {
    const obj = JSON.parse(answer) as unknown;
    if (obj && typeof obj === 'object') {
      const val = (obj as Record<string, unknown>)[key];
      return typeof val === 'undefined' ? null : val;
    }
    return null;
  } catch {
    return null;
  }
}

// Add more safe getters, type guards here as needed
