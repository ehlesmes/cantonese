# Design: Data-Driven Lesson Engine

## Overview

The Lesson Engine is a component-based system designed to render full lessons dynamically from JSON data. It transitions the app from static HTML files to a single-entry point architecture where a `lesson-manager` coordinates navigation, data fetching, and page rendering.

## 🏗️ Architecture

### 1. The `lesson-viewer` Component (formerly `lesson-manager`)

Acts as the central controller:

- **Input:** Takes a `lessonId` via its `data` property.
- **Fetching:** Coordinates the loading of lesson manifests and atomic exercises.
- **State:** Tracks `currentPageIndex` and maintains the "memory" of loaded content.
- **Factory:** Dynamically creates page components (`ReadingPage`, `UnscramblePage`, `ExplanationPage`) via the `PageRegistry`.
- **UI Wrapper:** Contains the `lesson-header` (with an integrated progress bar) and a main container for dynamic page injection.

### 2. Navigation Flow

- **Header Controls:** "Prev" and "Next" buttons in the `lesson-header` are always available for free navigation.
- **Progress Bar:** A thin color bar at the bottom of the header that updates as the user progresses through the lesson.
- **Linear Progress:** "Continue" buttons on individual pages trigger a `next` transition.
- **Events:** Pages fire results (e.g., `reading-result`) which the manager can capture for future progress tracking.

## 📡 Data Loading Strategy

### 1. Lesson Detail (`data/lessons/1/1.1.json`)

The manifest for a lesson, containing the order of pages and inlined explanation content.

```json
[
  {
    "type": "explanation",
    "id": "1.1.1",
    "content": [
      { "type": "title", "value": "Greetings" },
      { "type": "text", "value": "Use 你好 to say hello." }
    ]
  },
  { "type": "reading", "id": "1.1.2" },
  { "type": "unscramble", "id": "1.1.3" }
]
```

### Fetching Logic

1.  **Lesson Request:** Load the specific lesson file (e.g., `data/lessons/1/1.1.json`) to get the list of pages.
2.  **Atomic Exercises:** Load each exercise (`reading` or `unscramble`) from separate files in the background (e.g., `data/exercises/1/1/1.1.2.json`).
3.  **Blocking:** If a user navigates to an exercise that hasn't finished loading, show a loading state; otherwise, transitions should be instant.

> **Note:** Revisit the "Atomic Files" approach later to see if lesson-level bundling is more efficient for network performance.

## ⚙️ Data Passing: Pure Property Model

To support dynamic creation via JS and maximize performance, all exercise and page components use a **Pure Property Model**.

- **Single Entry Point:** Components expose a single `data` setter that accepts a configuration object.
- **No Attributes:** Support for `setAttribute()` and HTML-based configuration has been removed to eliminate JSON serialization overhead.
- **Manager Implementation:** The `lesson-manager` passes data objects directly:
  ```javascript
  const el = document.createElement("reading-page");
  el.data = data.payload; // Pass the raw JS object
  ```

## 🛠️ Implementation Steps

1.  **[DONE] Refactor Existing Components:** Replaced attributes with a single `.data` property pattern across all components.
2.  **Create Mock Data:** Set up the folder structure in `data/` with sample JSON files.
3.  **Implement `lesson-manager`:** Build the fetching and factory logic.
4.  **Update `index.html`:** Create a single entry point that uses the manager.
