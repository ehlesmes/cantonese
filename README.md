# Cantonese Learning App

A lightweight, component-focused web application for learning Cantonese. This project uses a **Class-based Shadow DOM** architecture, where UI elements are encapsulated within reusable JavaScript classes that manage their own styling and logic via the Shadow DOM.

## 🚀 Getting Started

1.  **Clone the repository.**
2.  **Open `demo_lesson.html`** in a modern web browser.
3.  For the best experience, use a local development server (e.g., `npx serve .`).

## 🏗️ Project Structure

- `components/`: The heart of the application. Each UI element is a self-contained Class.
  - `ui/`: Generic reusable UI elements like `IconButton` and `Tooltip`.
  - `shared/`: Global resources like `variables.css`, `shared_assets.js`, and `tts.js`.
- `audio/`: Repository for legacy or supplemental audio assets.

## 🎨 Design Philosophy

### 1. Component Classes

The application is built using a custom `Component` base class. Avoid creating global JS or CSS files. Logic and styles must be encapsulated within the component class.

### 2. Manual Instantiation

Components are instantiated programmatically in JavaScript.

```javascript
import { ReadingPage } from "./components/reading_page/reading_page.js";
const page = new ReadingPage({
  cantonesePhrase: "你好",
  romanization: "nei5 hou2",
  translation: "Hello",
});
document.body.appendChild(page.element);
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
