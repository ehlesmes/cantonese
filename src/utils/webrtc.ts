import type { SDPCoordinates } from "../types";

/**
 * WebRTC SDP coordinate packing & reconstruction utility.
 * Optimizes WebRTC signaling payload size to be QR-code friendly.
 */

/**
 * Pack SDP coordinates to base64url binary
 */
export function packSDPData(data: SDPCoordinates): string {
  /* v8 ignore next */
  if (!data || !data.u || !data.p || !data.f) return "";
  const bytes: number[] = [];

  // Type (1 = Offer, 2 = Answer)
  bytes.push(data.t === "o" ? 1 : 2);

  // ufrag (8 bytes)
  const uBytes = new TextEncoder().encode(data.u);
  for (let i = 0; i < 8; i++) {
    bytes.push(uBytes[i] || 0);
  }

  // pwd (24 bytes)
  const pBytes = new TextEncoder().encode(data.p);
  for (let i = 0; i < 24; i++) {
    bytes.push(pBytes[i] || 0);
  }

  // fingerprint (32 bytes)
  for (let i = 0; i < 64; i += 2) {
    bytes.push(parseInt(data.f.slice(i, i + 2), 16));
  }

  // candidate count
  bytes.push(data.c.length);

  for (const cand of data.c) {
    const ip = cand[0];
    const port = cand[1];
    /* v8 ignore next */
    if (ip === undefined || port === undefined) continue;

    const isIPv6 = ip.includes(":");
    const isIPv4 = !isIPv6 && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);

    if (isIPv4) {
      bytes.push(4);
      bytes.push(...ip.split(".").map(Number));
    } else if (isIPv6) {
      bytes.push(6);
      const strBytes = new TextEncoder().encode(ip);
      bytes.push(strBytes.length);
      bytes.push(...strBytes);
    } else {
      bytes.push(0);
      const strBytes = new TextEncoder().encode(ip);
      bytes.push(strBytes.length);
      bytes.push(...strBytes);
    }

    bytes.push((port >> 8) & 0xff);
    bytes.push(port & 0xff);
  }

  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    const byte = uint8[i];
    /* v8 ignore next */
    binary += String.fromCharCode(byte ?? 0);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Unpack base64url binary to SDP coordinates object
 */
export function unpackSDPData(str: string): SDPCoordinates | null {
  if (!str || typeof str !== "string") return null;
  let cleanStr = str.replace(/-/g, "+").replace(/_/g, "/");
  while (cleanStr.length % 4) {
    cleanStr += "=";
  }
  let binary: string;
  try {
    binary = atob(cleanStr);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    let offset = 0;
    const typeByte = bytes[offset++];
    /* v8 ignore next */
    if (typeByte === undefined) throw new Error("Missing type byte");
    const t: "o" | "a" = typeByte === 1 ? "o" : "a";

    const ufrag = new TextDecoder()
      .decode(bytes.subarray(offset, offset + 8))
      .replace(/\0/g, "");
    offset += 8;

    const pwd = new TextDecoder()
      .decode(bytes.subarray(offset, offset + 24))
      .replace(/\0/g, "");
    offset += 24;

    let fingerprint = "";
    for (let i = 0; i < 32; i++) {
      const byte = bytes[offset++];
      if (byte === undefined) throw new Error("Index out of bounds reading fingerprint");
      const hex = byte.toString(16).padStart(2, "0");
      fingerprint += hex;
    }

    const candCount = bytes[offset++];
    /* v8 ignore next */
    if (candCount === undefined) throw new Error("Missing candidate count");
    const c: [string, number][] = [];

    for (let i = 0; i < candCount; i++) {
      const ipType = bytes[offset++];
      /* v8 ignore next */
      if (ipType === undefined) throw new Error("Missing IP type");
      let ip = "";

      if (ipType === 4) {
        const b1 = bytes[offset++];
        const b2 = bytes[offset++];
        const b3 = bytes[offset++];
        const b4 = bytes[offset++];
        if (b1 === undefined || b2 === undefined || b3 === undefined || b4 === undefined) {
          throw new Error("Invalid IPv4 address bytes");
        }
        ip = `${b1}.${b2}.${b3}.${b4}`;
      } else {
        const len = bytes[offset++];
        /* v8 ignore next */
        if (len === undefined) throw new Error("Missing IP length");
        const safeLen: number = len;
        ip = new TextDecoder().decode(bytes.subarray(offset, offset + safeLen));
        offset += safeLen;
      }

      const p1 = bytes[offset++];
      const p2 = bytes[offset++];
      if (p1 === undefined || p2 === undefined) {
        throw new Error("Invalid port bytes");
      }
      const port = (p1 << 8) | p2;
      c.push([ip, port]);
    }

    return { t, u: ufrag, p: pwd, f: fingerprint, c };
  } catch (err) {
    console.warn("Failed to parse unpacked SDP binary details:", err);
    return null;
  }
}

/**
 * Extract essential coordinates from standard SDP
 */
export function parseSDP(sdpString: string): SDPCoordinates {
  const lines = sdpString.split(/\r?\n/);
  let ufrag = "";
  let pwd = "";
  let fingerprint = "";
  const candidates: [string, number][] = [];

  for (const line of lines) {
    if (line.startsWith("a=ice-ufrag:")) {
      ufrag = line.slice(12).trim();
    } else if (line.startsWith("a=ice-pwd:")) {
      pwd = line.slice(10).trim();
    } else if (line.startsWith("a=fingerprint:sha-256 ")) {
      fingerprint = line.slice(22).trim().replace(/:/g, "").toLowerCase();
    } else if (line.startsWith("a=candidate:")) {
      const parts = line.split(" ");
      const type = parts[7];
      const proto = parts[2];
      const ip = parts[4];
      const portStr = parts[5];
      if (type === "host" && proto?.toLowerCase() === "udp" && ip && portStr) {
        candidates.push([ip, parseInt(portStr, 10)]);
      }
    }
  }

  return { u: ufrag, p: pwd, f: fingerprint, c: candidates, t: "o" }; // defaults to offer type
}

/**
 * Reconstruct a standard SDP from munged coordinates
 */
export function rebuildSDP(isOffer: boolean, data: SDPCoordinates): { type: string; sdp: string } {
  const setup = isOffer ? "actpass" : "active";
  const type = isOffer ? "offer" : "answer";

  const matchResult = data.f.match(/.{1,2}/g);
  /* v8 ignore next */
  const fingerprint = matchResult ? matchResult.join(":").toUpperCase() : "";

  const sdpLines = [
    "v=0",
    "o=- 1234567890123456789 2 IN IP4 127.0.0.1",
    "s=-",
    "t=0 0",
    "a=group:BUNDLE 0",
    "a=extmap-allow-mixed",
    "a=msid-semantic: WMS",
    "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
    "a=setup:" + setup,
    "a=mid:0",
    "a=sctp-port:5000",
    "a=max-message-size:262144",
    "a=fingerprint:sha-256 " + fingerprint,
    "a=ice-ufrag:" + data.u,
    "a=ice-pwd:" + data.p,
  ];

  for (const cand of data.c) {
    const ip = cand[0];
    const port = cand[1];
    /* v8 ignore next */
    if (ip === undefined || port === undefined) continue;
    const ipType = ip.includes(":") ? "IP6" : "IP4";

    sdpLines.push("c=IN " + ipType + " " + ip);
    sdpLines.push(
      "a=candidate:1 1 udp 2122260223 " + ip + " " + port + " typ host"
    );
  }

  sdpLines.push("");

  return {
    type: type,
    sdp: sdpLines.join("\r\n"),
  };
}
