# Design: Dashboard and Navigation Shell

## Overview

This design transitions the application from a collection of demo pages into a cohesive Single Page Application (SPA). It introduces a central "App Shell" with tabbed navigation and a data-driven Dashboard to manage the user's learning journey.

## 🏗️ Architecture: The App Shell

The Shell acts as the root component that manages global state and top-level navigation.

- **Navigation:** A top header containing tabs for "Home" and "Vocabulary".
- **Conditional Visibility:** The navigation header is hidden when a `LessonViewer` or `PracticeViewer` is active to ensure an immersive, focused experience.
- **Event Driven:** The Shell listens for `go-home` events from sub-components to return the user to the Dashboard.

## 🧩 Component Hierarchy

To maintain simplicity and reusability, the UI is broken down into surgical, focused components.

### 1. Global Shell Components

- **`AppShell`**: Orchestrates the top-level view switching.
- **`TabNav`**: The top header navigation container.
- **`TabButton`**: An individual navigation item with "active" state styling.

### 2. Dashboard (Home) Components

- **`DashboardPage`**: The main orchestrator for the home view.
- **`QuickActions`**: A layout container for the "Hero" section.
- **`ActionCard`**: A reusable card for high-priority tasks (e.g., "Next Lesson", "Practice").
- **`ChapterAccordion`**: The roadmap container using `<details>` and `<summary>`.
- **`ChapterItem`**: Manages the state of an individual chapter.
- **`LessonRow`**: A single row representing a lesson, handling its own status display and click events.
- **`StatusIcon`**: A micro-component that renders the visual state of a lesson (Not Started, In Progress, Completed).

### 3. Vocabulary Components

- **`VocabularyPage`**: Orchestrates the unlocked exercise list.
- **`VocabList`**: A scrollable container for exercise cards.
- **`ExampleCard`**: (Existing) The primary display for exercises.
- **`SRSBadge`**: A small overlay or label showing the mastery level (1–10).

## 🏠 The Dashboard (Home) Logic

### 1. Hero Section (Quick Actions)

- **Next Lesson:** Uses `Progress.getLessonProgress` to identify the first unfinished lesson in the roadmap.
- **Practice Review:** Displays the total count of exercises currently in Level 1 through Level 10 of the SRS.

### 2. The Roadmap (Chapter Accordion)

- **Data Source:** Driven by a global `lessons.json` manifest.
- **Status Mapping:**
  - `completed: true` -> **Completed** (Green Check).
  - `lastPageIndex > 0` and `completed: false` -> **In Progress** (Half-filled Circle).
  - Else -> **Not Started** (Empty Circle).

## 📚 Vocabulary Page Strategy

- **Unlocked Only (MVP):** Initially, only show exercises from lessons where `completed: true`.
- **Sorting (MVP):** Default to "Lesson Order".
- **Lazy Loading (Future):** Implement on-demand rendering if the exercise count grows significantly.

## 🛠️ Implementation Roadmap (MVP First)

### Phase 1: Core Components

1. **App Shell & TabNav:** Establish the navigation framework.
2. **ActionCard & StatusIcon:** Build the atomic UI units.
3. **LessonRow & ChapterAccordion:** Build the roadmap structure.

### Phase 2: The Dashboard

1. **DashboardPage:** Connect components to the `Progress` utility.
2. **Next Lesson Logic:** Implement the "Smart Shortcut" helper.
3. **Integration:** Update `LessonViewer` and `PracticeViewer` to dispatch `go-home`.

### Phase 3: Vocabulary

1. **VocabularyPage:** Implement data fetching for completed lesson exercises.
2. **SRSBadge:** Add mastery level indicators to the cards.
