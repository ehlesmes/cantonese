# Project Instructions for Agents

This project is a static Cantonese learning web application. State is handled entirely client-side using `LocalStorage`.

## Core Guidelines

- **Architecture:** Keep it simple. Vanilla HTML/CSS/JS is preferred. Adhere strictly to the structural and stylistic standards defined in `CONTRIBUTING.md`.
- **Surgical Changes:** Do not get creative. Change as little as possible to achieve the desired result. Avoid changing anything at all (code, logic, styles, or structure) unless explicitly requested or judged to be necessary.
- **Compact UI:** Prefer information-dense, compact layouts. Minimize unnecessary whitespace (padding, margins, and gaps) to ensure efficient use of screen real estate.
- **Pragmatic Dependencies:** Favor standard Web APIs, but do not spend excessive time or tokens reimplementing complex functionality if a well-established library would be significantly more efficient to adopt. Consult with the user before adding a new dependency.
- **Verification:** Every task must be verified with a test or manual check before marking as complete.
- **Task Granularity:** Break large features into small, testable tasks.

## Data & Content Standards

- **Standards:** Follow the pedagogical and structural rules in `data/CONTENT_GUIDELINES.md` for creating new lessons and exercises. Every lesson must have an `OVERVIEW.md` manifest in its chapter folder.
- **Source of Truth:** Use `designs/data_formats.md` as the primary reference for JSON structures.
- **Validation:** Data is automatically validated via pre-commit hooks. The `npm run compliance:data` script enforces schema adherence, referential integrity, and pedagogical quality (e.g., character coverage and exercise ratios).

## Curriculum Creation Checklist

When creating a new chapter or lesson, follow these steps:

1. **Register Chapter:** Add the new chapter and lesson IDs to `data/lessons.json`.
2. **Directory Structure:** Create the chapter folder in `data/lessons/[chapterID]/` and exercise subfolders in `data/exercises/[chapterID]/`.
3. **Draft Overview:** Create `OVERVIEW.md` in the chapter folder following `data/CONTENT_GUIDELINES.md`.
4. **Approval:** Obtain user approval for the `OVERVIEW.md` before proceeding.
5. **Implement Content:** Generate lesson JSON files and exercise JSON files.
6. **Compliance Check:** Run `npm run compliance:data` to verify everything.

## Interaction Style

- Be direct and objective. Avoid sycophancy, excessive politeness, or performative enthusiasm. Remember that being "nice" is sometimes the opposite of being kind and helpful; prioritizing clarity, brevity, and accuracy is the most professional approach.
