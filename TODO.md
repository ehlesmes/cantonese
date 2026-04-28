# TODO / Improvements Backlog

## Technical Debt & Documentation

- [ ] **(P1) Component Event Contracts:** Document the list of custom events (`dispatch`) used for cross-component communication (e.g., `go-home`, `next-lesson`, `close`) to make the data flow more explicit.
- [ ] **(P1) LocalStorage Schema:** Document the `cantonese_progress` object structure in `designs/data_formats.md` or a new design doc.
- [ ] **(P1) Routing Map:** Create a central registry or documented list of all valid hash routes (`#/home`, `#/lesson/:id`, `#/practice`, `#/advanced`) to avoid "magic string" dependencies.
- [ ] **(P2) State Validation:** Implement schema validation for `localStorage` (akin to `data_compliance.js`) to prevent corrupted progress states.
- [ ] **(P4) Global Styles Strategy:** Document the usage guidelines for `adoptedStyleSheets` vs. component-level `style.css` in `CONTRIBUTING.md`.

## Feature Improvements

- [ ] **(P1) Shared Schemas:** Extract validation logic from `scripts/data_compliance.js` into a shared module for reuse in the frontend.
- [ ] **(P2) Markdown Curriculum Compiler:** Implement the curriculum authoring system as defined in `designs/curriculum_authoring.md` (see `designs/curriculum_authoring.md` - _currently iterating_), including the `scripts/compile_curriculum.js` utility.
- [ ] **(P3) Structured LocalStorage Editor:** Implement a robust JSON tree editor in `/#/advanced` (see `designs/advanced_editor.md` - _currently iterating_).

## Testing & Quality

- [ ] **(P4) E2E Journey Testing:** Implement Playwright E2E tests for the core User Journeys defined in `designs/user_journeys.md`, utilizing state injection and the "Checkpoint" pattern to verify component integration and state persistence.
- [ ] **(P4) Visual Testing Coverage:** Several components (e.g., `DashboardPage`, `ActionCard`, `TabNav`) lack visual regression tests; expand `tests/visual/pages.spec.js` to ensure consistent UI across updates.

## Proposed Features

- [ ] **(P1) Dialogue System:** Implement a dialogue viewer that uses two voices when available, or applies pitch/rate shifts as a fallback when only one is available. (_currently iterating_)
- [ ] **(P2) Voice Configuration:** Implement a voice selector and configuration tool in the Advanced settings to manage preferred voices and mappings. (_currently iterating_)
- [ ] **(P3) Searchable Glossary:** Add a search bar to the Vocabulary page to filter unlocked items.
- [ ] **(P3) Streak Counter:** Implement a daily study streak tracker on the dashboard using `LocalStorage`.
- [ ] **(P3) Unscramble UX Update:** Change the unscramble exercise behavior to show a "Show Answer" button instead of disabling the "Continue" button.
