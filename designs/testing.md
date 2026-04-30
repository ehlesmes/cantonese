# Design: Testing Strategy

## Overview

This document outlines the testing standards for the Cantonese learning application, covering unit
tests, integration tests, and visual regression tests.

## 🧪 Test Types

### 1. Unit Tests (Vitest)

Used for individual component logic, data validation, and event dispatching.

- **Location:** `components/**/*.test.js`
- **Execution:** `npm run test`
- **Focus:** Ensure components handle data correctly and dispatch expected events.

### 2. Visual Regression Tests (Playwright)

Used to ensure UI consistency and prevent layout regressions.

- **Location:** `tests/visual/*.spec.js`
- **Execution:** `npm run test:visual`
- **Snapshots:** `tests/visual/pages.spec.js-snapshots/`

## ⚠️ Visual Testing Thresholds

Visual regression testing uses the `maxDiffPixelRatio` configuration in `playwright.config.js`. It
is important to understand the implications of this setting:

- **Current Threshold:** `0.01` (1%).
- **Implication:** Changes that affect less than 1% of the total screen area (approx. 9,216 pixels
  on a 1280x720 viewport) may pass without triggering a failure.
- **Example:** Moving a small button from one side of a footer to the other might only result in a
  ~0.8% difference, which would be ignored if the threshold is set too high (e.g., at 5%).

### Recommendations for Precision:

- **Component-Level Screenshots:** When testing specific UI changes, prefer taking screenshots of
  individual elements (e.g., the footer) rather than the full page to make the diff more significant
  relative to the area.
- **Threshold Tuning:** Keep the threshold as low as possible while allowing for minor
  cross-platform rendering discrepancies (like font antialiasing).

## 🚀 Pre-commit Hook

To maintain code quality, the project uses a pre-commit hook that runs:

1. `lint-staged` (Automatic formatting and lint fixing).
2. `npm run lint` (Global lint check).
3. `npm run test:run` (All unit tests).
4. `npm run test:visual` (All visual regression tests).

**Note:** If a visual test fails legitimately due to an intentional UI change, you must update the
snapshots using `npx playwright test --update-snapshots`.
