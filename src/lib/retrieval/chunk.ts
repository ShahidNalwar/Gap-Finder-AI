export type TextPage = { page: number; text: string };
export type TextChunk = { content: string; section: string };

const TARGET = 800;
const OVERLAP = 100;

export function chunkText(pages: TextPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chapter = "";
  let heading = "";
  let buffer = "";
  let section = "";

  function flush() {
    const content = buffer.trim();
    if (content) chunks.push({ content, section });
    buffer = "";
  }

  for (const page of pages) {
    // Never overlap across pages or headings: a citation must identify its text.
    flush();
    section = heading || chapter || `page ${page.page}`;
    for (const raw of page.text.replace(/\r/g, "").replace(/\0/g, "").split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const isChapter = /^(?:chapter|unit)\s+\S+/i.test(line);
      const isSection = /^(?:section\s+\S+|#{1,6}\s+|\d+(?:\.\d+)*[.)]?\s+\S)/i.test(line);
      if (line.length < 160 && (isChapter || isSection)) {
        flush();
        if (isChapter) { chapter = line; heading = ""; }
        else heading = chapter ? `${chapter}, ${line}` : line;
        section = heading || chapter;
        continue;
      }
      const sentences = line.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [line];
      for (const sentence of sentences) {
        let remaining = sentence.trim();
        while (remaining) {
          if (buffer.length + remaining.length + 1 <= TARGET) {
            buffer += `${buffer ? " " : ""}${remaining}`;
            break;
          }
          if (buffer) {
            const previous = buffer;
            flush();
            const tail = previous.slice(-OVERLAP);
            const boundary = tail.indexOf(" ");
            buffer = boundary >= 0 ? tail.slice(boundary + 1) : "";
          }
          if (remaining.length + buffer.length + 1 > TARGET) {
            const space = remaining.lastIndexOf(" ", TARGET - buffer.length - 1);
            const cut = space > 0 ? space : TARGET - buffer.length - 1;
            buffer += `${buffer ? " " : ""}${remaining.slice(0, cut)}`;
            remaining = remaining.slice(cut).trim();
          }
        }
      }
    }
  }
  flush();
  return chunks;
}
