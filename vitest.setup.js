import { vi, afterEach } from "vitest";

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

// Global console.error spy to keep test output clean and catch unexpected errors
vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  // Check if console.error was called unexpectedly.
  // Tests that EXPECT an error should call console.error.mockClear() or similar.
  const errorCalls = vi.mocked(console.error).mock.calls;
  if (errorCalls.length > 0) {
    const lastCall = errorCalls[errorCalls.length - 1];
    // We throw to make the test fail if there's an unexpected console.error
    // but we clear the mock first so it doesn't pollute the next test.
    vi.mocked(console.error).mockClear();
    throw new Error(
      `Unexpected console.error call: ${lastCall.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ")}`,
    );
  }
});
