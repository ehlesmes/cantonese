# Cantonese Learning App

An interactive web application designed to help users learn Cantonese from A1 to C1 proficiency. 

## Features
- Structured lessons focusing on listening and reading.
- Each lesson includes:
  - Clear learning goals.
  - Grammar and vocabulary explanations.
  - 10-20 interactive exercises.
- Romanization support for all text.
- Static site architecture with browser-based progress tracking.

## Getting Started

Because the app uses `fetch()` to load lesson data, you need to run it through a local web server to avoid CORS issues.

### Option 1: Using Node.js (npx)
If you have Node.js installed, run:
```bash
npx serve .
```

### Option 2: Using Python
If you have Python installed, run:
```bash
python3 -m http.server
```

### Option 3: VS Code
If you use VS Code, you can use the **Live Server** extension.

Once the server is running, open the provided URL (usually `http://localhost:3000` or `http://localhost:8000`) in your browser.

## Project Structure
- `README.md`: Project overview and current status.
- `PLAN.md`: Roadmap and development milestones.
- `CHANGELOG.md`: Record of changes, experiments, and project history.

## Status
- **Phase:** Prototype Refinement
- **Current Focus:** Polishing the UI/UX and finalizing core functionality for the A1 pilot.
- **Architecture:** Static site with browser-based state management (LocalStorage).

*For more details on progress, see [PLAN.md](PLAN.md) and [CHANGELOG.md](CHANGELOG.md).*
