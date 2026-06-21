# Colloquial Cantonese Course

A comprehensive manual and course designed to take learners from zero to
confident conversational fluency in everyday Cantonese.

---

## 1. Vision & Goals

- **Zero to Conversational**: No prior knowledge required. Focuses on daily
  colloquial Cantonese (spoken forms) rather than formal written Chinese.
- **Agile Curriculum**: Topics cover eating out, slang, split-verbs, particles,
  and modern workplace/tech terms.
- **Interactive Course Reader**: A static Astro-powered web application that
  turns plain content files into an interactive learning portal (complete with
  hover vocabulary definitions, translation toggles, and revealable exercises
  that expand to show the correct answer and explanation).

---

## 2. Project Structure

```
cantonese/
├── content/              # Raw Cantonese chapters, dictionary, and curriculum
├── scripts/              # Validation, registry, and vocabulary tracking scripts
├── src/                  # Astro web application source (components, pages, styles)
├── README.md             # Project overview (this file)
├── eslint.config.js      # Linting configuration
└── package.json          # Dependency definition and script wrappers
```

---

### Development & Operations

- **Start local server**: `npm run dev` (Runs Astro development server at
  `http://localhost:4321`)
- **Build static export**: `npm run build` (Compiles the static application into
  `dist/`)
- **Preview build locally**: `npm run preview` (Serves the production build
  locally)
- **Deploy to GitHub Pages**: `npm run deploy` (Compiles the static website and
  publishes the `dist/` folder, including `.nojekyll`, to the remote `gh-pages`
  branch)

### TTS Generation & Audio Assets

We pre-generate high-quality neural Cantonese audio using Microsoft Azure's
premium voice `zh-HK-HiuMaanNeural` at build time.

- **Generate all missing TTS audio**: `npm run tts:generate` (Requires local
  `.env` with `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` set)
- **Generate with limits**:
  - Limit total API synthesis calls: `node scripts/generate-tts.js --limit 50`
  - Limit to the first $N$ chapters: `node scripts/generate-tts.js --chapters 5`
- **Skip TTS generation during build/deploy**: Set `SKIP_TTS=true` environment
  variable, e.g.:
  ```bash
  SKIP_TTS=true npm run build
  SKIP_TTS=true npm run deploy
  ```

### Content & Database Management

- **Validate Chapters**: `npm run validate` (Verifies chapter formatting,
  annotations, and schema portability)
- **Register Vocab**: `npm run vocab:register -- --json '...'` (Registers new
  vocabulary in database)
- **Verify Vocab**: `npm run vocab:verify -- content/XX-chapter.md` (Checks if
  chapter words are in the database)
- **Track Vocab**: `npm run track` (Compiles vocabulary database changes)

### Testing Suite

- **Unit & Integration Tests**: `npm run test` (Executes the Vitest unit test
  suite)
- **E2E Visual Regression Tests**: `npx playwright test` (Runs Playwright visual
  assertion tests against baseline snapshots)
- **Update Visual Baseline**: `npx playwright test --update-snapshots` (Updates
  reference screenshots when layout changes are verified and intended)
