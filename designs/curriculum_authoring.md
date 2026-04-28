# Design: Markdown-Driven Curriculum Authoring

## Objective

Transition from manual, fragmented JSON management to a human-readable, Markdown-driven authoring system. This centralizes the curriculum content in a way that is easy to browse, version, and edit.

## Structure

- `/curriculum`: Root for all course content.
  - `curriculum.md`: High-level roadmap and index of chapters.
  - `/chapterX`: Directory for a specific chapter.
    - `overview.md`: Chapter learning objectives and topic index.
    - `/lessonX.Y`: Directory for a specific lesson.
      - `page1.md`: Content for the first page (e.g., Explanation type).
      - `page2.md`: Data for the second page (e.g., Exercise type).
      - ...

## Implementation Path

1.  **Authoring Source of Truth:** All curriculum content lives in `/curriculum`.
2.  **Schema Enforcement:** Each Markdown file will include a YAML-like front-matter block to define `type`, `pageId`, and other required metadata.
3.  **Compilation Utility:** A new tool (`scripts/compile_curriculum.js`) will:
    - Recursively traverse `/curriculum`.
    - Parse Markdown/front-matter into native objects.
    - Validate against the existing `schemas.js`.
    - Generate the required JSON files in `/data` for the application engine.

## Benefits

- **Readability:** Content is easier to review and edit by humans.
- **Maintainability:** Git diffs for Markdown are significantly more informative than JSON.
- **AI-Workflow:** Simplifies the process for AI to generate, update, and manage the curriculum without worrying about file fragmentation.
