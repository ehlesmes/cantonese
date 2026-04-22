# Cantonese Learning App

A lightweight, component-focused web application for learning Cantonese. This project uses a "Pure Component" architecture, where all logic and styling are encapsulated within reusable Web Components.

## 🚀 Getting Started

1.  **Clone the repository.**
2.  **Open `eraseme.html`** (or any HTML file using the components) in a modern web browser.
3.  For the best experience, use a local development server (e.g., `npx serve .`).

## 🏗️ Project Structure

-   `components/`: The heart of the application. Each UI element is a self-contained Web Component.
    -   `shared/`: Global resources like `variables.css` and `shared_assets.js`.
-   `audio/`: Audio assets for exercises and lessons.

## 🎨 Design Philosophy

### 1. Component-First
The application is built entirely from Web Components. Avoid creating global JS or CSS files. If a feature is needed, it should be a component or a shared utility within `components/shared/`.

### 2. Complex Data Handling
To pass complex data (like lists or objects) to components via static HTML, use JSON-serialized strings in attributes:
```html
<unscramble-exercise 
  tokens='[["你", "nei5"], ["好", "hou2"]]'
  translation="Hello"
  audio-path="/audio/1.m4a">
</unscramble-exercise>
```

### 3. Visual Consistency
Always utilize the CSS variables in `components/shared/variables.css` to ensure a unified Material Design aesthetic.

## 🛠️ Contribution Guidelines

-   **Encapsulation:** Use Shadow DOM for all components.
-   **Validation:** Components must validate that required attributes (like `tokens` or `audio-path`) are present and log loud console errors if they are missing.
-   **Modularity:** Keep components small and focused on a single task.

Happy learning! 🇭🇰
