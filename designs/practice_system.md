# Design: Practice System (SRS)

## Overview

The Practice System provides a Spaced Repetition System (SRS) to reinforce learning. Exercises move
through 10 levels of mastery based on user performance.

## ⚙️ Core Logic

### 1. Exercise Structure

- **ID Format:** `<chapter>/<lesson>/<chapter>.<lesson>.<exercise>.json` (e.g., `1/1/1.1.2.json`).
- **Metadata:** Each exercise JSON file will contain a `"type": "reading" | "unscramble"` field.

### 2. Level Progression

- **Levels:** 1 (New/Weak) to 10 (Mastered).
- **Success:** Moves to the end of the next level (e.g., $N \to N+1$). Capped at 10. Level 10 stays
  at 10.
- **Failure:** Moves to the end of **Level 1**, regardless of previous level.

### 3. Selection Algorithm

A practice session consists of **10 exercises**:

1. Iterate through levels 1 to 10.
2. Collect the first 10 exercises encountered.
3. If fewer than 10 total exercises exist in the system, collect all available.

### 4. Session Management

- **Progress Bar:** Displays "Exercise X of 10".
- **Score Tracking:** Tracks correct vs. incorrect answers for a summary screen.
- **Summary:** Shows the final score and allows starting another session or exiting.

## 🛠️ Implementation

### 1. [DONE] Data Migration

Add `"type": "reading"` or `"type": "unscramble"` to all existing exercise files in
`data/exercises/`.

### 2. [DONE] `Progress` Utility Additions

- `getPracticeSession()`: Returns 10 exercises based on the selection algorithm.
- `updatePracticeResult(exerciseId, isCorrect)`: Handles level transitions and saves to
  `localStorage`.
- `addLessonToPractice(lessonId, exerciseIds)`: Scans for duplicates before adding new IDs to
  Level 1.

### 3. [DONE] `PracticeViewer` Component

A new top-level component that:

- Manages the session state (current index, score).
- Dynamically instantiates the appropriate page component for each exercise.
- Displays the progress bar and summary screen.

## 🧪 Verification Plan

- **Unit Tests:** `components/shared/progress.test.js` to verify SRS logic (level promotion,
  demotion, and selection).
- **Manual Check:** Complete a lesson and verify that exercises appear in the practice queue.
