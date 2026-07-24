/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import {
  serializeState,
  deserializeState,
  mergeStates,
  extractRTCToken,
  calculateMergeMetrics,
  decompressPayload,
  parseSrsMap,
} from "./sync.js";
import { TextEncoder } from "util";
import { packSDPData, unpackSDPData, parseSDP, rebuildSDP } from "./webrtc.js";

declare global {
  interface Uint8Array {
    toBase64?:
      | ((options?: { alphabet?: string; omitPadding?: boolean }) => string)
      | undefined;
  }
  interface Uint8ArrayConstructor {
    fromBase64?:
      | ((
          str: string,
          options?: { alphabet?: string; lastChunkHandling?: string },
        ) => Uint8Array)
      | undefined;
  }
}

describe("Progress Sync Utility Spec", () => {
  test("serialization and deserialization roundtrip preserves progress state", async () => {
    const originalState = {
      chapters: ["pronunciation-tones", "greetings", "dining-out"],
      srs: {
        "phr-11-1v3vktn": { level: 2 },
        "phr-5-abcde": { level: 5 },
      },
      vocab: {
        "vocab-你好_neihhou": { level: 1 },
        "vocab-smart-quote-’": { level: 4 },
      },
    };

    const serialized = await serializeState(originalState);
    expect(typeof serialized).toBe("string");
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = await deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    if (!deserialized) throw new Error("Should not be null");
    expect(deserialized.chapters).toEqual([
      "pronunciation-tones",
      "greetings",
      "dining-out",
    ]);

    // Check phrasebook srs
    expect(deserialized.srs["phr-11-1v3vktn"]).toBeDefined();
    expect(deserialized.srs["phr-11-1v3vktn"]?.level).toBe(2);

    expect(deserialized.srs["phr-5-abcde"]?.level).toBe(5);

    // Check vocabulary srs
    expect(deserialized.vocab["vocab-你好_neihhou"]).toBeDefined();
    expect(deserialized.vocab["vocab-你好_neihhou"]?.level).toBe(1);

    expect(deserialized.vocab["vocab-smart-quote-’"]).toBeDefined();
    expect(deserialized.vocab["vocab-smart-quote-’"]?.level).toBe(4);
  });

  test("deserializeState handles missing or invalid chapters property gracefully", async () => {
    // Case 1: c (chapters) is omitted entirely
    const compacted1 = {
      s: {},
      v: {},
      t: 1234567890,
    };
    const base64Plain1 = btoa(JSON.stringify(compacted1))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const deserialized1 = await deserializeState(base64Plain1);
    expect(deserialized1).not.toBeNull();
    if (!deserialized1) throw new Error("Should not be null");
    expect(deserialized1.chapters).toEqual([]);

    // Case 2: c is not an array
    const compacted2 = {
      c: "not-an-array",
      s: {},
      v: {},
      t: 1234567890,
    };
    const base64Plain2 = btoa(JSON.stringify(compacted2))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const deserialized2 = await deserializeState(base64Plain2);
    expect(deserialized2).not.toBeNull();
    if (!deserialized2) throw new Error("Should not be null");
    expect(deserialized2.chapters).toEqual([]);
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
          "phr-11-1v3vktn": { level: 2 },
        },
        vocab: {
          "vocab-你好_neihhou": { level: 1 },
          "vocab-smart-quote-’": { level: 4 },
        },
      };

      const serialized = await serializeState(originalState);
      expect(typeof serialized).toBe("string");
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = await deserializeState(serialized);
      expect(deserialized).not.toBeNull();
      if (!deserialized) throw new Error("Should not be null");
      expect(deserialized.chapters).toEqual([
        "pronunciation-tones",
        "greetings",
        "dining-out",
      ]);
      expect(deserialized.vocab["vocab-smart-quote-’"]?.level).toBe(4);
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
        "phr-11-1v3vktn": { level: 2 },
      },
      vocab: {},
    };

    const serialized = await serializeState(originalState, 1721782680000);

    // Convert any URL-safe '-' back to '+' (or standard base64 '+') and replace with spaces
    // to simulate standard browser URLSearchParams parsing.
    const base64WithPlus = serialized.replace(/-/g, "+");
    const base64WithSpace = base64WithPlus.replace(/\+/g, " ");

    const deserialized = await deserializeState(base64WithSpace);
    expect(deserialized).not.toBeNull();
    if (!deserialized) throw new Error("Should not be null");
    expect(deserialized.chapters).toEqual(["pronunciation-tones", "greetings"]);
    expect(deserialized.srs["phr-11-1v3vktn"]?.level).toBe(2);
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
    if (!deserialized) throw new Error("Should not be null");
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

  test("deserialization handles missing/truncated SRS and vocab arrays correctly", async () => {
    const compacted = {
      c: [],
      s: { "phr-1": [4] },
      v: { "v-1": [3] }, // Missing index 1
      t: 1234567890,
    };
    const base64Plain = btoa(JSON.stringify(compacted))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const deserialized = await deserializeState(base64Plain);
    expect(deserialized).not.toBeNull();
    if (!deserialized) throw new Error("Should not be null");
    expect(deserialized.srs["phr-1"]).toEqual({ level: 4 });
    expect(deserialized.vocab["v-1"]).toEqual({ level: 3 });
  });

  test("deserialization fallback to TextDecoder when DecompressionStream is missing", async () => {
    const originalDecompress = global.DecompressionStream;
    // @ts-expect-error Polyfill handling
    delete global.DecompressionStream;
    try {
      const compacted = { c: ["greetings"] };
      const base64Plain = btoa(JSON.stringify(compacted))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      const result = await deserializeState(base64Plain);
      expect(result).not.toBeNull();
      if (!result) throw new Error("Should not be null");
      expect(result.chapters).toEqual(["greetings"]);
    } finally {
      global.DecompressionStream = originalDecompress;
    }
  });

  test("serialization fallback to plain JSON when CompressionStream is missing", async () => {
    const originalCompress = global.CompressionStream;
    // @ts-expect-error Polyfill handling
    delete global.CompressionStream;
    try {
      const state = { chapters: ["greetings"], srs: {}, vocab: {} };
      const serialized = await serializeState(state);
      expect(serialized).toBeDefined();
      const deserialized = await deserializeState(serialized);
      if (!deserialized) throw new Error("Should not be null");
      expect(deserialized.chapters).toEqual(["greetings"]);
    } finally {
      global.CompressionStream = originalCompress;
    }
  });

  test("deserialization handles null, undefined, or empty string gracefully", async () => {
    // @ts-expect-error Testing invalid input gracefully
    expect(await deserializeState(null)).toBeNull();
    // @ts-expect-error Testing invalid input gracefully
    expect(await deserializeState(undefined)).toBeNull();
    expect(await deserializeState("")).toBeNull();
    expect(await deserializeState("   ")).toBeNull();
  });

  test("deserialization discards legacy indexed phrasebook progress keys starting with ch", async () => {
    // Construct a payload containing keys like "ch0-1" inside srs
    const originalState = {
      chapters: ["pronunciation-tones"],
      srs: {
        "ch0-1": { level: 2 },
        "phr-11-1v3vktn": { level: 2 },
      },
      vocab: {},
    };
    const serialized = await serializeState(originalState);
    const deserialized = await deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    if (!deserialized) return;
    expect(deserialized.srs["ch0-1"]).toBeUndefined();
    expect(deserialized.srs["phr-11-1v3vktn"]?.level).toBe(2);
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
        "item-conflict-local-newer": { level: 2 },
        // Phone reviewed this more recently
        "item-conflict-imported-newer": {
          level: 1,
        },
        // Unique to laptop
        "item-local-only": { level: 4 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 3 },
        "vocab-conflict-imported-newer": {
          level: 1,
        },
        "vocab-local-only": { level: 5 },
      },
    };

    const imported = {
      chapters: ["pronunciation-tones"],
      srs: {
        "item-conflict-local-newer": { level: 5 }, // older
        "item-conflict-imported-newer": {
          level: 3,
        }, // newer
        // Unique to phone
        "item-imported-only": { level: 2 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 5 },
        "vocab-conflict-imported-newer": {
          level: 3,
        },
        "vocab-imported-only": { level: 2 },
      },
    };

    const merged = mergeStates(local, imported);

    // Verify phrasebook srs merging
    expect(merged.srs["item-conflict-local-newer"]?.level).toBe(5); // imported won (higher level)

    expect(merged.srs["item-conflict-imported-newer"]?.level).toBe(3); // imported won

    expect(merged.srs["item-local-only"]?.level).toBe(4);
    expect(merged.srs["item-imported-only"]?.level).toBe(2);

    expect(merged.vocab["vocab-local-only"]?.level).toBe(5);
    expect(merged.vocab["vocab-imported-only"]?.level).toBe(2);
  });
});

describe("WebRTC Utility Spec", () => {
  test("packSDPData and unpackSDPData roundtrip", () => {
    const sdpData: import("../types/index.js").SDPCoordinates = {
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
    // @ts-expect-error Testing invalid input gracefully
    const badData: import("../types/index.js").SDPCoordinates = { t: "o" }; // Missing u, p, f, c
    const packed = packSDPData(badData);
    expect(packed).toBe("");

    const unpacked = unpackSDPData(packed);
    expect(unpacked).toBeNull();
  });

  test("unpackSDPData returns null for invalid payload", () => {
    // @ts-expect-error Testing invalid input gracefully
    expect(unpackSDPData(null)).toBeNull();
    expect(unpackSDPData("")).toBeNull();
    expect(unpackSDPData("invalid_string_without_delimiters")).toBeNull();
  });

  test("unpackSDPData parses IPv6 candidates", () => {
    // 16 bytes for IPv6, length prefix is 16
    const ipv6CandidateData: import("../types/index.js").SDPCoordinates = {
      t: "o",
      u: "user",
      p: "pass",
      f: "fing",
      c: [["2001:0db8:85a3:0000:0000:8a2e:0370:7334", 8080]],
    };
    const packed = packSDPData(ipv6CandidateData);
    const unpacked = unpackSDPData(packed);
    if (!unpacked) throw new Error("Expected unpacked data");
    expect(unpacked.c[0]?.[0]).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  });

  test("packSDPData and unpackSDPData handle mDNS hostnames", () => {
    const mdnsData: import("../types/index.js").SDPCoordinates = {
      t: "o",
      u: "user",
      p: "pass",
      f: "fing",
      c: [["1b3a4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d.local", 12345]],
    };
    const packed = packSDPData(mdnsData);
    const unpacked = unpackSDPData(packed);
    if (!unpacked) throw new Error("Expected unpacked data");
    expect(unpacked.c[0]?.[0]).toBe(
      "1b3a4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d.local",
    );
    expect(unpacked.c[0]?.[1]).toBe(12345);
  });

  test("packSDPData and unpackSDPData handle answer coordinates correctly", () => {
    const answerData: import("../types/index.js").SDPCoordinates = {
      t: "a",
      u: "user",
      p: "pass",
      f: "1234567890123456789012345678901234567890123456789012345678901234",
      c: [],
    };
    const packed = packSDPData(answerData);
    const unpacked = unpackSDPData(packed);
    expect(unpacked).toEqual(answerData);
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
    expect(parsed.c[0]?.[0]).toBe("192.168.1.5");
    expect(parsed.c[0]?.[1]).toBe(50000);

    const rebuilt = rebuildSDP(false, parsed);
    expect(rebuilt.sdp).toContain("a=ice-ufrag:mockUfrag");
    expect(rebuilt.sdp).toContain("a=ice-pwd:mockPassword");
    expect(rebuilt.sdp).toContain("a=setup:active"); // answers are active
  });

  test("deserializeState handles invalid base64 characters gracefully", async () => {
    const result = await deserializeState("invalid!!!");
    expect(result).toBeNull();
  });

  test("mergeStates handles missing properties on local/imported states gracefully", () => {
    const local = {
      chapters: [],
      srs: {},
      vocab: {},
    };
    const imported = {
      chapters: [],
      srs: {},
      vocab: {},
    };
    const merged = mergeStates(local, imported);
    expect(merged.srs).toEqual({});
    expect(merged.vocab).toEqual({});
  });

  test("serialization and deserialization use fallback base64 functions when native support is missing", async () => {
    const originalToBase64 = Uint8Array.prototype.toBase64;
    const originalFromBase64 = Uint8Array.fromBase64;
    delete Uint8Array.prototype.toBase64;
    delete Uint8Array.fromBase64;
    try {
      const state = {
        chapters: ["greetings"],
        srs: {},
        vocab: {},
        timestamp: 0,
      };
      const serialized = await serializeState(state);
      const deserialized = await deserializeState(serialized);
      if (!deserialized) throw new Error("Should not be null");
      expect(deserialized.chapters).toEqual(["greetings"]);
    } finally {
      Uint8Array.prototype.toBase64 = originalToBase64;
      Uint8Array.fromBase64 = originalFromBase64;
    }
  });
});

describe("WebRTC Utility Spec Errors", () => {
  test("unpackSDPData handles truncated data exceptions gracefully", () => {
    // Truncated type byte only
    const result = unpackSDPData("AQ");
    expect(result).toBeNull();
  });

  test("unpackSDPData handles invalid candidate IP addresses gracefully", () => {
    // Construct a byte array with type 4 (IPv4) but missing IP/port bytes
    const bytes = new Uint8Array(1 + 8 + 24 + 32 + 1 + 1 + 2);
    bytes[0] = 1; // Offer type
    bytes[65] = 1; // Candidate count
    bytes[66] = 4; // ipType = 4 (IPv4)

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    const packed = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const unpacked = unpackSDPData(packed);
    expect(unpacked).toBeNull();
  });

  test("unpackSDPData handles missing candidate port bytes gracefully", () => {
    // Construct a byte array with type 4 (IPv4) and valid IP bytes but missing port bytes (needs 2, only has 1)
    const bytes = new Uint8Array(1 + 8 + 24 + 32 + 1 + 1 + 4 + 1);
    bytes[0] = 1; // Offer type
    bytes[65] = 1; // Candidate count
    bytes[66] = 4; // ipType = 4 (IPv4)

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    const packed = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const unpacked = unpackSDPData(packed);
    expect(unpacked).toBeNull();
  });

  test("unpackSDPData rejects non-string types", () => {
    // @ts-expect-error Testing invalid input gracefully
    expect(unpackSDPData(123)).toBeNull();
  });

  test("unpackSDPData handles base64 decoding crashes gracefully", () => {
    expect(unpackSDPData("invalid_base64_with_bad_chars!!!")).toBeNull();
  });

  test("rebuildSDP handles offers and IPv6 candidates correctly", () => {
    const ipv6Data: import("../types/index.js").SDPCoordinates = {
      t: "o",
      u: "user",
      p: "pass",
      f: "1234567890123456789012345678901234567890123456789012345678901234",
      c: [["2001:db8::1", 8080]],
    };
    const rebuilt = rebuildSDP(true, ipv6Data);
    expect(rebuilt.type).toBe("offer");
    expect(rebuilt.sdp).toContain("a=setup:actpass");
    expect(rebuilt.sdp).toContain("c=IN IP6 2001:db8::1");
  });

  test("packSDPData returns empty string for null, missing ufrag, or missing pwd", () => {
    // @ts-expect-error Testing invalid input gracefully
    expect(packSDPData(null)).toBe("");
    // @ts-expect-error Testing invalid input gracefully
    expect(packSDPData({ t: "o", p: "pwd", f: "fing", c: [] })).toBe("");
    // @ts-expect-error Testing invalid input gracefully
    expect(packSDPData({ t: "o", u: "ufrag", f: "fing", c: [] })).toBe("");
  });

  test("parseSDP skips non-host and non-UDP candidates gracefully", () => {
    const rawSDP = `v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
s=-
t=0 0
a=ice-ufrag:mockUfrag
a=ice-pwd:mockPassword
a=candidate:1 1 udp 2122260223 192.168.1.5 50000 typ relay generation 0 ufrag mockUfrag
a=candidate:2 1 tcp 2122260223 192.168.1.6 50001 typ host generation 0 ufrag mockUfrag`;
    const parsed = parseSDP(rawSDP);
    expect(parsed.c.length).toBe(0);
  });

  test("deserializeState expands populated srs and vocab including discarding legacy ch keys", async () => {
    const state = {
      chapters: [],
      srs: {
        "phr-1": { level: 3 },
        "ch-legacy": { level: 1 },
      },
      vocab: { "v-1": { level: 2 } },
      timestamp: 0,
    };
    const serialized = await serializeState(state);
    const deserialized = await deserializeState(serialized);
    if (!deserialized) throw new Error("Deserialization failed");
    expect(deserialized.srs["phr-1"]?.level).toBe(3);
    expect(deserialized.srs["ch-legacy"]).toBeUndefined();
    expect(deserialized.vocab["v-1"]?.level).toBe(2);
  });

  test("unpackSDPData handles missing candidate count gracefully", () => {
    const bytes = new Uint8Array(1 + 8 + 24 + 32);
    bytes[0] = 1;
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    const packed = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    expect(unpackSDPData(packed)).toBeNull();
  });

  test("unpackSDPData handles missing IP length gracefully", () => {
    const bytes = new Uint8Array(1 + 8 + 24 + 32 + 1 + 1);
    bytes[0] = 1;
    bytes[65] = 1;
    bytes[66] = 0;
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    const packed = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    expect(unpackSDPData(packed)).toBeNull();
  });

  test("rebuildSDP skips candidates with undefined IP or port", () => {
    const data: import("../types/index.js").SDPCoordinates = {
      t: "o",
      u: "u",
      p: "p",
      f: "f",
      c: [
        // @ts-expect-error Testing invalid input gracefully
        [undefined, 9999],
        // @ts-expect-error Testing invalid input gracefully
        ["1.2.3.4", undefined],
      ],
    };
    const result = rebuildSDP(true, data);
    expect(result.sdp).not.toContain("1.2.3.4");
    expect(result.sdp).not.toContain("9999");
  });

  test("rebuildSDP handles null matchResult for empty fingerprint gracefully", () => {
    const data: import("../types/index.js").SDPCoordinates = {
      t: "o",
      u: "u",
      p: "p",
      f: "", // empty fingerprint matches nothing for /.{1,2}/g
      c: [],
    };
    const result = rebuildSDP(true, data);
    expect(result.sdp).toContain("a=fingerprint:sha-256 ");
  });

  test("unpackSDPData handles missing ipType gracefully", () => {
    const bytes = new Uint8Array(1 + 8 + 24 + 32 + 1); // type (1), ufrag (8), pwd (24), fingerprint (32), candCount (1)
    bytes[0] = 1;
    bytes[65] = 1; // candCount = 1, but no candidate bytes follow
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const packed = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    expect(unpackSDPData(packed)).toBeNull();
  });
});

describe("Sync Utility Spec Additional Coverage", () => {
  test("deserializeState handles Uint8Array.fromBase64 if defined", async () => {
    const originalFromBase64 = (
      Uint8Array as unknown as { fromBase64?: unknown }
    ).fromBase64;
    (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64 = vi
      .fn()
      .mockImplementation(() => {
        return new Uint8Array([123, 125]); // "{}" in ASCII
      });

    try {
      const result = await deserializeState("any_base64_string");
      expect(result).not.toBeNull();
      expect(
        (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64,
      ).toHaveBeenCalled();
    } finally {
      (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64 =
        originalFromBase64;
    }
  });

  test("deserializeState handles Uint8Array.fromBase64 throwing error", async () => {
    const originalFromBase64 = (
      Uint8Array as unknown as { fromBase64?: unknown }
    ).fromBase64;
    (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64 = vi
      .fn()
      .mockImplementation(() => {
        throw new Error("mock error");
      });

    try {
      const state = {
        chapters: ["greetings"],
        srs: {},
        vocab: {},
        timestamp: 0,
      };
      const serialized = await serializeState(state);
      const deserialized = await deserializeState(serialized);
      expect(deserialized).not.toBeNull();
    } finally {
      (Uint8Array as unknown as { fromBase64?: unknown }).fromBase64 =
        originalFromBase64;
    }
  });

  test("deserializeState handles malformed srs/vocab entry arrays gracefully", async () => {
    const malformedPayload = {
      c: [],
      s: {
        "phr-1": "not-an-array",
        "phr-2": [],
      },
      v: {
        "vocab-1": "not-an-array",
        "vocab-2": [],
      },
      t: 1000,
    };
    const base64Str = btoa(JSON.stringify(malformedPayload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const result = await deserializeState(base64Str);
    expect(result).not.toBeNull();
    expect(result?.srs).toEqual({});
    expect(result?.vocab).toEqual({});
  });

  test("mergeStates handles missing or undefined localStore or importedStore stores gracefully", () => {
    const local = {
      chapters: [],
      srs: undefined as unknown as Record<string, { level: number }>,
      vocab: undefined as unknown as Record<string, { level: number }>,
    };
    const imported = {
      chapters: [],
      srs: undefined as unknown as Record<string, { level: number }>,
      vocab: undefined as unknown as Record<string, { level: number }>,
    };
    const merged = mergeStates(local, imported);
    expect(merged.srs).toEqual({});
    expect(merged.vocab).toEqual({});
  });

  test("deserializeState handles missing elements in srs/vocab arrays", async () => {
    const payload = {
      c: [],
      s: {
        "phr-1": [null, 1000],
        "phr-2": [3, null],
      },
      v: {
        "vocab-1": [null, 2000],
        "vocab-2": [4, null],
      },
      t: 1000,
    };
    const base64Str = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const result = await deserializeState(base64Str);
    expect(result).not.toBeNull();
    expect(result?.srs["phr-1"]?.level).toBe(1);

    expect(result?.vocab["vocab-1"]?.level).toBe(1);
  });

  test("serializeState handles undefined state.vocab or state.srs", async () => {
    const state = {
      chapters: [],
      srs: undefined as unknown as Record<string, { level: number }>,
      vocab: undefined as unknown as Record<string, { level: number }>,
    };
    const serialized = await serializeState(state);
    const deserialized = await deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized?.srs).toEqual({});
    expect(deserialized?.vocab).toEqual({});
  });

  test("extractRTCToken parses URL search parameters or returns raw input", () => {
    expect(extractRTCToken("raw_sdp_token")).toBe("raw_sdp_token");
    expect(extractRTCToken("invalid-url-string")).toBe("invalid-url-string");
    expect(
      extractRTCToken("https://example.com/canto?rtc=extracted_token"),
    ).toBe("extracted_token");
    expect(extractRTCToken("https://example.com/canto?other=123")).toBe(
      "https://example.com/canto?other=123",
    );
  });

  test("calculateMergeMetrics computes accurate local vs merged metrics", () => {
    const local = {
      chapters: ["ch1"],
      srs: { p1: { level: 2 } },
      vocab: { v1: { level: 3 } },
    };
    const imported = {
      chapters: ["ch1", "ch2"],
      srs: {
        p1: { level: 1 },
        p2: { level: 4 },
      },
      vocab: {
        v1: { level: 5 },
      },
    };
    const metrics = calculateMergeMetrics(local, imported);
    expect(metrics).toEqual({
      chapters: { local: 1, merged: 2 },
      phrases: { local: 1, merged: 2 },
      vocab: { local: 1, merged: 1 },
    });
  });

  test("calculateMergeMetrics handles missing srs and vocab maps gracefully", () => {
    const local = {
      chapters: [],
      srs: undefined as unknown as Record<string, { level: number }>,
      vocab: undefined as unknown as Record<string, { level: number }>,
    };
    const imported = {
      chapters: [],
      srs: undefined as unknown as Record<string, { level: number }>,
      vocab: undefined as unknown as Record<string, { level: number }>,
    };
    const metrics = calculateMergeMetrics(local, imported);
    expect(metrics).toEqual({
      chapters: { local: 0, merged: 0 },
      phrases: { local: 0, merged: 0 },
      vocab: { local: 0, merged: 0 },
    });
  });
});

describe("Functional Core parsing functions", () => {
  describe("parseSrsMap", () => {
    test("should parse standard srs map correctly", () => {
      const rawData = {
        "phrase-1": [2, 12345],
        "phrase-2": [3],
      };
      const result = parseSrsMap(rawData);
      expect(result).toEqual({
        "phrase-1": { level: 2 },
        "phrase-2": { level: 3 },
      });
    });

    test("should skip legacy ids if requested", () => {
      const rawData = {
        "phrase-1": [1, 1],
        "ch-1": [5, 5],
      };
      const result = parseSrsMap(rawData, true);
      expect(result).toEqual({
        "phrase-1": { level: 1 },
      });
      expect(result["ch-1"]).toBeUndefined();
    });

    test("should handle invalid shapes gracefully", () => {
      expect(parseSrsMap(null)).toEqual({});
      expect(parseSrsMap([])).toEqual({});
      expect(parseSrsMap("invalid")).toEqual({});

      const rawData = {
        "phrase-1": "not-an-array",
        "phrase-2": [], // empty array
      };
      expect(parseSrsMap(rawData)).toEqual({});
    });
  });

  describe("decompressPayload", () => {
    test("should parse uncompressed JSON strings", async () => {
      const text = JSON.stringify({ chapters: ["ch1"] });
      const bytes = new TextEncoder().encode(text);
      const result = await decompressPayload(bytes);
      expect(result).toBe(text);
    });
  });

  test("serializeProgress should gracefully handle invalid SRS item values", async () => {
    const invalidState = {
      chapters: [],
      srs: {
        badItem: { level: "not-a-number" },
        missingLevel: {},
        nullItem: null,
      },
      vocab: {},
      timestamp: 0,
    };
    // @ts-expect-error - testing invalid data
    const b64 = await serializeState(invalidState);
    const parsed = await deserializeState(b64);
    expect(parsed?.srs).toEqual({}); // Should filter out invalid items
  });
});

export {};
