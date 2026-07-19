import type { SDPCoordinates } from "../types";

/**
 * WebRTC SDP coordinate packing & reconstruction utility.
 * Optimizes WebRTC signaling payload size to be QR-code friendly.
 */

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array, offset: number, length: number): string {
  let hex = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[offset + i];
    if (byte === undefined) throw new Error("Index out of bounds");
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

function packIP(ip: string): number[] {
  const isIPv6 = ip.includes(":");
  const isIPv4 =
    !isIPv6 &&
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) &&
    ip.split(".").every((p) => parseInt(p, 10) <= 255);

  const bytes: number[] = [];
  if (isIPv4) {
    bytes.push(4);
    bytes.push(...ip.split(".").map(Number));
  } else {
    bytes.push(isIPv6 ? 6 : 0);
    const strBytes = new TextEncoder().encode(ip);
    bytes.push(strBytes.length);
    bytes.push(...strBytes);
  }
  return bytes;
}

function unpackIP(
  bytes: Uint8Array,
  offset: number,
  ipType: number,
): { ip: string; newOffset: number } {
  let ip = "";
  let newOffset = offset;

  if (ipType === 4) {
    const b1 = bytes[newOffset++];
    const b2 = bytes[newOffset++];
    const b3 = bytes[newOffset++];
    const b4 = bytes[newOffset++];
    if (
      b1 === undefined ||
      b2 === undefined ||
      b3 === undefined ||
      b4 === undefined
    ) {
      throw new Error("Invalid IPv4 bytes");
    }
    ip = `${b1}.${b2}.${b3}.${b4}`;
  } else {
    const len = bytes[newOffset++];
    if (len === undefined) throw new Error("Missing IP length");
    ip = new TextDecoder().decode(bytes.subarray(newOffset, newOffset + len));
    newOffset += len;
  }

  return { ip, newOffset };
}

function pushPaddedString(bytes: number[], str: string, length: number) {
  const strBytes = new TextEncoder().encode(str);
  for (let i = 0; i < length; i++) {
    bytes.push(strBytes[i] || 0);
  }
}

function packCandidates(bytes: number[], candidates: [string, number][]) {
  const valid = candidates.filter(
    (c) => c[0] !== undefined && c[1] !== undefined,
  );
  bytes.push(valid.length);
  for (const [ip, port] of valid) {
    bytes.push(...packIP(ip!));
    bytes.push((port! >> 8) & 0xff);
    bytes.push(port! & 0xff);
  }
}

function unpackCandidates(
  bytes: Uint8Array,
  offset: number,
): { c: [string, number][]; newOffset: number } {
  let curOffset = offset;
  const candCount = bytes[curOffset++];
  if (candCount === undefined) throw new Error("Missing count");
  const c: [string, number][] = [];

  for (let i = 0; i < candCount; i++) {
    const ipType = bytes[curOffset++];
    if (ipType === undefined) throw new Error("Missing type");

    const ipParsed = unpackIP(bytes, curOffset, ipType);
    curOffset = ipParsed.newOffset;

    const p1 = bytes[curOffset++];
    const p2 = bytes[curOffset++];
    if (p1 === undefined || p2 === undefined) throw new Error("Invalid port");

    c.push([ipParsed.ip, (p1 << 8) | p2]);
  }
  return { c, newOffset: curOffset };
}

function decodeBase64Safe(str: string): Uint8Array | null {
  if (!str || typeof str !== "string") return null;
  let cleanStr = str.replace(/-/g, "+").replace(/_/g, "/");
  while (cleanStr.length % 4) cleanStr += "=";
  try {
    const binary = atob(cleanStr);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function encodeBase64Url(bytes: number[]): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Pack SDP coordinates to base64url binary
 */
export function packSDPData(data: SDPCoordinates): string {
  if (!data?.u || !data?.p || !data?.f) return "";
  const bytes: number[] = [];

  bytes.push(data.t === "o" ? 1 : 2);
  pushPaddedString(bytes, data.u, 8);
  pushPaddedString(bytes, data.p, 24);

  const fBytes = hexToBytes(data.f);
  for (let i = 0; i < 32; i++) {
    bytes.push(fBytes[i] || 0);
  }

  packCandidates(bytes, data.c);

  return encodeBase64Url(bytes);
}

/**
 * Unpack base64url binary to SDP coordinates object
 */
export function unpackSDPData(str: string): SDPCoordinates | null {
  const bytes = decodeBase64Safe(str);
  if (!bytes) return null;

  try {
    let offset = 0;
    const typeByte = bytes[offset++];
    const t: "o" | "a" = typeByte === 1 ? "o" : "a";

    const u = new TextDecoder()
      .decode(bytes.subarray(offset, offset + 8))
      .replace(/\0/g, "");
    offset += 8;

    const p = new TextDecoder()
      .decode(bytes.subarray(offset, offset + 24))
      .replace(/\0/g, "");
    offset += 24;

    const f = bytesToHex(bytes, offset, 32);
    offset += 32;

    const candParsed = unpackCandidates(bytes, offset);
    return { t, u, p, f, c: candParsed.c };
  } catch (err) {
    console.warn("Parse failed:", err);
    return null;
  }
}

/**
 * Extract essential coordinates from standard SDP
 */
export function parseSDP(sdpString: string): SDPCoordinates {
  const lines = sdpString.split(/\r?\n/);
  let u = "",
    p = "",
    f = "";
  const c: [string, number][] = [];

  for (const line of lines) {
    if (line.startsWith("a=ice-ufrag:")) u = line.slice(12).trim();
    else if (line.startsWith("a=ice-pwd:")) p = line.slice(10).trim();
    else if (line.startsWith("a=fingerprint:sha-256 ")) {
      f = line.slice(22).trim().replace(/:/g, "").toLowerCase();
    } else if (line.startsWith("a=candidate:")) {
      const parts = line.split(" ");
      if (
        parts[7] === "host" &&
        parts[2]?.toLowerCase() === "udp" &&
        parts[4] &&
        parts[5]
      ) {
        c.push([parts[4], parseInt(parts[5], 10)]);
      }
    }
  }
  return { u, p, f, c, t: "o" };
}

/**
 * Reconstruct a standard SDP from munged coordinates
 */
export function rebuildSDP(
  isOffer: boolean,
  data: SDPCoordinates,
): { type: string; sdp: string } {
  const setup = isOffer ? "actpass" : "active";
  const type = isOffer ? "offer" : "answer";
  const matchResult = data.f.match(/.{1,2}/g);
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
    if (ip === undefined || port === undefined) continue;

    sdpLines.push("c=IN " + (ip.includes(":") ? "IP6" : "IP4") + " " + ip);
    sdpLines.push(
      "a=candidate:1 1 udp 2122260223 " + ip + " " + port + " typ host",
    );
  }

  sdpLines.push("");
  return { type, sdp: sdpLines.join("\r\n") };
}
