# Cantonese Learning App

A static, component-based web application for learning Cantonese through lessons and interactive exercises. The application prioritizes simplicity, modularity, and a consistent visual style.

## 🚀 Getting Started

Since this is a static site with no build step, you can get up and running instantly.

1.  **Clone the repository.**
2.  **Open `index.html`** in any modern web browser.
3.  Alternatively, for a better development experience with modules, serve the project using a local server (e.g., `npx serve .` or Live Server in VS Code).

## 🏗️ Project Structure

The project is organized around modular Web Components:

-   `components/`: Contains all reusable UI elements.
    -   Each component has its own folder with a `.js` and `style.css` file.
    -   `shared/`: Contains global styles like `variables.css` (the source of truth for colors and layout) and `shared_assets.js`.
-   `audio/`: Repository for all lesson audio files.
-   `css/`: Global application styles (non-component specific).
-   `js/`: Global application logic and data fetching.

## 🎨 Best Practices & Contributions

We follow a strict modular architecture. When contributing, please adhere to these standards:

### 1. Modular Components
-   **No Monoliths:** Do not put all logic in a single file. Break UI elements into small, testable Web Components.
-   **Shadow DOM:** Always use the Shadow DOM to encapsulate styles and behavior.
-   **Naming:** Use semantic names for components (e.g., `reading-exercise`) and their files.

### 2. Style Consistency
-   **CSS Variables:** Always use variables defined in `components/shared/variables.css` (e.g., `--md-sys-color-primary`, `--md-sys-spacing-unit`).
-   **No Hardcoding:** Never hardcode hex colors or pixel values that should be shared across the app.
-   **Material Aesthetic:** Aim for a clean, modern look with subtle shadows and consistent whitespace.

### 3. Engineering Quality
-   **Semantic HTML:** Use proper tags like `<button>`, `<main>`, and `<header>` for accessibility.
-   **Error Handling:** Components should fail loudly with clear console errors if required attributes (like `audio-path`) are missing or malformed.
-   **Vanilla JS:** Use native browser APIs. Avoid external dependencies to keep the project lightweight and portable.

## 🛠️ Contribution Workflow

1.  **Research:** Analyze the current components to understand established patterns.
2.  **Modularize:** Design your changes as surgical updates or new components.
3.  **Validate:** Always test your changes in the context of the app (e.g., using `eraseme.html` for component isolation) before submitting.

Happy learning and coding! 🇭🇰
