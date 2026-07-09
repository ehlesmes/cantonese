/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __allExamples?: any[];
    __allVocab?: any[];
    __allChaptersData?: any[];
    preloadTexts?: (args: any[]) => void;
  }
}
