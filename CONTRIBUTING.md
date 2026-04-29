# Contributing to Cantonese Learning App

## 0. Philosophy

- **Simplicity over Abstraction:** Prefer direct, readable vanilla JS over complex patterns or unnecessary abstractions.
- **Surgical Changes:** Minimize the surface area of your changes. Do not refactor unrelated code or "clean up" files unless it is essential to the task.
- **Pragmatic Minimalism:** While we prefer standard Web APIs and avoid bloating the project with unnecessary npm packages, we are open to using existing tools if they provide clear utility and prevent wasting effort on reimplementing standard functionality. Prioritize efficiency and reliability over a "not invented here" mentality.
- **Compact UI:** Prefer information-dense, compact layouts. Minimize unnecessary whitespace (padding, margins, and gaps) to ensure efficient use of screen real estate.
- **Verification First:** No change is complete without empirical verification (tests or manual checks).

## 1. Component Architecture

### Rendering Lifecycle

All components should follow a standardized rendering lifecycle:

- **Constructor:** Performs data validation, state initialization, and calls `this.render(data)` and `this.setupEventListeners()`.
- **render(data):** Responsible for all DOM construction using the passed data object. This separates initialization logic from structure.
- **setupEventListeners():** Attaches all event listeners. This keeps the `render` method declarative and focused on structure.
- **Instance Reference:** Every component must attach itself to its root element via `this.element.component = this`. This allows accessing the JS class instance from a DOM reference.
- **Properties over Methods:** Prefer getter/setter properties (e.g., `footer.primaryDisabled = true`) over action-based methods (e.g., `footer.setPrimaryDisabled(true)`) to make components feel like native elements.
- **Non-Destructive Updates:** Avoid destructive re-rendering patterns such as `container.innerHTML = ""`. When content needs to be swapped or updated, prefer targeted updates to specific elements or use `element.replaceChildren(...nodes)` to maintain semantic integrity and prevent unnecessary layout shifts.
- **Validation:** Always use `this.validate(data, ['prop1', 'prop2'])` from the base `Component` class.

### Shadow DOM & Styling

- **File Naming:** Component-specific styles must always be named `style.css`.
- **Encapsulation:** Prefer `:host` styling in `style.css` for the component's outer boundary instead of adding classes to `this.element` in the constructor.
- **Shared Styles:** Use `adoptedStyleSheets` for shared assets like `iconStyles` or `baseStyles`.
- **Tokens:** Strictly use CSS variables defined in `variables.css` (prefix: `--md-sys-*`). Avoid hardcoded colors or generic names like `--color-primary`.

## 2. Page Structure

All "Page" components (those rendered in `LessonViewer` or `PracticeViewer`) should extend `BasePage`. `BasePage` provides a standard layout (header/main/footer) and forwards footer events.

Subclasses should implement:

- **renderContent(data):** To define the page-specific UI within the pre-constructed `this.contentWrapper`.
- **handlePrimaryClick() / handleSecondaryClick():** To respond to footer button actions.

Example:

```javascript
export class ReadingPage extends BasePage {
  constructor(data) {
    super(data, ["cantonese", "romanization", "translation"], import.meta.url, {
      primaryText: "Reveal Answer",
    });
  }

  renderContent(data) {
    this._exercise = new ReadingExercise(data);
    this.contentWrapper.appendChild(this._exercise.element);
  }
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
