/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import {
  serializeState,
  deserializeState,
  mergeStates,
  saveLocalState,
  getLocalState,
} from "../src/utils/sync.js";
import {
  packSDPData,
  unpackSDPData,
  parseSDP,
  rebuildSDP,
} from "../src/utils/webrtc.js";

describe("Progress Sync Utility Spec", () => {
  test("serialization and deserialization roundtrip preserves progress state", async () => {
    const originalState = {
      chapters: ["pronunciation-tones", "greetings", "dining-out"],
      srs: {
        "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
        "phr-5-abcde": { level: 5, lastReviewed: 1718985900000 },
      },
      vocab: {
        "vocab-你好_neihhou": { level: 1, lastReviewed: 1718985700000 },
        "vocab-smart-quote-’": { level: 4, lastReviewed: 1718985800000 },
      },
    };

    const serialized = await serializeState(originalState);
    expect(typeof serialized).toBe("string");
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = await deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized.chapters).toEqual([
      "pronunciation-tones",
      "greetings",
      "dining-out",
    ]);

    // Check phrasebook srs
    expect(deserialized.srs["phr-11-1v3vktn"]).toBeDefined();
    expect(deserialized.srs["phr-11-1v3vktn"].level).toBe(2);
    expect(deserialized.srs["phr-11-1v3vktn"].lastReviewed).toBe(1718985600000);
    expect(deserialized.srs["phr-5-abcde"].level).toBe(5);
    expect(deserialized.srs["phr-5-abcde"].lastReviewed).toBe(1718985900000);

    // Check vocabulary srs
    expect(deserialized.vocab["vocab-你好_neihhou"]).toBeDefined();
    expect(deserialized.vocab["vocab-你好_neihhou"].level).toBe(1);
    expect(deserialized.vocab["vocab-你好_neihhou"].lastReviewed).toBe(
      1718985700000,
    );
    expect(deserialized.vocab["vocab-smart-quote-’"]).toBeDefined();
    expect(deserialized.vocab["vocab-smart-quote-’"].level).toBe(4);
    expect(deserialized.vocab["vocab-smart-quote-’"].lastReviewed).toBe(
      1718985800000,
    );

    expect(deserialized.timestamp).toBeGreaterThan(0);
  });

  test("fallback serialization and deserialization roundtrip (pure JS) preserves progress state", async () => {
    // Temporarily delete native methods to force fallback code execution
    const origToBase64 = Uint8Array.prototype.toBase64;
    const origFromBase64 = Uint8Array.fromBase64;
    delete Uint8Array.prototype.toBase64;
    delete Uint8Array.fromBase64;

    try {
      const originalState = {
        chapters: ["pronunciation-tones", "greetings", "dining-out"],
        srs: {
          "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
        },
        vocab: {
          "vocab-你好_neihhou": { level: 1, lastReviewed: 1718985700000 },
          "vocab-smart-quote-’": { level: 4, lastReviewed: 1718985800000 },
        },
      };

      const serialized = await serializeState(originalState);
      expect(typeof serialized).toBe("string");
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = await deserializeState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized.chapters).toEqual([
        "pronunciation-tones",
        "greetings",
        "dining-out",
      ]);
      expect(deserialized.vocab["vocab-smart-quote-’"].level).toBe(4);
    } finally {
      // Restore native methods
      Uint8Array.prototype.toBase64 = origToBase64;
      Uint8Array.fromBase64 = origFromBase64;
    }
  });

  test("deserialization handles Base64 strings with spaces (plus signs replaced by URL decoding)", async () => {
    const originalState = {
      chapters: ["pronunciation-tones", "greetings"],
      srs: {
        "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
      },
      vocab: {},
    };

    const serialized = await serializeState(originalState);

    // Convert any URL-safe '-' back to '+' (or standard base64 '+') and replace with spaces
    // to simulate standard browser URLSearchParams parsing.
    const base64WithPlus = serialized.replace(/-/g, "+");
    const base64WithSpace = base64WithPlus.replace(/\+/g, " ");

    const deserialized = await deserializeState(base64WithSpace);
    expect(deserialized).not.toBeNull();
    expect(deserialized.chapters).toEqual(["pronunciation-tones", "greetings"]);
    expect(deserialized.srs["phr-11-1v3vktn"].level).toBe(2);
  });

  test("deserialization returns null for corrupted/invalid strings", async () => {
    const badState = await deserializeState("invalid-base64-string!");
    expect(badState).toBeNull();
  });

  test("deserialization throws for invalid Base64 characters explicitly inside decoder", async () => {
    // Specifically test base64UrlToBytes throwing "Invalid Base64 character"
    // pass a string with a character not in our alphabet but with correct length structure
    const badState = await deserializeState("abc%123");
    expect(badState).toBeNull();
  });

  test("deserialization fallback to TextDecoder when decompress fails", async () => {
    // Construct a plain JSON string (uncompressed), convert to base64url,
    // and verify it deserializes correctly.

    // We mock compacted keys but let's just make it a valid state object
    const compacted = {
      c: ["greetings"],
      s: {},
      v: {},
      t: 1234567890,
    };
    const base64Plain = btoa(JSON.stringify(compacted))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const deserialized = await deserializeState(base64Plain);
    expect(deserialized).not.toBeNull();
    expect(deserialized.chapters).toEqual(["greetings"]);
    expect(deserialized.timestamp).toBe(1234567890);
  });

  test("deserialization fails when payload is not an object", async () => {
    // Base64 of '"just a string"'
    const base64Str = btoa('"just a string"')
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const result = await deserializeState(base64Str);
    expect(result).toBeNull();
  });

  test("deserialization fails when decompression and decoding both throw", async () => {
    // Pass a valid base64 string that contains invalid UTF-8 bytes to trigger TextDecoder failure
    // e.g. 0xFF which is invalid UTF-8 (base64 url safe for [255, 255, 255] is "____")
    const result = await deserializeState("____");
    expect(result).toBeNull();
  });

  test("deserialization fallback to TextDecoder when DecompressionStream is missing", async () => {
    const originalDecompress = global.DecompressionStream;
    delete global.DecompressionStream;
    try {
      const compacted = { c: ["greetings"] };
      const base64Plain = btoa(JSON.stringify(compacted))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      const result = await deserializeState(base64Plain);
      expect(result).not.toBeNull();
      expect(result.chapters).toEqual(["greetings"]);
    } finally {
      global.DecompressionStream = originalDecompress;
    }
  });

  test("serialization fallback to plain JSON when CompressionStream is missing", async () => {
    const originalCompress = global.CompressionStream;
    delete global.CompressionStream;
    try {
      const state = { chapters: ["greetings"] };
      const serialized = await serializeState(state);
      expect(serialized).toBeDefined();
      const deserialized = await deserializeState(serialized);
      expect(deserialized.chapters).toEqual(["greetings"]);
    } finally {
      global.CompressionStream = originalCompress;
    }
  });

  test("deserialization handles null, undefined, or empty string gracefully", async () => {
    expect(await deserializeState(null)).toBeNull();
    expect(await deserializeState(undefined)).toBeNull();
    expect(await deserializeState("")).toBeNull();
    expect(await deserializeState("   ")).toBeNull();
  });

  test("deserialization discards legacy indexed phrasebook progress keys starting with ch", async () => {
    // Construct a payload containing keys like "ch0-1" inside srs
    const originalState = {
      chapters: ["pronunciation-tones"],
      srs: {
        "ch0-1": { level: 2, lastReviewed: 1718985600 },
        "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600 },
      },
      vocab: {},
    };
    const serialized = await serializeState(originalState);
    const deserialized = await deserializeState(serialized);
    expect(deserialized.srs["ch0-1"]).toBeUndefined();
    expect(deserialized.srs["phr-11-1v3vktn"]).toBeDefined();
  });

  test("mergeStates successfully unions chapters", () => {
    const local = {
      chapters: ["pronunciation-tones", "greetings"],
      srs: {},
      vocab: {},
    };
    const imported = {
      chapters: ["pronunciation-tones", "dining-out"],
      srs: {},
      vocab: {},
    };

    const merged = mergeStates(local, imported);
    expect(merged.chapters).toEqual([
      "dining-out",
      "greetings",
      "pronunciation-tones",
    ]);
  });

  test("mergeStates applies latest-timestamp-wins logic for overlapping items", () => {
    const local = {
      chapters: ["pronunciation-tones"],
      srs: {
        // Laptop reviewed this more recently (yesterday vs last week)
        "item-conflict-local-newer": { level: 2, lastReviewed: 1718985600000 },
        // Phone reviewed this more recently
        "item-conflict-imported-newer": {
          level: 1,
          lastReviewed: 1718900000000,
        },
        // Unique to laptop
        "item-local-only": { level: 4, lastReviewed: 1718985600000 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 3, lastReviewed: 1718985600000 },
        "vocab-conflict-imported-newer": {
          level: 1,
          lastReviewed: 1718900000000,
        },
        "vocab-local-only": { level: 5, lastReviewed: 1718985600000 },
      },
    };

    const imported = {
      chapters: ["pronunciation-tones"],
      srs: {
        "item-conflict-local-newer": { level: 5, lastReviewed: 1718900000000 }, // older
        "item-conflict-imported-newer": {
          level: 3,
          lastReviewed: 1718985600000,
        }, // newer
        // Unique to phone
        "item-imported-only": { level: 2, lastReviewed: 1718900000000 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 5, lastReviewed: 1718900000000 },
        "vocab-conflict-imported-newer": {
          level: 3,
          lastReviewed: 1718985600000,
        },
        "vocab-imported-only": { level: 2, lastReviewed: 1718900000000 },
      },
    };

    const merged = mergeStates(local, imported);

    // Verify phrasebook srs merging
    expect(merged.srs["item-conflict-local-newer"].level).toBe(2); // local won
    expect(merged.srs["item-conflict-local-newer"].lastReviewed).toBe(
      1718985600000,
    );

    expect(merged.srs["item-conflict-imported-newer"].level).toBe(3); // imported won
    expect(merged.srs["item-conflict-imported-newer"].lastReviewed).toBe(
      1718985600000,
    );

    expect(merged.srs["item-local-only"].level).toBe(4);
    expect(merged.srs["item-imported-only"].level).toBe(2);

    expect(merged.vocab["vocab-local-only"].level).toBe(5);
    expect(merged.vocab["vocab-imported-only"].level).toBe(2);
  });

  test("saveLocalState writes merged state to localStorage", () => {
    if (typeof localStorage === "undefined" || !localStorage.clear) {
      let store = {};
      global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => (store[key] = value.toString()),
        removeItem: (key) => delete store[key],
        clear: () => (store = {}),
      };
    }
    localStorage.clear();
    const state = {
      chapters: ["chap1"],
      srs: { "phr-1": { level: 1, lastReviewed: 12345 } },
      vocab: { "vocab-1": { level: 2, lastReviewed: 67890 } },
    };

    const success = saveLocalState(state);
    expect(success).toBe(true);

    expect(localStorage.getItem("cantonese_unlocked_chapters")).toContain(
      "chap1",
    );
    expect(localStorage.getItem("cantonese_srs_state")).toContain("phr-1");
    expect(localStorage.getItem("cantonese_vocab_srs_state")).toContain(
      "vocab-1",
    );
  });

  test("saveLocalState handles QuotaExceededError and returns false", () => {
    vi.spyOn(global.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const state = { chapters: [], srs: {}, vocab: {} };
    const success = saveLocalState(state);
    expect(success).toBe(false);

    vi.restoreAllMocks();
  });

  test("saveLocalState returns false when window is undefined", () => {
    const originalWindow = global.window;
    delete global.window;

    const state = { chapters: [], srs: {}, vocab: {} };
    const success = saveLocalState(state);
    expect(success).toBe(false);

    global.window = originalWindow;
  });
});

describe("WebRTC Utility Spec", () => {
  test("packSDPData and unpackSDPData roundtrip", () => {
    const sdpData = {
      t: "o",
      u: "12345678",
      p: "abc123def456",
      f: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      c: [["192.168.1.1", 12345]],
    };
    const packed = packSDPData(sdpData);
    expect(typeof packed).toBe("string");

    const unpacked = unpackSDPData(packed);
    expect(unpacked).toEqual(sdpData);
  });

  test("packSDPData handles missing or undefined fields gracefully", () => {
    const badData = { t: "o" }; // Missing u, p, f, c
    const packed = packSDPData(badData);
    expect(packed).toBe("");

    const unpacked = unpackSDPData(packed);
    expect(unpacked).toBeNull();
  });

  test("unpackSDPData returns null for invalid payload", () => {
    expect(unpackSDPData(null)).toBeNull();
    expect(unpackSDPData("")).toBeNull();
    expect(unpackSDPData("invalid_string_without_delimiters")).toBeNull();
  });

  test("unpackSDPData parses IPv6 candidates", () => {
    // 16 bytes for IPv6, length prefix is 16
    const ipv6CandidateData = {
      t: "o",
      u: "user",
      p: "pass",
      f: "fing",
      c: [["2001:0db8:85a3:0000:0000:8a2e:0370:7334", 8080]],
    };
    const packed = packSDPData(ipv6CandidateData);
    const unpacked = unpackSDPData(packed);
    expect(unpacked.c[0][0]).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  });

  test("packSDPData and unpackSDPData handle mDNS hostnames", () => {
    const mdnsData = {
      t: "o",
      u: "user",
      p: "pass",
      f: "fing",
      c: [["1b3a4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d.local", 12345]],
    };
    const packed = packSDPData(mdnsData);
    const unpacked = unpackSDPData(packed);
    expect(unpacked.c[0][0]).toBe("1b3a4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d.local");
    expect(unpacked.c[0][1]).toBe(12345);
  });

  test("parseSDP and buildSDP handle raw browser SDP strings", () => {
    const rawSDP = `v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=ice-ufrag:mockUfrag
a=ice-pwd:mockPassword
a=ice-options:trickle
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:actpass
a=mid:0
a=sctp-port:5000
a=max-message-size:262144
a=candidate:1 1 udp 2122260223 192.168.1.5 50000 typ host generation 0 ufrag mockUfrag network-id 1 network-cost 10`;

    const parsed = parseSDP(rawSDP);
    expect(parsed.u).toBe("mockUfrag");
    expect(parsed.p).toBe("mockPassword");
    expect(parsed.f).toBe(
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    );
    expect(parsed.c.length).toBe(1);
    expect(parsed.c[0][0]).toBe("192.168.1.5");
    expect(parsed.c[0][1]).toBe(50000);

    const rebuilt = rebuildSDP(false, parsed);
    expect(rebuilt.sdp).toContain("a=ice-ufrag:mockUfrag");
    expect(rebuilt.sdp).toContain("a=ice-pwd:mockPassword");
    expect(rebuilt.sdp).toContain("a=setup:active"); // answers are active
  });

  test("getLocalState retrieves data from localStorage", () => {
    localStorage.clear();
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(["chap1"]),
    );
    localStorage.setItem(
      "cantonese_srs_state",
      JSON.stringify({ "phr-1": { level: 2 } }),
    );
    localStorage.setItem(
      "cantonese_vocab_srs_state",
      JSON.stringify({ "v-1": { level: 3 } }),
    );

    const localState = getLocalState();
    expect(localState.chapters).toEqual(["chap1"]);
    expect(localState.srs["phr-1"].level).toBe(2);
    expect(localState.vocab["v-1"].level).toBe(3);
  });

  test("getLocalState handles exceptions and returns defaults", () => {
    vi.spyOn(global.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Localstorage read block");
    });
    const localState = getLocalState();
    expect(localState.chapters).toEqual([]);
    expect(localState.srs).toEqual({});
    expect(localState.vocab).toEqual({});
    vi.restoreAllMocks();
  });
});
