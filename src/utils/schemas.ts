import { z } from "zod";

// Shared schemas
export const ChapterFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

// Used in scripts/lib/parser.ts -> parseCurriculum
// Replaces: as unknown as CurriculumChapter[]
export const CurriculumChapterSchema = z
  .object({
    file: z.string(),
    id: z.string(),
    title: z.string(),
    chapter: z.number().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const CurriculumIndexSchema = z.array(CurriculumChapterSchema);

// Used in Markdown parsing
// Replaces: as unknown as RawExercise
export const RawExerciseSchema = z
  .object({
    type: z
      .enum(["flashcard", "multiple_choice", "fill_in_the_blank"])
      .optional(),
    question: z.string().optional(),
    answer: z.string().optional(),
    explanation: z.string().optional(),
  })
  .passthrough(); // allows other fields in the exercise block if any

export const DictionaryEntrySchema = z
  .object({
    char: z.string(),
    jyutping: z.string(),
    definition: z.string(),
    type: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const DictionaryEntryArraySchema = z.array(DictionaryEntrySchema);

export const RefWordSchema = z
  .object({
    char: z.string(),
    rank: z.number(),
    jyutping: z.string(),
    translation: z.string(),
  })
  .passthrough();

export const RefWordArraySchema = z.array(RefWordSchema);

export const VocabItemSchema = z
  .object({
    character: z.string(),
    jyutping: z.string(),
    translation: z.string(),
    firstIntroducedIn: z.string(),
    occurrences: z.number().optional(),
  })
  .passthrough();

export const VocabItemArraySchema = z.array(VocabItemSchema);
