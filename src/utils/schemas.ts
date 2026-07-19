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
    id: z.string(),
    character: z.string(),
    jyutping: z.string(),
    translation: z.string(),
    type: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    firstIntroducedIn: z.string().optional(),
    occurrences: z.number().optional(),
  })
  .passthrough();
