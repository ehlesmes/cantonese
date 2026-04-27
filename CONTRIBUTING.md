# Contributing to Cantonese Learning App

## 0. Philosophy

- **Simplicity over Abstraction:** Prefer direct, readable vanilla JS over complex patterns or unnecessary abstractions.
- **Surgical Changes:** Minimize the surface area of your changes. Do not refactor unrelated code or "clean up" files unless it is essential to the task.
- **Zero External Dependencies:** Avoid adding new npm packages or external libraries. Stick to standard Web APIs.
- **Verification First:** No change is complete without empirical verification (tests or manual checks).

## 1. Component Architecture

### Rendering Lifecycle

All components should follow a standardized rendering lifecycle:

- **Constructor:** Performs data validation, state initialization, and calls `this.render()`.
- **render():** Responsible for all DOM construction. This separates logic from structure.
- **Validation:** Always use `this.validate(data, ['prop1', 'prop2'])` from the base `Component` class.

### Shadow DOM & Styling

- **File Naming:** Component-specific styles must always be named `style.css`.
- **Encapsulation:** Prefer `:host` styling in `style.css` for the component's outer boundary instead of adding classes to `this.element` in the constructor.
- **Shared Styles:** Use `adoptedStyleSheets` for shared assets like `iconStyles` or `baseStyles`.
- **Tokens:** Strictly use CSS variables defined in `variables.css` (prefix: `--md-sys-*`). Avoid hardcoded colors or generic names like `--color-primary`.

## 2. Page Structure

All "Page" components (those rendered in `LessonViewer` or `PracticeViewer`) must follow this DOM hierarchy to ensure consistent layout and scrolling behavior:

```javascript
render() {
  const container = document.createElement('div');
  container.className = 'page-container';

  const main = document.createElement('main');
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'content-wrapper';

  // Component-specific content goes in contentWrapper

  main.appendChild(contentWrapper);
  container.appendChild(main);

  // Footer is optional but follows main if present
  this._footer = new LessonFooter({ ... });
  container.appendChild(this._footer.element);

  this.shadowRoot.appendChild(container);
}
```

## 3. Communication

- **Events:** Use `this.dispatch(eventName, detail)` for child-to-parent communication.
- **State Management:** The app is stateless on the backend. Use `Progress` utility for all `LocalStorage` interactions.
- **Routing:** Use `PageRegistry` to map strings to Component classes to avoid circular dependencies.

## 4. Testing

- Every component must have a corresponding `.test.js` file using Vitest.
- Use `vi.stubGlobal('fetch', ...)` for components that load data.
- Ensure all required data properties are tested for validation errors.
