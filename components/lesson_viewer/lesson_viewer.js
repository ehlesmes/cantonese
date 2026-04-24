import "/components/lesson_header/lesson_header.js";
import "/components/reading_page/reading_page.js";
import "/components/unscramble_page/unscramble_page.js";
import "/components/explanation_page/explanation_page.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="/components/lesson_viewer/style.css" />
<div class="lesson-container">
  <div id="header-root"></div>
  <main id="m"></main>
</div>
`;

export class LessonViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._headerRoot = this.shadowRoot.getElementById("header-root");
    this._header = null;
    this._main = this.shadowRoot.getElementById("m");

    this._data = {
      lessonId: "",
      lessonName: "",
    };

    this._lessonData = null;
    this._currentPageIndex = 0;
    this._pageCache = new Map(); // Store exercise data
    this._loadPromise = Promise.resolve();
  }

  get data() {
    return this._data;
  }
  set data(val) {
    const oldId = this._data.lessonId;
    this._data = { ...this._data, ...val };
    this.update();

    if (this._data.lessonId && this._data.lessonId !== oldId) {
      this._loadPromise = this.loadLesson(this._data.lessonId);
    }
  }

  /**
   * Returns a promise that resolves when the current loading task is complete.
   * Useful for testing and coordinating transitions.
   */
  get ready() {
    return this._loadPromise;
  }

  connectedCallback() {
    this._upgradeProperty("data");

    // Header Navigation Listeners (on shadowRoot as they are internal)
    this.shadowRoot.addEventListener("restart", () => this.navigateTo(0));
    this.shadowRoot.addEventListener("prev", () =>
      this.navigateTo(this._currentPageIndex - 1),
    );
    this.shadowRoot.addEventListener("next", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this.shadowRoot.addEventListener("close", () => {
      console.warn("Lesson closed (Main menu navigation not implemented)");
    });

    // Page Event Listeners (on _main container to catch bubbling events from dynamic children)
    this._main.addEventListener("reading-result", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this._main.addEventListener("unscramble-result", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );
    this._main.addEventListener("explanation-complete", () =>
      this.navigateTo(this._currentPageIndex + 1),
    );

    this.update();
  }

  _upgradeProperty(prop) {
    if (Object.hasOwn(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  validate() {
    if (!this._data.lessonId) {
      console.error(
        "🚨 [LessonViewer ERROR]: Missing required data property 'lessonId'!",
      );
    }
  }

  async loadLesson(lessonId) {
    try {
      // Hierarchical ID format: chapter.lesson (e.g. 1.1)
      const [chapter] = lessonId.split(".");
      const response = await fetch(`/data/lessons/${chapter}/${lessonId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load lesson: ${lessonId}`);
      }

      this._lessonData = await response.json();
      this._data.lessonName = this._lessonData.name;
      this._currentPageIndex = 0;

      this.update();
      this.renderPage(0);

      // Background pre-fetch atomic exercises
      this.prefetchExercises();
    } catch {
      console.error("🚨 [LessonViewer ERROR]: Failed to load lesson data");
    }
  }

  async prefetchExercises() {
    if (!this._lessonData) {
      return;
    }
    const [chapter, lessonNum] = this._data.lessonId.split(".");

    for (const page of this._lessonData.pages) {
      if (page.type === "reading" || page.type === "unscramble") {
        const url = `/data/exercises/${chapter}/${lessonNum}/${page.id}.json`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => this._pageCache.set(page.id, data))
          .catch(() => console.warn(`Failed to prefetch exercise ${page.id}`));
      }
    }
  }

  async renderPage(index) {
    if (
      !this._lessonData ||
      index < 0 ||
      index >= this._lessonData.pages.length
    ) {
      return;
    }

    const pageDef = this._lessonData.pages[index];
    this._main.innerHTML = '<div class="loading">Loading...</div>';

    let pageData;
    if (pageDef.type === "explanation") {
      pageData = { content: pageDef.content };
    } else {
      // Check cache for exercise data
      pageData = this._pageCache.get(pageDef.id);
      if (!pageData) {
        try {
          const [chapter, lessonNum] = this._data.lessonId.split(".");
          const response = await fetch(
            `/data/exercises/${chapter}/${lessonNum}/${pageDef.id}.json`,
          );
          pageData = await response.json();
          this._pageCache.set(pageDef.id, pageData);
        } catch {
          this._main.innerHTML = `<div class="error">Failed to load page: ${pageDef.id}</div>`;
          return;
        }
      }
    }

    const el = document.createElement(`${pageDef.type}-page`);
    el.data = pageData;

    this._main.innerHTML = "";
    this._main.appendChild(el);
    this._main.scrollTop = 0;
  }

  navigateTo(index) {
    if (!this._lessonData) {
      return Promise.resolve();
    }
    if (index < 0 || index >= this._lessonData.pages.length) {
      console.warn("End of lesson or out of bounds navigation attempted");
      return Promise.resolve();
    }
    this._currentPageIndex = index;
    this._loadPromise = this.renderPage(index);
    return this._loadPromise;
  }

  update() {
    if (!this.shadowRoot) return;

    if (this.isConnected) {
      this.validate();
    }

    // Truly lazy-create the header only when we have a name to give it
    if (!this._header && this._headerRoot && this._data.lessonName) {
      this._header = document.createElement("lesson-header");
      this._header.id = "header";
      // We set the data BEFORE appending to DOM so the header connects in a valid state
      this._header.data = { lessonName: this._data.lessonName };
      this._headerRoot.appendChild(this._header);
    } else if (this._header && this._data.lessonName) {
      this._header.data = { lessonName: this._data.lessonName };
    }
  }
}

if (!customElements.get("lesson-viewer")) {
  customElements.define("lesson-viewer", LessonViewer);
}
