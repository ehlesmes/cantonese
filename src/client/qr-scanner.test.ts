/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { startScanner, stopScanner } from "./qr-scanner.js";
import jsQR from "jsqr";

vi.mock("jsqr", () => ({
  default: vi.fn(),
}));

describe("QR Scanner Utility Spec", () => {
  let mockVideo: any;
  let mockVideoWrapper: any;
  let mockCanvas: any;
  let mockContext: any;
  let mockStream: any;
  let originalMediaDevices: any;

  beforeEach(() => {
    // 1. Create mock DOM elements
    mockVideo = document.createElement("video");
    mockVideoWrapper = document.createElement("div");
    mockCanvas = document.createElement("canvas");
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      }),
    };
    mockCanvas.getContext = vi.fn().mockReturnValue(mockContext);

    // 2. Mock getUserMedia and stream
    mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };

    originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => {
      return 123;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  test("startScanner success path", async () => {
    const onStatus = vi.fn();
    const onDecoded = vi.fn();

    // Trigger startScanner
    startScanner(mockVideo, mockVideoWrapper, mockCanvas, onStatus, onDecoded);

    expect(onStatus).toHaveBeenCalledWith("Accessing camera...");
    expect(mockVideoWrapper.style.display).toBe("none");

    // Wait for the getUserMedia promise resolution
    await new Promise(process.nextTick);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
    expect(mockVideo.srcObject).toBe(mockStream);
    expect(mockVideo.getAttribute("playsinline")).toBe("true");

    // Simulate metadata loaded to trigger layout & ticks
    mockVideo.dispatchEvent(new Event("loadedmetadata"));

    expect(mockVideoWrapper.style.display).toBe("block");
    expect(onStatus).toHaveBeenCalledWith("Point camera at the QR code...");
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  test("startScanner camera permission error path", async () => {
    const onStatus = vi.fn();
    const onDecoded = vi.fn();

    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new Error("Permission Denied"),
    );

    startScanner(mockVideo, mockVideoWrapper, mockCanvas, onStatus, onDecoded);

    // Wait for mock rejection
    await new Promise(process.nextTick);

    expect(onStatus).toHaveBeenCalledWith(
      "Camera access denied or unavailable.",
    );
    expect(mockVideoWrapper.style.display).toBe("none");
  });

  test("stopScanner cleans up resources", async () => {
    const onStatus = vi.fn();
    const onDecoded = vi.fn();

    // First start the scanner so videoStream module variable is set
    startScanner(mockVideo, mockVideoWrapper, mockCanvas, onStatus, onDecoded);
    await new Promise(process.nextTick);

    // Call stopScanner
    stopScanner(mockVideo, mockVideoWrapper);

    const track = mockStream.getTracks()[0];
    expect(track.stop).toHaveBeenCalled();
    expect(mockVideo.srcObject).toBeNull();
    expect(mockVideoWrapper.style.display).toBe("none");
  });

  test("tickScanner runs callback and handles sync/async return values gracefully", async () => {
    // Setup mock properties on HTMLMediaElement/video
    Object.defineProperty(mockVideo, "HAVE_ENOUGH_DATA", {
      writable: true,
      configurable: true,
      value: 4,
    });
    Object.defineProperty(mockVideo, "readyState", {
      writable: true,
      configurable: true,
      value: 4,
    });
    Object.defineProperty(mockVideo, "videoWidth", {
      writable: true,
      configurable: true,
      value: 640,
    });
    Object.defineProperty(mockVideo, "videoHeight", {
      writable: true,
      configurable: true,
      value: 480,
    });

    // Simulate successful QR code detection
    vi.mocked(jsQR).mockReturnValue({ data: "scanned-token-payload" } as any);

    // 1. Test asynchronous callback (resolves after delay)
    const onStatus = vi.fn();
    let resolvePromise: ((value: any) => void) | undefined;
    const asyncCallback = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolvePromise = resolve;
      });
    });

    // We start scanner to initialize the stream
    startScanner(
      mockVideo,
      mockVideoWrapper,
      mockCanvas,
      onStatus,
      asyncCallback,
    );
    await new Promise(process.nextTick);

    // Simulate metadata load to invoke tickScanner registration
    mockVideo.dispatchEvent(new Event("loadedmetadata"));

    // Manually run the tick logic (requestAnimationFrame handler function)
    const frameCallback = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;
    expect(frameCallback).toBeDefined();

    // Call it to trigger single tick
    if (frameCallback) frameCallback();

    expect(jsQR).toHaveBeenCalled();
    expect(asyncCallback).toHaveBeenCalledWith("scanned-token-payload");

    // Resolve the callback promise and wait
    if (resolvePromise) resolvePromise("done");
    await new Promise(process.nextTick);

    // 2. Test synchronous callback (returns undefined immediately)
    vi.mocked(jsQR).mockClear();
    vi.mocked(jsQR).mockReturnValue({ data: "second-token" } as any);

    const syncCallback = vi.fn().mockReturnValue(undefined);

    // Reset call stack and re-trigger startScanner
    vi.mocked(window.requestAnimationFrame).mockClear();
    startScanner(
      mockVideo,
      mockVideoWrapper,
      mockCanvas,
      onStatus,
      syncCallback,
    );
    await new Promise(process.nextTick);

    mockVideo.dispatchEvent(new Event("loadedmetadata"));
    const secondFrameCallback = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;

    // This should run without throwing a TypeError: Cannot read properties of undefined (reading 'finally')
    expect(() => secondFrameCallback()).not.toThrow();
    expect(syncCallback).toHaveBeenCalledWith("second-token");
  });

  test("should preserve aspect ratio and scale dimensions correctly for portrait video sources", async () => {
    Object.defineProperty(mockVideo, "HAVE_ENOUGH_DATA", {
      writable: true,
      configurable: true,
      value: 4,
    });
    Object.defineProperty(mockVideo, "readyState", {
      writable: true,
      configurable: true,
      value: 4,
    });
    // Set portrait dimensions (height > width)
    Object.defineProperty(mockVideo, "videoWidth", {
      writable: true,
      configurable: true,
      value: 480,
    });
    Object.defineProperty(mockVideo, "videoHeight", {
      writable: true,
      configurable: true,
      value: 640,
    });

    vi.mocked(jsQR).mockReturnValue(null); // No QR code detected

    startScanner(mockVideo, mockVideoWrapper, mockCanvas, vi.fn(), vi.fn());
    await new Promise(process.nextTick);
    mockVideo.dispatchEvent(new Event("loadedmetadata"));

    const frameCallback = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;
    vi.mocked(window.requestAnimationFrame).mockClear();

    frameCallback();

    // Verify callback was registered for requestAnimationFrame and run it to cover arrow body
    const nextFrameArrowFn = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;
    expect(nextFrameArrowFn).toBeDefined();
    nextFrameArrowFn();

    // Verify canvas was resized based on height limit (maxDim = 480)
    // Target height is 480. Width scales to (480 * 480) / 640 = 360px
    expect(mockCanvas.width).toBe(360);
    expect(mockCanvas.height).toBe(480);
  });

  test("should prevent camera preview freezing by continuing frame scheduling during active scan processing", async () => {
    Object.defineProperty(mockVideo, "HAVE_ENOUGH_DATA", {
      writable: true,
      configurable: true,
      value: 4,
    });
    Object.defineProperty(mockVideo, "readyState", {
      writable: true,
      configurable: true,
      value: 4,
    });
    Object.defineProperty(mockVideo, "videoWidth", {
      writable: true,
      configurable: true,
      value: 640,
    });
    Object.defineProperty(mockVideo, "videoHeight", {
      writable: true,
      configurable: true,
      value: 480,
    });

    // Simulate successful QR code detection
    vi.mocked(jsQR).mockReturnValue({ data: "scanned-token" } as any);

    // Return a promise that remains unresolved during the test duration
    const asyncCallback = vi.fn().mockImplementation(() => {
      return new Promise(() => {});
    });

    startScanner(
      mockVideo,
      mockVideoWrapper,
      mockCanvas,
      vi.fn(),
      asyncCallback,
    );
    await new Promise(process.nextTick);
    mockVideo.dispatchEvent(new Event("loadedmetadata"));

    const frameCallback = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;

    // 1. First tick triggers the scan
    frameCallback();
    expect(asyncCallback).toHaveBeenCalledTimes(1);

    // 2. Second tick happens while asyncCallback is still processing (isProcessing === true)
    // Reset our requestAnimationFrame spy to check if it's called
    vi.mocked(window.requestAnimationFrame).mockClear();
    vi.mocked(jsQR).mockClear();

    frameCallback();

    // The tick should schedule the next frame (no camera freeze) but skip processing (no jsqr thrashing)
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    expect(jsQR).not.toHaveBeenCalled();

    // Run the scheduled arrow function callback to cover the early return loop body
    const freezePreventArrowFn = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;
    expect(freezePreventArrowFn).toBeDefined();
    freezePreventArrowFn();
  });

  test("tickScanner missing branches", async () => {
    // We need to call tickScanner directly to hit specific edge cases
    // We will simulate the `videoStream` being null, `ctx` being null, and video dimensions being small.
    // To do this, we import tickScanner or we trigger it via requestAnimationFrame.
    // Since tickScanner is not exported, we will trigger it by starting and stopping to control state.

    // 1. hit videoStream falsy during isProcessing
    // 2. hit ctx falsy
    // 3. hit videoWidth <= maxDim && videoHeight <= maxDim
    // 4. hit videoStream falsy at the end of tickScanner

    vi.mocked(jsQR).mockReturnValue(null);

    // Mock getContext to return null for the first call
    mockCanvas.getContext = vi
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValue(mockContext);

    // Mock both readyState and HAVE_ENOUGH_DATA to 4
    Object.defineProperty(mockVideo, "HAVE_ENOUGH_DATA", {
      configurable: true,
      get: () => 4,
    });
    Object.defineProperty(mockVideo, "readyState", {
      configurable: true,
      get: () => 4,
    });
    // Set small dimensions
    Object.defineProperty(mockVideo, "videoWidth", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(mockVideo, "videoHeight", {
      configurable: true,
      get: () => 100,
    });

    vi.mocked(jsQR).mockReturnValue(null);

    // Mock getContext to return null for the first call
    mockCanvas.getContext = vi
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValue(mockContext);

    // Call startScanner to initialize stream and get tick registered
    startScanner(mockVideo, mockVideoWrapper, mockCanvas, vi.fn(), vi.fn());
    await new Promise(process.nextTick);
    mockVideo.dispatchEvent(new Event("loadedmetadata"));

    const frameCallback = vi.mocked(window.requestAnimationFrame).mock
      .calls[0]?.[0] as unknown as Function;
    vi.mocked(window.requestAnimationFrame).mockClear();

    // Call 1: ctx is null. Returns early without doing jsQR.
    frameCallback();
    expect(jsQR).not.toHaveBeenCalled();

    // Call 2: normal call, small dimensions (<= 480).
    frameCallback();

    // Call 3: stopScanner makes videoStream null. Then frameCallback is called.
    vi.mocked(window.requestAnimationFrame).mockClear();
    stopScanner(mockVideo, mockVideoWrapper);
    frameCallback();

    // Check that requestAnimationFrame wasn't called again because videoStream is null
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    // Call 4: isProcessing is true, and videoStream is null.
    // We need to fake isProcessing = true. To do this, we need a successful scan.
    let resolveScan: any;
    const asyncCallback = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveScan = resolve;
      });
    });

    startScanner(
      mockVideo,
      mockVideoWrapper,
      mockCanvas,
      asyncCallback,
      vi.fn(),
    );
    await new Promise(process.nextTick);
    mockVideo.dispatchEvent(new Event("loadedmetadata"));
    vi.mocked(jsQR).mockReturnValue({ data: "token" } as any);

    const frameCallback3 = vi
      .mocked(window.requestAnimationFrame)
      .mock.calls.pop()?.[0] as unknown as Function;
    vi.mocked(window.requestAnimationFrame).mockClear();

    // trigger scan -> isProcessing = true
    frameCallback3();
    expect(asyncCallback).toHaveBeenCalled();
    vi.mocked(window.requestAnimationFrame).mockClear();

    // stopScanner -> videoStream = null
    stopScanner(mockVideo, mockVideoWrapper);

    // call tick -> hits isProcessing && !videoStream
    frameCallback3();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    resolveScan();
  });
});

export {};
