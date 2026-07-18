// Spaced Repetition System (SRS) State
export interface SrsCardState {
  level: number;
  lastReviewed: number;
}

export type SrsStateMap = Record<string, SrsCardState>;

// Progress Storage Structure
export interface UserProgress {
  unlockedChapters: string[];
  phraseSrs: SrsStateMap;
  vocabSrs: SrsStateMap;
}

// Compact Sync Structure for QR Codes and URL payloads
export interface CompactSyncPayload {
  c?: string[]; // Unlocked Chapters (compact format)
  s?: Record<string, [number, number]>; // Phrase SRS map: [level, lastReviewed]
  v?: Record<string, [number, number]>; // Vocab SRS map: [level, lastReviewed]
  t?: number; // Timestamp
}

// Lexicon and Vocabulary Definitions
export interface VocabItem {
  id: string;
  characters: string;
  jyutping: string;
  translation: string;
  chapterId?: string;
  type?: "vocab" | "phrase";
}

// Parser Outputs
export interface ParsedBlock {
  type: "prose" | "cantonese" | "dialog" | "exercise" | "other";
  content: string;
  startLine: number;
  endLine: number;
}

export interface ChapterFrontmatter {
  id: string;
  title: string;
  description: string;
}

export interface ParsedChapter {
  frontmatter: ChapterFrontmatter;
  blocks: ParsedBlock[];
}

export interface RawParsedChapter {
  frontmatter: Record<string, unknown> | null;
  blocks: ParsedBlock[];
}

export interface SemanticUnit {
  raw: string;
  characters: string;
  jyutping: string;
  translation: string;
  index: number;
  startLine?: number;
  blockType?: string;
}

// WebRTC coordination packet
export interface SDPCoordinates {
  t: "o" | "a";
  u: string;
  p: string;
  f: string;
  c: [string, number][];
}

// Markdown options
export interface CompileMarkdownOptions {
  inline?: boolean;
  breaks?: boolean;
}

// Client-side UI Data Models
export interface PracticeItemBase {
  id: string;
  chapter: string;
  chapterNumber: number;
  chapterTitle: string;
  practiceType: "vocab" | "phrase";
}

export interface ClientVocab extends PracticeItemBase {
  practiceType: "vocab";
  character: string;
  jyutping: string;
  translation: string;
  occurrences: number;
}

export interface ClientExample extends PracticeItemBase {
  practiceType: "phrase";
  cantoneseRaw: string;
  english: string;
  tokens: string[];
  type: "example" | "dialog";
  audioHash: string;
  tokenHashes: Record<string, string>;
}

export interface ClientChapterData {
  id: string;
  number: number;
  title: string;
  phrases: string[];
  vocab: string[];
}
