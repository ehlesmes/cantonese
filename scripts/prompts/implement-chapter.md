# Goal: Reflective Implementation, Re-alignment, & Batch Registration of the Cantonese Curriculum

Please review our progress, evaluate our curriculum map, audit the upcoming
progression, and implement the next step in our Cantonese course. We must not
blindly implement the next chapter; we must ensure the pedagogical progression
is smooth, the cognitive load is managed, and the 3-chapter active look-ahead
window in `content/curriculum.md` is updated.

## 1. Context & Specifications

- **Curriculum Roadmap**: Read
  [content/curriculum.md](../../content/curriculum.md) to inspect the high-level
  roadmap and the rolling active look-ahead window.
- **Introduced Vocabulary Index**: Read
  [content/vocabulary.json](../../content/vocabulary.json) to identify
  vocabulary already introduced. Make sure to spiral these words into the lesson
  while keeping new terms bounded.
- **Master Lexicon Dictionary**: Read
  [content/dictionary.json](../../content/dictionary.json) to see the registered
  vocabulary database.
- **Syntax Standards**: Strictly follow
  [content/README.md](../../content/README.md) formatting rules (frontmatter,
  `` `Char[Jyutping|Translation]` `` annotations, `cantonese` example blocks,
  `dialog` speakers, and `exercise` YAML blocks).
- **Forbid Markdown Tables**: DO NOT use Markdown tables for vocabulary, pronoun
  grids, or grammar notes. Prettier auto-formatting pads empty spaces inside
  table cells to align columns, which corrupts compact parser annotations (e.g.,
  introducing illegal spaces inside `` `Char[Jyutping|Translation]` ``). Always
  use bulleted lists or clean description blocks instead.

---

## 2. Phased Implementation Workflow

### Phase A: Pedagogical Audit & Curriculum Refinement (MANDATORY START)

Before writing any chapter content, you must perform a cognitive load audit:

1. **Analyze target topics**: Read the proposed topic details for the target
   chapter and the next 2-3 chapters in `content/curriculum.md`.
2. **Evaluate cognitive progression**: Are we introducing too many distinct
   grammatical patterns or particles at once?
3. **Handle Splits & Reorganizations**:
   - If a topic is too dense, split it into two standard consecutive chapters.
   - **Do NOT create fractional chapters** (e.g., do not use "Chapter 1.5" or
     filenames like `01.5-particle-focus.md`).
   - If a split or reordering occurs, **sequentially renumber all subsequent
     chapters** (e.g., if inserting a new chapter, rename subsequent files using
     `git mv` so they maintain clean double-digit sequence increments:
     `01-greetings.md`, `02-new-topic.md`, `03-shopping-slang.md`...).
   - Ensure you update the `chapter` number in the YAML frontmatter of all
     renamed files to match their new prefixes.
4. **Update the Curriculum Map**: Modify the YAML index list and chapter
   descriptions in `content/curriculum.md` to reflect the updated 3-4 chapter
   active window and roadmap. Document your rationale clearly in your response.

### Phase B: Lexicon Preparation & Batch Registry Management

1. Outline the list of new vocabulary words you plan to introduce in this
   lesson.
2. Cross-reference them against `content/dictionary.json`.
3. For any missing terms, register them **all at once** using the registrar
   CLI's batch mode:
   ```bash
   npm run vocab:register -- --json '[
     {"char": "我", "jyutping": "ngo5", "definition": "I / me", "type": "pronoun"},
     {"char": "你", "jyutping": "nei5", "definition": "you", "type": "pronoun"}
   ]'
   ```
   _Ensure all entries have standard LSHK Jyutping tone digits (1-6) and map to
   authorized grammatical types._

### Phase C: Chapter Drafting

1. Draft the target chapter file in `content/` with the correct two-digit prefix
   matching your updated curriculum (e.g., `content/01-greetings.md`).
2. Prioritize natural, spoken, and authentic Cantonese (no formal 书面语).
3. Ensure every single Chinese character discussed, used in dialogues, or found
   in exercises has correct inline annotations matching the dictionary.

### Phase D: Automated Hook Validation & Git Commit

Our repository is armed with a highly optimized Husky pre-commit hook that
automatically executes code formatting (Prettier), syntax linting (ESLint),
vocabulary database compiling (`npm run track`), formatting validation
(`npm run validate`), and project portability checks on every single commit.

To streamline and speed up your workflow:

1. Stage all your created and modified files: `git add .`
2. Commit directly using a structured, descriptive commit message:
   `git commit -m 'feat: implement Chapter X: [Title] and update curriculum roadmap'`
3. If the pre-commit hook fails, simply read the terminal diagnostic output,
   repair any reported formatting, schema, or portability errors, and attempt
   the commit again. Rely on this hook as your single, unified safety net.
