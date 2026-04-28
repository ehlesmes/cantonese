# Design: Cross-Component Event System

## Objective

Formalize and document the custom event system used for cross-component communication (child-to-parent) to ensure an explicit, maintainable, and testable data flow.

## 🏗️ Architecture

To avoid "dead documentation" and maintain architectural integrity, the event system relies on three pillars:

1.  **Single Source of Truth (`components/shared/events.js`):** A unified file containing both the event constants (to avoid magic strings) and the metadata schema (for validation).
2.  **Living Validation (Runtime):** The base `Component` class validates event names and payloads against the schema during development and testing.
3.  **Living Validation (Build-time):** A compliance script ensures all events defined in the schema are actually used and that no undocumented events are introduced.

---

## 🔑 The Unified Registry & Schema

Components must not use raw strings for event names. Instead, they must use the `Events` constant. This same file provides the metadata required for validation.

```javascript
// components/shared/events.js

export const Events = {
  GO_HOME: "go-home",
  LESSON_CLICK: "lesson-click",
  // ...
};

export const EventSchema = {
  [Events.GO_HOME]: {
    description: "Generic event to return to the dashboard.",
    dispatchedBy: ["PracticeViewer", "CongratulationsPage"],
    handledBy: ["AppShell"],
    detail: null,
  },
  [Events.LESSON_CLICK]: {
    description: "Triggered when a lesson item is clicked.",
    dispatchedBy: ["LessonRow"],
    handledBy: ["DashboardPage"],
    detail: { lessonId: "string" },
  },
};
```

---

## 🧪 Validation & Compliance

### 1. Static Auditor (`scripts/event_compliance.js`)

A script that runs during the build/CI process to verify:

- **Completeness:** Every constant in `Events` has a corresponding entry in `EventSchema`.
- **Usage:** Scans the codebase to ensure every event listed in the schema is dispatched at least once and handled at least once.
- **No Rogue Events:** Ensures that `this.dispatch()` and `addEventListener()` only use documented constants, preventing the re-introduction of magic strings.

### 2. Runtime Payload Guard

The base `Component.dispatch` method is enhanced to validate the event name and the `detail` payload against the `EventSchema`. If a component dispatches an undocumented event or a malformed payload, a warning or error is triggered in development/test environments.

---

## 🛠️ Implementation Strategy

1.  **Unified Registry Creation:** Implement `components/shared/events.js` with all identified events and their metadata.
2.  **Global Refactor:** Update all components and test files to use the `Events` constants instead of magic strings.
3.  **Base Class Update:** Integrate `EventSchema` into `components/shared/component.js` for runtime validation.
4.  **Auditor Integration:** Create the compliance script and add it to the project's linting and pre-commit pipelines.
