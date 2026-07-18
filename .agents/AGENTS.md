# Project Architectural Rules

## Functional Core, Imperative Shell

This project strictly adheres to the "Functional Core, Imperative Shell"
philosophy. When contributing to this codebase, you MUST separate business logic
from side effects.

### Functional Core

- **What goes here**: Data parsing, string manipulation, complex validation,
  business rules, filtering, and mathematical operations.
- **Where**: Typically inside `src/utils/`, `scripts/lib/`, or pure library
  functions.
- **Rules**:
  - Functions must be pure (deterministic).
  - No DOM manipulation, `fetch`, file system access (I/O), or external API
    calls.
  - Must have high test coverage.

### Imperative Shell

- **What goes here**: UI rendering, event handling, file reading/writing,
  network requests, state persistence.
- **Where**: UI components (e.g. `.astro` files), Client scripts (e.g.
  `src/client/*.ts`), CLI runners (e.g. `scripts/*.ts`).
- **Rules**:
  - Keep it as "dumb" as possible.
  - Delegate all complex logic and data transformation to the functional core.
  - Do NOT parse raw strings manually inside a UI component; pass them to a
    utility function and render the output.
