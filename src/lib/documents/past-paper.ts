export function splitPastQuestions(texts: string[]): string[] {
  const questions = new Set<string>();
  for (const text of texts) {
    const parts = text.split(/(?=\bQ\s*\d+[.)]\s)/i);
    const numbered = parts.filter((part) => /^Q\s*\d+[.)]\s/i.test(part.trim()));
    const candidates = numbered.length ? numbered : text.split(/(?=\b\d+[.)]\s)/).filter((part) => /^\d+[.)]\s/.test(part.trim()));
    for (const part of candidates) {
      const question = part.trim();
      if (question.length > 15) questions.add(question);
    }
  }
  return [...questions].slice(0, 40);
}
