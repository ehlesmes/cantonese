/**
 * WebRTC SDP coordinate packing & reconstruction utility.
 * Optimizes WebRTC signaling payload size to be QR-code friendly.
 */

/**
 * Pack SDP coordinates to base64url binary
 */
export function packSDPData(data) {
  if (!data || !data.u || !data.p || !data.f) return "";
  const bytes = [];

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
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Unpack base64url binary to SDP coordinates object
 */
export function unpackSDPData(str) {
  if (!str || typeof str !== "string") return null;
  let cleanStr = str.replace(/-/g, "+").replace(/_/g, "/");
  while (cleanStr.length % 4) {
    cleanStr += "=";
  }
  let binary;
  try {
    binary = atob(cleanStr);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  let offset = 0;
  const typeByte = bytes[offset++];
  const t = typeByte === 1 ? "o" : "a";

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
    const hex = bytes[offset++].toString(16).padStart(2, "0");
    fingerprint += hex;
  }

  const candCount = bytes[offset++];
  const c = [];

  for (let i = 0; i < candCount; i++) {
    const ipType = bytes[offset++];
    let ip = "";

    if (ipType === 4) {
      ip = `${bytes[offset++]}.${bytes[offset++]}.${bytes[offset++]}.${bytes[offset++]}`;
    } else {
      const len = bytes[offset++];
      ip = new TextDecoder().decode(bytes.subarray(offset, offset + len));
      offset += len;
    }

    const port = (bytes[offset++] << 8) | bytes[offset++];
    c.push([ip, port]);
  }

  return { t, u: ufrag, p: pwd, f: fingerprint, c };
}

/**
 * Extract essential coordinates from standard SDP
 */
export function parseSDP(sdpString) {
  const lines = sdpString.split(/\r?\n/);
  let ufrag = "";
  let pwd = "";
  let fingerprint = "";
  const candidates = [];

  for (const line of lines) {
    if (line.startsWith("a=ice-ufrag:")) {
      ufrag = line.slice(12).trim();
    } else if (line.startsWith("a=ice-pwd:")) {
      pwd = line.slice(10).trim();
    } else if (line.startsWith("a=fingerprint:sha-256 ")) {
      fingerprint = line.slice(22).trim().replace(/:/g, "").toLowerCase();
    } else if (line.startsWith("a=candidate:")) {
      const parts = line.split(" ");
      if (parts[7] === "host" && parts[2].toLowerCase() === "udp") {
        candidates.push([parts[4], parseInt(parts[5], 10)]);
      }
    }
  }

  return { u: ufrag, p: pwd, f: fingerprint, c: candidates };
}

/**
 * Reconstruct a standard SDP from munged coordinates
 */
export function rebuildSDP(isOffer, data) {
  const setup = isOffer ? "actpass" : "active";
  const type = isOffer ? "offer" : "answer";

  const fingerprint = data.f
    .match(/.{1,2}/g)
    .join(":")
    .toUpperCase();

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
    const ipType = ip.includes(":") ? "IP6" : "IP4";

    sdpLines.push("c=IN " + ipType + " " + ip);
    sdpLines.push(
      "a=candidate:1 1 udp 2122260223 " + ip + " " + port + " typ host",
    );
  }

  sdpLines.push("");

  return {
    type: type,
    sdp: sdpLines.join("\r\n"),
  };
}
