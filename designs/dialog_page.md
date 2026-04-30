# Design: Dialog Page

## Objective

Implement a new `dialog` page type for lessons to display conversations between two or more
speakers. The dialog lines will be defined inline within the lesson JSON and will support automatic
voice differentiation using the existing TTS utility.

## Key Files & Context

- `schemas/lessons.js`: Needs updates to validate the new `dialog` page type.
- `components/shared/tts.js`: Needs updates to handle different voices or fallbacks based on speaker
  ID.
- `components/dialog_page/`: New component for rendering the whole dialog sequence.
- `components/dialog_line/`: New component for individual dialog lines.
- `components/lesson_viewer/lesson_viewer.js`: Must import `dialog_page` so it self-registers.
- `data/lessons/1/1.1.json` and `data/lessons/1/1.2.json`: Will be updated with sample dialog pages.

## Implementation Steps

### 1. Update Lesson Schema (`schemas/lessons.js`)

Add validation for the `dialog` page and its lines:

```javascript
const dialogLine = {
  speaker: Validators.isString,
  cantonese: Validators.isString,
  romanization: Validators.isString,
  translation: Validators.isString,
};

const dialogPage = {
  ...pageBase,
  type: (val) => val === "dialog",
  lines: [dialogLine],
};
```

Add `"dialog"` to `pageBase.type` valid types. Add `dialog: dialogPage` to the `schemas` map in
`lessonDetail.pages`.

### 2. Enhance TTS Service (`components/shared/tts.js`)

Update `speakCantonese(text, options = {})` to accept a `speakerId`.

- Extract a list of all matching Cantonese voices.
- Use the speaker ID (e.g., 'A', 'B') to assign a specific voice index.
- If only one voice is available, use standard parameters for the primary speaker and alter `pitch`
  (e.g., 0.8) and `rate` (e.g., 0.9) for alternate speakers.

### 3. Create `dialog-line` Component

- Create `components/dialog_line/dialog_line.js`, `style.css`, and `dialog_line.test.js`.
- Provide a `data` setter that accepts `{ speaker, cantonese, romanization, translation }`.
- Render a speaker avatar/bubble, the text, and a play button.
- Bind the play button to `speakCantonese(text, { speakerId: speaker })`.

### 4. Create `dialog-page` Component

- Create `components/dialog_page/dialog_page.js`, `style.css`, and `dialog_page.test.js`.
- Provide a `data` setter that accepts the `dialog` page definition.
- State management: Track the `currentLineIndex` (starting at 0).
- Map over `data.lines` up to `currentLineIndex` and dynamically create `dialog-line` elements.
- Render a "Next Line" button. Clicking it increments `currentLineIndex` and shows the next line.
- Once all lines are shown, the button should change to "Continue". Clicking it emits the `next`
  event, similar to `explanation-page`.
- Register the component in `PageRegistry`.

### 5. Update Lesson Viewer (`components/lesson_viewer/lesson_viewer.js`)

- Import `../dialog_page/dialog_page.js` to ensure the component self-registers when the application
  boots.

### 6. Update Lesson Data (`data/lessons/1/*.json`)

- Add a dialog page to `1.1.json` (e.g., a simple "Hello" conversation between speakers A and B).
- Add a dialog page to `1.2.json` (e.g., asking "How are you?").

## Verification & Testing

- Write unit tests for `dialog_page` and `dialog_line`.
- Ensure schema validation passes.
- Serve the application and verify that navigating to lesson 1.1 shows the dialog page.
- Test the play buttons on dialog lines to verify that voices alternate correctly.
