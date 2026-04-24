# Reading Page Component Requirements

The `reading-page` coordinates a `reading-exercise` and a `lesson-footer` to guide the user through a single reading task.

## 1. Data Input

The component accepts a single `data` object property:

- `cantonesePhrase` (String): The text in Cantonese characters.
- `romanization` (String): The Jyutping or other romanization.
- `translation` (String): The English meaning.

## 2. Component State Logic

The page maintains an internal `_state` to control the flow:

### Initial State (`initial`)

- **Exercise:** The translation is hidden (`translationHidden: true`).
- **Footer:**
  - Primary Button: "Reveal Answer"
  - Secondary Button: Hidden
- **Action:** Clicking the primary button transitions the page to the `revealed` state and triggers audio playback.

### Revealed State (`revealed`)

- **Exercise:** The translation is visible (`translationHidden: false`).
- **Footer:**
  - Primary Button: "Got it right"
  - Secondary Button: "Need practice"
- **Action:** Clicking either button dispatches the `reading-result` event.

## 3. Events

- `reading-result`: Dispatched when the user makes a final assessment in the `revealed` state.
  - `detail.success` (Boolean): `true` if "Got it right" was clicked, `false` if "Need practice" was clicked.
