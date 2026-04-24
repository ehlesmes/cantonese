# Cantonese Learning App

A lightweight, component-focused web application for learning Cantonese. This project uses a "Pure Component" architecture, where all logic and styling are encapsulated within reusable Web Components.

## 🚀 Getting Started

1.  **Clone the repository.**
2.  **Open `reading.html` or `unscramble.html`** in a modern web browser.
3.  For the best experience, use a local development server (e.g., `npx serve .`).

## 🏗️ Project Structure

- `components/`: The heart of the application. Each UI element is a self-contained Web Component.
  - `ui/`: Generic reusable UI elements like `icon_button` and `tooltip`.
  - `shared/`: Global resources like `variables.css`, `shared_assets.js`, and `tts.js`.
- `audio/`: Repository for legacy or supplemental audio assets.

## 🎨 Design Philosophy

### 1. Component-First

The application is built entirely from Web Components. Avoid creating global JS or CSS files. Logic and styles must be encapsulated within components.

### 2. Complex Data Handling

To pass complex data (like lists or objects) to components via static HTML, use JSON-serialized strings in attributes:

```html
<unscramble-exercise
  tokens='[["你", "nei5"], ["好", "hou2"]]'
  translation="Hello"
>
</unscramble-exercise>
```

### 3. Audio & TTS

The application uses the browser's native **Web Speech API** for Text-to-Speech.

- Components automatically speak Cantonese using the `zh-HK` locale.
- Ensure your system has a Cantonese voice installed for the best experience.

### 4. Visual Consistency

Always utilize the CSS variables in `components/shared/variables.css` to ensure a unified Material Design aesthetic.

## 🛠️ Contribution Guidelines

- **Encapsulation:** Use Shadow DOM for all components.
- **Validation:** Components must validate that required attributes (like `tokens` or `cantonese-phrase`) are present and log loud console errors if they are missing.
- **Modularity:** Keep components small and focused on a single task.

Happy learning! 🇭🇰
