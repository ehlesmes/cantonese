/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __allExamples?: import("../types/index.js").ClientExample[];
  __allVocab?: import("../types/index.js").ClientVocab[];
  __allChaptersData?: import("../types/index.js").ClientChapterData[];
  preloadTexts?: (items: (string | { text: string; hash: string })[]) => void;
}
