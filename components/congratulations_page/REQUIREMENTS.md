# Congratulations Page Component Requirements

The `congratulations-page` is shown at the end of a lesson to celebrate completion and provide
navigation options for what to do next.

## 1. Data Input

The component accepts a single `data` object property:

- `title` (String): The celebration title (e.g., "Lesson Complete!").
- `summary` (String): A brief summary of what the user achieved.
- `nextLessonId` (String, Optional): The ID of the next recommended lesson.

## 2. Component Logic

- **Layout:** Displays the title as an `<h1>` and the summary as a `<p>`.
- **Navigation (Footer):**
  - **If `nextLessonId` is provided:**
    - Primary Button: "Next Lesson" (Dispatches `next-lesson` event).
    - Secondary Button: "Back Home" (Dispatches `go-home` event).
  - **If `nextLessonId` is NOT provided:**
    - Primary Button: "Back Home" (Dispatches `go-home` event).
    - Secondary Button: Hidden.

## 3. Events

- `next-lesson`: Dispatched when the "Next Lesson" button is clicked.
  - `detail.nextLessonId` (String): The ID of the next lesson.
- `go-home`: Dispatched when the "Back Home" button is clicked.
