# Explanation Page Component Requirements

The `explanation-page` displays educational content, including text and examples, to the user before they proceed to exercises.

## 1. Data Input

The component accepts a single `data` object property:

- `content` (Array<Object>): A list of content chunks to be rendered in order.
  - `type`: One of `"title"`, `"text"`, or `"example"`.
  - `value` (String): Used for `"title"` and `"text"` types. Supports simple `<strong>` tags for rich text.
  - `cantonese`, `romanization`, `translation` (Strings): Used for the `"example"` type to render an `ExampleCard`.

## 2. Component Logic

- **Content Rendering:**
  - `"title"`: Rendered as an `<h1>` element.
  - `"text"`: Rendered as a `<p>` element. A basic parser handles `<strong>` tags to provide bold formatting without using `innerHTML`.
  - `"example"`: Renders an `ExampleCard` component with the provided Cantonese, romanization, and translation.
- **Footer:**
  - Displays a `LessonFooter` with a single primary button labeled "Continue".

## 3. Events

- `explanation-complete`: Dispatched when the user clicks the "Continue" button in the footer.
