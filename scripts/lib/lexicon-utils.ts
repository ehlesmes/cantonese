export interface LexiconEntry {
  char: string;
  jyutping: string;
  frequency_pm: number;
  translation: string;
}

export interface CifuEntry {
  rank: number;
  char: string;
  jyutping: string;
  frequency_pm: number;
  translation: string;
}

/**
 * Parses raw text from Cifu-v1.txt and returns the top 1000 unique entries sorted by frequency.
 */
export function parseLexicon(rawText: string): CifuEntry[] {
  const lines = rawText.split("\n");
  const entries: LexiconEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 13) continue;

    const part0 = parts[0]!;
    const part1 = parts[1]!;
    const part5 = parts[5]!;

    const char = part0.trim();
    const jyutping = part1.trim();
    const spokenAdultPm = parseFloat(part5);
    const translation = parts[12] ? parts[12].trim() : "";

    if (isNaN(spokenAdultPm)) continue;

    // Filter out punctuation-like characters or non-Chinese characters
    if (/^[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+$/.test(char)) continue;

    entries.push({
      char,
      jyutping,
      frequency_pm: spokenAdultPm,
      translation,
    });
  }

  // Sort by frequency per million in descending order
  entries.sort((a, b) => b.frequency_pm - a.frequency_pm);

  // Take the top 1000 unique entries (avoiding duplicate characters)
  const uniqueEntries: CifuEntry[] = [];
  const seenChars = new Set<string>();

  for (const entry of entries) {
    if (seenChars.has(entry.char)) continue;
    seenChars.add(entry.char);

    uniqueEntries.push({
      rank: uniqueEntries.length + 1,
      char: entry.char,
      jyutping: entry.jyutping,
      frequency_pm: Math.round(entry.frequency_pm * 100) / 100,
      translation: entry.translation,
    });
  }

  return uniqueEntries.slice(0, 1000);
}
