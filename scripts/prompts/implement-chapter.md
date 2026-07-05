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
- **Strictly Use NPM Scripts (No Raw Node)**: You are strictly prohibited from
  running raw `node` commands (e.g., `node scripts/...`). All script runs must
  be wrapped in standard `npm run` aliases defined in `package.json`. Pass
  arguments to the underlying script using the double-dash (`--`) separator.
  Examples:
  - Find Missing Vocabulary:
    `npm run vocab:register-missing -- content/XX-filename.md`
  - Register Vocabulary: `npm run vocab:register -- --json '...'` or
    `npm run vocab:register -- --file <path>`
  - Verify Chapter Vocabulary: `npm run vocab:verify -- content/XX-filename.md`
  - Compile Vocabulary Database: `npm run track`
  - Validate Formatting & Portability: `npm run validate`

---

## 2. Phased Implementation Workflow

### Phase A: Pedagogical Audit & Curriculum Refinement (MANDATORY START)

Before writing any chapter content, you must perform a cognitive load audit:

1. **Analyze target topics**: Read the proposed topic details for the target
   chapter and the next 2-3 chapters in `content/curriculum.md`.
2. **Evaluate cognitive progression**: Are we introducing too many distinct
   grammatical patterns or particles at once?
3. **Handle Splits & Reorganizations**:
   - A single chapter must introduce a maximum of **20 to 25 new vocabulary
     words** to keep cognitive load low.
   - If a topic is too dense or a dialogue introduces many new terms, split it
     into two or more standard consecutive chapters. Do NOT simplify or dumb
     down dialogues artificially to meet the word limit; instead, isolate the
     dense dialogues/scenarios into their own dedicated chapters to preserve
     natural, authentic spoken Cantonese.
   - **Do NOT create fractional chapters** (e.g., do not use "Chapter 1.5").
   - If a split or reordering occurs, update the sequential list of chapters in
     `content/curriculum.md`. File names on disk do not use numeric prefixes
     (e.g., it is `greetings.md`, not `01-greetings.md`). Use clean, descriptive
     slugs for file names.
4. **Update the Curriculum Map**: Modify the YAML index list and chapter
   descriptions in `content/curriculum.md` to reflect the updated 3-4 chapter
   active window and roadmap. Document your rationale clearly in your response.

### Phase B: Lexicon Preparation & Batch Registry Management

1. **Select Backlog Vocabulary**: Open `content/vocabulary_backlog.json`, find
   the highest-frequency `"pending"` words that fit the current chapter's theme,
   and plan to introduce them.
2. **Simplified One-Pass Post-Drafting Registration (Recommended)**:
   - You can draft the chapter first.
   - Once drafted, run the template generator to find all unregistered
     vocabulary and write a registration draft JSON:
     ```bash
     npm run vocab:register-missing -- content/my-chapter.md
     ```
   - Open the generated `tmp/register-missing-draft.json`, replace any
     `"TODO_TYPE"` placeholders with valid grammatical types (e.g., `noun`,
     `verb`), and register them all at once:
     ```bash
     npm run vocab:register -- --file tmp/register-missing-draft.json
     ```
3. **Alternative Manual Batch Lookup & Registration**:
   - Query the dictionary all at once using our deterministic batch lookup
     utility:
     ```bash
     npm run vocab:lookup -- <word1> <word2> <word3>...
     ```
   - For any missing terms, register them all at once using the registrar CLI's
     batch mode:
     ```bash
     npm run vocab:register -- --json '[
       {"char": "我", "jyutping": "ngo5", "definition": "I / me", "type": "pronoun"},
       {"char": "你", "jyutping": "nei5", "definition": "you", "type": "pronoun"}
     ]'
     ```
     Ensure all entries have standard LSHK Jyutping tone digits (1-6) and map to
     authorized grammatical types.
4. **Update Backlog Database**: After successfully registering them, update
   their `"status"` to `"completed"` in `content/vocabulary_backlog.json` to
   keep the backlog database synchronized.
   - **Forbid Shell Cleanups (`rm` / `rmdir`)**: You are strictly prohibited
     from running shell deletion commands (like `rm` or `rmdir`) to clean up
     temporary files in `tmp/`. The `tmp/` folder is ignored by Git, so leaving
     files there is completely safe and avoids triggering user permission
     prompts. If you must delete a temporary file, do so programmatically inside
     a JS execution script, never via shell commands.

### Phase C: Chapter Drafting

1. Draft the target chapter file in `content/` with a descriptive filename slug
   matching your updated curriculum definition (e.g., `content/greetings.md`).
2. Prioritize natural, spoken, and authentic Cantonese (no formal 书面语).
3. Ensure every single Chinese character discussed, used in dialogues, or found
   in exercises has correct inline annotations matching the dictionary.
4. **Vocabulary Ceiling**: Keep new vocabulary words strictly bounded. A single
   chapter must introduce a maximum of **20 to 25 new vocabulary words**. If
   drafting exceeds this, split the content per the guidelines in Phase A.

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
