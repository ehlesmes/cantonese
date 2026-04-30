# Design: Progress Tracking

## Overview

To provide a seamless learning experience, the application tracks user progress in lessons and
stores it in `localStorage`. This allows users to resume a lesson from the last visited page and see
their completion status.

## 💾 Storage Schema

All data is stored under the `cantonese_progress` key in `localStorage`.

```json
{
  "version": 1,
  "lessons": {
    "1.1": {
      "lastPageIndex": 2,
      "completed": true
    }
  },
  "practice": {
    "levels": {
      "1": ["1/1/1.1.2.json", "1/1/1.1.3.json"],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
      "6": [],
      "7": [],
      "8": [],
      "9": [],
      "10": []
    }
  }
}
```

## 🛠️ Components

### 1. `Progress` Utility (`components/shared/progress.js`)

A singleton utility providing a clean API for storage operations:

- `saveLessonProgress(lessonId, pageIndex)`: Updates the last visited page.
- `getLessonProgress(lessonId)`: Retrieves the saved index.
- `completeLesson(lessonId)`: Marks as completed and returns a list of new exercises to be added to
  practice.

### 2. `LessonViewer` Integration

- **On Load:** Fetches progress. If `lastPageIndex` exists, it starts there instead of index 0.
- **On Navigation:** Automatically saves the new index and updates the **visual progress bar** in
  the header.
- **On Completion:** When the `congratulations` page is rendered, it marks the lesson as completed
  and triggers the "Add to Practice" logic.

## 🎨 Visual Feedback

- **Progress Bar:** Located at the bottom of the `LessonHeader`.
- **Calculation:** `(currentPageIndex + 1) / totalPages`.
- **Styling:** A thin bar using the primary theme color, with smooth transitions.

## 🧪 Verification Plan

- **Unit Tests:** Verify that `Progress` utility correctly serializes/deserializes to
  `localStorage`.
- **Manual Check:** Refreshing `demo_lesson.html` during a lesson should return the user to the same
  page.
