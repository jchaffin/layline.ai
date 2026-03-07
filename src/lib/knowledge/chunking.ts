export interface TextChunk {
  index: number;
  text: string;
}

interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1400;
const DEFAULT_OVERLAP = 200;

function findNaturalBreak(text: string, start: number, maxEnd: number): number {
  const window = text.slice(start, maxEnd);
  const candidates = ["\n\n", "\n", ". ", " "];

  for (const candidate of candidates) {
    const idx = window.lastIndexOf(candidate);
    if (idx > DEFAULT_OVERLAP) {
      return start + idx + candidate.length;
    }
  }

  return maxEnd;
}

export function chunkText(
  input: string,
  options: ChunkTextOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;
  const text = input.trim();

  if (!text) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [{ index: 0, text }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const maxEnd = Math.min(text.length, start + chunkSize);
    const end =
      maxEnd < text.length ? findNaturalBreak(text, start, maxEnd) : maxEnd;
    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push({ index, text: chunk });
      index += 1;
    }

    if (end >= text.length) {
      break;
    }

    const nextStart = Math.max(end - overlap, start + 1);
    start = nextStart;
  }

  return chunks;
}
