import type { SDPCoordinates } from "../types/index.js";
import { packSDPData, parseSDP, rebuildSDP } from "../utils/webrtc.js";
import { serializeState, deserializeState } from "../utils/sync.js";
import { getLocalState, type LocalState } from "./sys/storage.js";

let pc: RTCPeerConnection | null = null;
let dc: RTCDataChannel | null = null;
export let localRole: "initiator" | "receiver" | null = null; // 'initiator' or 'receiver'

interface WebRTCCallbacks {
  onStatusUpdate: (msg: string, isError?: boolean) => void;
  onQRReady: (url: string) => void;
  onAnswerReady: (token: string) => void;
  onSyncDataReceived: (state: LocalState) => void;
}

export function cleanupWebRTC() {
  if (dc) {
    dc.close();
    dc = null;
  }
  if (pc) {
    pc.close();
    pc = null;
  }
  localRole = null;
}

export async function startWebRTC(
  isInitiator: boolean,
  remoteOfferData: SDPCoordinates | null,
  callbacks: WebRTCCallbacks,
) {
  cleanupWebRTC();
  localRole = isInitiator ? "initiator" : "receiver";
  const { onStatusUpdate, onQRReady, onAnswerReady, onSyncDataReceived } =
    callbacks;

  try {
    pc = new RTCPeerConnection({ iceServers: [] });

    pc.oniceconnectionstatechange = () => {
      if (!pc) return;
      console.log(`ICE Connection State: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "connected") {
        onStatusUpdate("Connected! Exchanging progress...");
      } else if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        onStatusUpdate("Connection lost. Resetting...", true);
      }
    };

    if (isInitiator) {
      dc = pc.createDataChannel("canto_sync");
      setupDataChannel(dc, onStatusUpdate, onSyncDataReceived);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      onStatusUpdate("Gathering candidates...");
      await gatherCandidates();

      if (pc.localDescription && pc.localDescription.sdp) {
        const parsed = parseSDP(pc.localDescription.sdp);
        parsed.t = "o"; // tag as offer
        const token = packSDPData(parsed);

        const syncUrl = new URL(window.location.href);
        syncUrl.searchParams.delete("import");
        syncUrl.searchParams.set("rtc", token);

        onQRReady(syncUrl.toString());
      }
    } else {
      if (remoteOfferData) {
        const rebuiltOffer = rebuildSDP(true, remoteOfferData);
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: rebuiltOffer.sdp }),
        );
      }

      pc.ondatachannel = (event) => {
        dc = event.channel;
        setupDataChannel(dc, onStatusUpdate, onSyncDataReceived);
      };

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      onStatusUpdate("Gathering candidates...");
      await gatherCandidates();

      if (pc.localDescription && pc.localDescription.sdp) {
        const parsed = parseSDP(pc.localDescription.sdp);
        parsed.t = "a"; // tag as answer
        const token = packSDPData(parsed);
        onAnswerReady(token);
      }
    }
  } catch (err) {
    console.error("WebRTC bootstrap failed:", err);
    onStatusUpdate("WebRTC Initialization Failed", true);
  }
}

export async function acceptAnswer(
  data: SDPCoordinates,
  callbacks: Pick<WebRTCCallbacks, "onStatusUpdate">,
) {
  const { onStatusUpdate } = callbacks;
  if (localRole === "initiator" && pc) {
    onStatusUpdate("Connecting peer...");
    const rebuiltAnswer = rebuildSDP(false, data);
    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: rebuiltAnswer.sdp }),
    );
  }
}

async function gatherCandidates(): Promise<void> {
  if (!pc) return;
  await new Promise<void>((resolve) => {
    if (pc!.iceGatheringState === "complete") resolve();
    pc!.onicegatheringstatechange = () => {
      if (pc!.iceGatheringState === "complete") resolve();
    };
    pc!.onicecandidate = (e) => {
      if (e.candidate === null) resolve();
    };
  });
}

function setupDataChannel(
  channel: RTCDataChannel,
  onStatusUpdate: WebRTCCallbacks["onStatusUpdate"],
  onSyncDataReceived: WebRTCCallbacks["onSyncDataReceived"],
) {
  channel.onopen = async () => {
    console.log("WebRTC Data Channel open!");
    onStatusUpdate("Exchanging progress...");

    // Fetch and send our local state
    const localState = getLocalState();
    const serialized = await serializeState(localState);
    channel.send(serialized);
  };

  channel.onmessage = async (event: MessageEvent<string>) => {
    console.log("WebRTC state received!");
    const remotePayload = event.data;
    try {
      const state = await deserializeState(remotePayload);
      if (state) {
        onStatusUpdate("Sync data received! Merging...");
        onSyncDataReceived(state);
      } else {
        onStatusUpdate("Invalid sync payload received.", true);
      }
    } catch (e) {
      console.error("Failed to parse remote progress:", e);
      onStatusUpdate("Sync failed to parse.", true);
    }
  };

  channel.onclose = () => {
    console.log("Data channel closed");
  };
}
