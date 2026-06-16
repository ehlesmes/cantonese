# Astro Web App Source (`src/`)

This directory contains the source code for the interactive Cantonese course
reader and renderer, built using Astro and Preact.

---

## 1. Directory Structure

```
src/
├── components/          # UI Components
│   ├── CantoneseExample.astro  # Standard example sentence component
│   └── DialogueBlock.astro     # Toggleable speaker dialog turns
├── layouts/
│   └── BaseLayout.astro        # Shared layout shell (header, footer, and container)
├── pages/
│   └── index.astro             # Chapter 1 prototype reader page
├── styles/
│   └── global.css              # Core typography, reset, and warm sepia theme variables
└── utils/
    └── markdown.js             # Custom markdown compiling and annotation tooltip parser
```

---

## 2. Rendering & Annotation System

Instead of relying on Astro's standard Markdown rendering, this application runs
a hybrid compilation pipeline:

1. **Chapter Blocks**: A chapter markdown file is parsed via
   `scripts/lib/parser.js` into distinct semantic blocks (`prose`, `cantonese`,
   `dialog`, and `exercise`).
2. **Standard Markdown**: Prose blocks are compiled using `marked` to support
   standard formatting (lists, headers, bold, italics).
3. **Custom Annotation Formatting**: Raw text is scanned for custom inline
   vocabulary units of the form `Characters[Jyutping|Translation]` (both with or
   without backticks).
4. **Interactive Tooltips**: These annotations are dynamically compiled into
   nested markup:
   ```html
   <span class="vocab-term"
     >Characters
     <span class="tooltip-popover"
       ><strong>Jyutping</strong><br />Translation</span
     >
   </span>
   ```

---

## 3. Styling Guidelines (Sepia & Compact Layout)

We use a warm, high-contrast **Sepia Palette** with **high information density**
(reduced margins and padding) to keep reading flow tight and efficient:

- **Background**: `#f4eedd` (warm cream)
- **Text**: `#362a22` (charcoal/espresso brown)
- **Accents**: `#b3501a` (terracotta) & `#5b7a5c` (sage)
- **Borders**: `#dfd6bf` (light tan)

All custom styles are declared in `src/styles/global.css`. Avoid adding large
margins or padding utility classes to keep page margins compact.

---

## 4. Interactive Components

- **Vocabulary Tooltips**: Driven purely by CSS hover selectors
  (`.vocab-term:hover .tooltip-popover`) to avoid heavy Javascript overhead and
  keep page loads instantaneous.
- **Dialogue Blocks**: Structured as Astro components. Toggle controls hide/show
  translations by altering CSS visibility classes.
- **Revealable Exercises**: Implemented using standard HTML `<details>` and
  `<summary>` elements to create lightweight static reveal panels for answers
  and explanations.
