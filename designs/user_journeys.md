# Design: User Journeys & End-to-End Testing

## Overview

This document defines the critical paths (User Journeys) that a learner takes through the Cantonese Learning App. These flows ensure that individual components interact correctly to deliver a cohesive experience. These journeys will be verified using Playwright E2E tests.

---

## 🏗️ Core User Journeys

### 1. The First Lesson (Acquisition)

**Goal:** A new user discovers and completes their first piece of content.

- **Start:** User opens the app (Dashboard).
- **Action:** Clicks "Next Lesson" card (targeting Lesson 1.1).
- **Flow:**
  - Navigates through Explanation -> Reading -> Unscramble.
  - Reaches Congratulations page.
- **Completion:** Clicks "Go Home".
- **Verification:**
  - Lesson 1.1 shows a "Completed" status icon in the roadmap.
  - The "Vocabulary" tab now contains exercises from Lesson 1.1.
  - The "Practice Review" count has increased.

### 2. Spaced Repetition Loop (Retention)

**Goal:** User reinforces previously learned material.

- **Start:** User is on the Dashboard with at least 10 exercises unlocked.
- **Action:** Clicks the "Practice" card.
- **Flow:**
  - Completes a session of 10 exercises.
  - Answers some correctly and some incorrectly.
  - Reaches the Practice Summary page.
- **Completion:** Clicks "Finish".
- **Verification:**
  - Practice items are moved to correct levels in `LocalStorage`.
  - Dashboard "Practice Review" count reflects items remaining in the queue.

### 3. Progress Persistence (Resumption)

**Goal:** User can stop and start without losing their place.

- **Start:** User is in the middle of a lesson (e.g., Page 3 of Lesson 1.2).
- **Action:** User closes the tab or navigates away.
- **Flow:** User returns to the app and clicks the same lesson or "Next Lesson".
- **Verification:**
  - `LessonViewer` loads and immediately displays Page 3.
  - Progress bar in the header correctly shows the partial completion.

### 4. Vocabulary Reference

**Goal:** User reviews their personal dictionary of unlocked words.

- **Start:** User has completed multiple lessons.
- **Action:** User clicks the "Vocabulary" tab in the navigation.
- **Flow:**
  - User scrolls through the list of cards.
  - User interacts with a card (plays audio, reveals romanization).
- **Verification:**
  - Exercises from all completed lessons are present.
  - SRS Badges correctly reflect the current level from `LocalStorage`.

### 5. The Learning Path (Sequential Progress)

**Goal:** A returning user continues through the curriculum.

- **Start:** User has already completed Lesson 1.1.
- **Action:** User opens the app.
- **Verification:**
  - Dashboard "Next Lesson" card displays "Lesson 1.2" (not 1.1).
  - The Roadmap shows 1.1 as "Completed" and 1.2 as "Not Started".
- **Action:** User clicks "Start" on the Hero card.
- **Flow:** App navigates to `#/lesson/1.2`.
- **Completion:** User completes Lesson 1.2 and returns Home.
- **Verification:** Dashboard Hero card now dynamically updates to show "Lesson 1.3".

### 6. The Completionist (Curriculum End)

**Goal:** User finishes the entire available roadmap.

- **Start:** User has completed every lesson in `lessons.json`.
- **Action:** User opens the Dashboard.
- **Verification:**
  - "Next Lesson" Hero card is replaced with a "All Caught Up!" message.
  - Hero card icon changes to `check_circle`.
  - Hero action text becomes "Review".
  - Every lesson in the Roadmap shows the "Completed" status icon.

### 7. First Discovery (Brand New User)

**Goal:** User opens the app for the very first time.

- **Start:** `LocalStorage` is completely empty.
- **Action:** User opens the app.
- **Verification:**
  - Dashboard shows "Lesson 1.1" in the Hero card.
  - Vocabulary page shows a "No vocabulary unlocked yet" empty state.
  - Practice Review count is 0.

### 8. Reviewing Content (No Double-Counting)

**Goal:** User re-takes a lesson they already mastered.

- **Start:** User has completed Lesson 1.1 (e.g., exercises are at Level 3 in SRS).
- **Action:** User manually selects Lesson 1.1 from the roadmap and completes it again.
- **Verification:**
  - Congratulations page appears normally.
  - **Crucial:** SRS level for 1.1 exercises remains at Level 3 (not reset to Level 1 or duplicated).

---

## 🧪 Testing Strategy (Hybrid Approach)

We utilize a **Hybrid Approach** within Playwright that combines behavioral assertions with visual "milestones" to ensure both functional correctness and aesthetic integrity.

### 1. The Checkpoint Pattern

Journey tests in Playwright will follow a "Checkpoint" pattern where behavioral actions are followed by visual snapshots of significant UI states:

- **Behavioral Assertions:** Verify logic, routing, and data (e.g., `expect(page).toHaveURL(/.*#\/home/)`).
- **Visual Milestones:** Verify layout and integration (e.g., `expect(page).toHaveScreenshot('dashboard-initial.png')`). This ensures that components like the Header and Nav are correctly integrated within the App Shell.

### 2. State Injection

Instead of manually performing 10 lessons to test a specific flow, tests will inject state directly into `LocalStorage` before navigation:

```javascript
await page.addInitScript(() => {
  window.localStorage.setItem('cantonese_progress', JSON.stringify({...}));
});
```

### 3. Tool Responsibility (Playwright)

Playwright is the sole tool for these journeys as it provides a real browser environment to verify:

- **Hash-based routing:** Checking URL changes during navigation.
- **Component Integration:** Ensuring the Header, Nav, and Main content regions coexist correctly.
- **Persistence:** Verifying that actions in one view (e.g., completing a lesson) are correctly reflected in another (e.g., the Vocabulary tab) via `LocalStorage`.

### 4. Location

E2E journey tests will be stored in `tests/e2e/*.spec.js`. This separates them from the existing component-level visual tests in `tests/visual/`.
