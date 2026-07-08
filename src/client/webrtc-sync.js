import { packSDPData, parseSDP, rebuildSDP } from "../utils/webrtc.js";
import {
  getLocalState,
  serializeState,
  deserializeState,
} from "../utils/sync.js";

let pc = null;
let dc = null;
export let localRole = null; // 'initiator' or 'receiver'

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

export async function startWebRTC(isInitiator, remoteOfferData, callbacks) {
  cleanupWebRTC();
  localRole = isInitiator ? "initiator" : "receiver";
  const { onStatusUpdate, onQRReady, onAnswerReady, onSyncDataReceived } =
    callbacks;

  try {
    pc = new RTCPeerConnection({ iceServers: [] });

    pc.oniceconnectionstatechange = () => {
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

      const parsed = parseSDP(pc.localDescription.sdp);
      parsed.t = "o"; // tag as offer
      const token = packSDPData(parsed);

      const syncUrl = new URL(window.location.href);
      syncUrl.searchParams.delete("import");
      syncUrl.searchParams.set("rtc", token);

      onQRReady(syncUrl.toString());
    } else {
      const rebuiltOffer = rebuildSDP(true, remoteOfferData);
      await pc.setRemoteDescription(new RTCSessionDescription(rebuiltOffer));

      pc.ondatachannel = (event) => {
        dc = event.channel;
        setupDataChannel(dc, onStatusUpdate, onSyncDataReceived);
      };

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      onStatusUpdate("Gathering candidates...");
      await gatherCandidates();

      const parsed = parseSDP(pc.localDescription.sdp);
      parsed.t = "a"; // tag as answer
      const token = packSDPData(parsed);

      onAnswerReady(token);
    }
  } catch (err) {
    console.error("WebRTC bootstrap failed:", err);
    onStatusUpdate("WebRTC Initialization Failed", true);
  }
}

export async function acceptAnswer(data, callbacks) {
  const { onStatusUpdate } = callbacks;
  if (localRole === "initiator" && pc) {
    onStatusUpdate("Connecting peer...");
    const rebuiltAnswer = rebuildSDP(false, data);
    await pc.setRemoteDescription(new RTCSessionDescription(rebuiltAnswer));
  }
}

async function gatherCandidates() {
  await new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") resolve();
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") resolve();
    };
    pc.onicecandidate = (e) => {
      if (e.candidate === null) resolve();
    };
  });
}

function setupDataChannel(channel, onStatusUpdate, onSyncDataReceived) {
  channel.onopen = async () => {
    console.log("WebRTC Data Channel open!");
    onStatusUpdate("Exchanging progress...");

    // Fetch and send our local state
    const localState = getLocalState();
    const serialized = await serializeState(localState);
    channel.send(serialized);
  };

  channel.onmessage = async (event) => {
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
