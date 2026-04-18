# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-04-18
- Redesigned the core UX to a linear, paginated format (Learn -> Practice -> Learn).
- Restructured `data/content.json` to define lessons as a sequence of pages (`intro`, `learn`, `practice`).
- Removed bulk upfront metadata (grammar, culture, vocab) in favor of targeted "Learn" pages woven between exercises.
- Added macOS TTS generated `.m4a` audio files for all A1 lessons.

## [0.3.1] - 2026-04-18
- Refined scrambled exercise logic to ignore punctuation during comparison.
- Added token-level romanization for scrambled exercises.
- Improved "Hint" functionality to show target answers for scrambled tasks.
- Fixed critical crash caused by missing completion state functions.
- Restored missing `.hidden` CSS class for proper UI state management.
- Modernized layout for assessment buttons.

## [0.3.0] - 2026-04-18
- Introduced "Scrambled Sentence" exercise type with token reordering logic.
- Added translation toggle (Show/Hide English) for all exercises.
- Implemented self-assessment buttons (Correct/Incorrect) for user feedback.
- Expanded `data/content.json` with translations and tokenized data for scrambled exercises.

## [0.2.1] - 2026-04-18
- Added "Getting Started" instructions to `README.md` for running the app locally.

## [0.2.0] - 2026-04-18
- Implemented core Phase 2 features: Data fetching, dynamic rendering, navigation, and LocalStorage persistence.
- Added visual progress bar and lesson metadata (grammar, vocab, culture).
- Shifted focus to UI/UX refinement before final content review.

## [0.1.2] - 2026-04-18
- Initialized project file structure: `index.html`, `css/`, `js/`, `data/`.

## [0.1.1] - 2026-04-18
- Created `GEMINI.md` for agent instructions.
- Added task list for Phase 1 to `PLAN.md`.

## [0.1.0] - 2026-04-18
- Initialized `README.md` with project overview and status tracking.
- Initialized `PLAN.md` with high-level development milestones.
- Created `CHANGELOG.md` to track project history.
- Refined architecture to a static-only site with browser-based storage.
