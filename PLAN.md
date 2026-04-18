# Development Plan: Cantonese Learning App

## High-Level Milestones

1. **Phase 1: Foundation (Completed)**
   - Project setup, UI structure, and mock content generation.

2. **Phase 2: Local State & Progression (Current)**
   - Content rendering logic and browser-based persistence.
   - A2-B1 content modules and progress tracking.

3. **Phase 3: Advanced Features**
   - B2-C1 content.
   - Client-side Spaced Repetition System (SRS).
   - User settings and offline capabilities.

## Phase 2 Tasks
- [x] **Data Loading:** Implement `js/app.js` to fetch and parse `data/content.json`.
- [x] **Lesson Renderer:** Create functions to inject lesson metadata and exercises into the DOM.
- [x] **Linear Pedagogy Shift:** Transition from bulk meta-data rendering to a sequential, paginated experience (Intro -> Learn -> Practice).
- [x] **Pedagogical Integrity:** Enforce strict rule: all vocabulary must be demonstrated in an example and practiced in an exercise.
- [x] **Dashboard:** Implement a home screen with multi-level lesson grouping and dynamic status tracking (Not Started, In Progress, Completed).
- [x] **Navigation:** Sticky `app-header` with progress tracking, session controls (Close, Restart), and arrows. Unified `app-footer`.
- [x] **Persistence:** Use `localStorage` to save user's current lesson, completed pages, and finished lessons.
- [x] **Progress UI:** Display a simple progress bar for pages completed.
- [x] **UI/UX Refinement:**
    - [x] Stabilize layout shifting on Scrambled drag/drop actions and fix footer sizes.
    - [x] Hide romanization until character hover to test memory retention.
    - [x] Built integrated completion view with detailed wrong/right summaries.
    - [x] Standardize centering across all views for a focused vertical flow.
    - [x] Weave grammar, vocabulary, and examples into organic rich-text `Learn` paragraphs.
    - [x] Streamline view: remove floating chip layout, shrink header/footer, add subtle borders, and replace "Yes/No" with direct actions.
- [x] **Quality Review:** Review and refine the curriculum map and lesson content for clarity, pedagogical accuracy, and engagement.
- [ ] **Content Expansion:** Create JSON files for Lessons 4-10 (A2 level).

## Phase 3 Tasks
- [ ] **SRS Logic:** Track exercise repetitions and interval timing in `localStorage`.
- [ ] **Analytics:** Display stats (e.g., words learned, streaks) based on `localStorage` data.
- [ ] **Content Scaling:** Create JSON files for B1-C1 levels.

## Current Status
- **Milestone:** Phase 2 (Local State & Progression)
- **Status:** Implementing data fetching and rendering.
- **Architecture:** Static site with browser-based state management.
