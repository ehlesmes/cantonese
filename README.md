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
  hover vocabulary definitions, translation toggles, and stateful exercises).

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

## 3. Development & CLI Scripts

All operations must be run using `npm run`. Do not run raw Node commands.

### Course Reader App

- **Start local server**: `npm run dev` (Runs Astro development server at
  `http://localhost:4321`)
- **Build static export**: `npm run build` (Compiles the static application into
  `dist/`)
- **Preview build locally**: `npm run preview` (Serves the production build
  locally)

### Content & Database Management

- **Validate Chapters**: `npm run validate` (Verifies chapter formatting,
  annotations, and schema portability)
- **Register Vocab**: `npm run vocab:register -- --json '...'` (Registers new
  vocabulary in database)
- **Verify Vocab**: `npm run vocab:verify -- content/XX-chapter.md` (Checks if
  chapter words are in the database)
- **Track Vocab**: `npm run track` (Compiles vocabulary database changes)
- **Run Tests**: `npm run test` (Executes unit and integration test suite via
  Vitest)
