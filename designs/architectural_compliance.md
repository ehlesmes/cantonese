# Design: Architectural & Testing Compliance

## Overview

To maintain the "Surgical Integrity" and "Simplicity" of the Cantonese Learning App, we use
automated checks (ESLint AST rules and Structural Scripts) to enforce the standards defined in
`CONTRIBUTING.md`.

---

## 🏗️ Architectural Rules (ESLint AST)

These rules are implemented in `eslint.config.js` to ensure component lifecycle and encapsulation.

### 1. `arch/mandatory-lifecycle` (Critical)

- **Rule:** Classes extending `Component` must call `this.validate()`, `this.render()`, and (if
  defined) `this.setupEventListeners()` in the constructor.
- **Why:** Prevents "Invisible Components" that are instantiated but never built or validated.

### 2. `arch/mandatory-super-url` (High)

- **Rule:** The `super()` call must receive `import.meta.url`.
- **Why:** Required for the base `Component` to resolve the component's `style.css` path correctly.

### 3. `arch/no-global-document` (High)

- **Rule:** Prohibit use of the global `document` object inside components (except for
  `document.createElement`). Use `this.shadowRoot` or `this.element`.
- **Why:** Enforces Shadow DOM encapsulation and prevents components from leaking logic into the
  global scope.

### 4. `arch/event-registration-locality` (High)

- **Rule:** Event listeners must be registered inside the `setupEventListeners()` method. The
  `render()` method must remain declarative and free of imperative logic like `addEventListener`.
- **Why:** Maintains a clean separation between DOM structure and behavioral logic.

### 5. `arch/dispatch-standard` (Medium)

- **Rule:** Prohibits raw `this.element.dispatchEvent()` calls. Enforces use of the
  `this.dispatch()` helper.
- **Why:** Ensures all events bubble and are `composed: true` by default, which is required for our
  event delegation strategy.

### 6. `arch/prefer-properties` (Medium)

- **Rule:** Prohibit method names starting with `set...` or `get...`. Use native ES6 `get` and `set`
  keywords.
- **Why:** Makes components behave like native HTML elements (e.g., `btn.disabled = true` vs
  `btn.setDisabled(true)`).

### 7. `arch/naming-alignment` (Low)

- **Rule:** The exported class name must match the snake_case filename (e.g., `dashboard_page.js`
  must export `DashboardPage`).
- **Why:** Predictability in the `PageRegistry` and easier project navigation.

---

## 🧪 Testing Standards

Every component must have a `.test.js` file adhering to these rules:

### 1. Environment Isolation

- **Rule:** Every `beforeEach` block must call `document.body.replaceChildren()` to clear the DOM.
- **Why:** Prevents test cross-contamination.

### 2. Validation Testing

- **Rule:** Every test suite for a component that defines a `validate()` method must have a
  `describe("Validation", ...)` block.
- **Requirement:** Must test that missing mandatory properties throw a `ValidationError`.

### 3. Event Verification

- **Rule:** Components that use `this.dispatch()` must be tested using `vi.fn()` spies attached to
  `component.element`.
- **Requirement:** Verify both the event name and the `detail` payload.

### 4. Data Mocking

- **Rule:** Components that perform network requests must use `vi.stubGlobal('fetch', ...)` in the
  `beforeEach` or specific test.
- **Requirement:** Ensure fetch is restored or cleared between tests.

---

## 🏗️ Structural Rules (Script-based)

Enforced via `scripts/structural_compliance.js` during pre-commit.

- **Component Completeness:** Every folder in `components/` must contain `style.css`,
  `[folder_name].js`, and `[folder_name].test.js`.
- **Token Strictness:** `style.css` files must not contain hardcoded colors (#hex, rgb, hsl). They
  must use `--md-sys-*` tokens.
- **Shadow DOM Usage:** `style.css` must utilize the `:host` selector.
