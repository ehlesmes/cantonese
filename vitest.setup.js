import { vi } from "vitest";

// Mocking window.speechSynthesis and related APIs since Happy DOM doesn't have them
global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.lang = "";
    this.rate = 1.0;
    this.voice = null;
  }
};

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: "zh-HK", name: "Cantonese (Hong Kong)" }]),
  onvoiceschanged: null,
};

Object.defineProperty(global.window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
  configurable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(global.window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
