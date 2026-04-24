# Unscramble Page Component Requirements

The `unscramble-page` coordinates an `unscramble-exercise` and a `lesson-footer` to guide the user through a sentence-building task.

## 1. Data Input

The component accepts a single `data` object property:

- `tokens` (Array): An array of pairs `[text, romanization]` (e.g., `[["我", "ngo5"], ["係", "hai6"]]`).
- `translation` (String): The English meaning of the full phrase.

## 2. Interaction & Footer Logic

The footer buttons automatically react to the status of the internal `unscramble-exercise`.

### Incomplete State

- **Condition:** Not all tokens have been moved to the slots.
- **Footer:**
  - Primary Button: "Continue" (Disabled)
  - Secondary Button: Hidden

### Incorrect State (`wrong`)

- **Condition:** All tokens are in slots, but the order is incorrect.
- **Footer:**
  - Primary Button: "Continue" (Enabled)
  - Secondary Button: "Try again"
- **Visuals:** Tokens in the slots container must have a **red** background.
- **Action:**
  - Clicking "Try again" resets the exercise.
  - Clicking "Continue" dispatches the `unscramble-result` event with `success: false`.

### Correct State (`right`)

- **Condition:** All tokens are in slots in the correct order.
- **Footer:**
  - Primary Button: "Continue" (Enabled)
  - Secondary Button: Hidden
- **Visuals:** Tokens in the slots container must have a **green** background.
- **Action:** Clicking "Continue" dispatches the `unscramble-result` event with `success: true`. Success audio plays automatically upon reaching this state.

## 3. Events

- `unscramble-result`: Dispatched when the user clicks the primary button after all tokens are in slots.
  - `detail.success` (Boolean): `true` if correct, `false` if incorrect.
