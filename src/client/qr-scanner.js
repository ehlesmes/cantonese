import jsQR from "jsqr";

let videoStream = null;
let scanAnimationId = null;
let isProcessing = false;

export function startScanner(
  video,
  videoWrapper,
  hiddenCanvas,
  onStatus,
  onDecoded,
) {
  onStatus("Accessing camera...");
  videoWrapper.style.display = "none";

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      videoStream = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.play();

      video.onloadedmetadata = () => {
        videoWrapper.style.display = "block";
        onStatus("Point camera at the QR code...");
        scanAnimationId = requestAnimationFrame(() =>
          tickScanner(video, hiddenCanvas, onStatus, onDecoded),
        );
      };
    })
    .catch((err) => {
      console.error("Webcam access error:", err);
      onStatus("Camera access denied or unavailable.");
      stopScanner(video, videoWrapper);
    });
}

export function stopScanner(video, videoWrapper) {
  if (scanAnimationId) {
    cancelAnimationFrame(scanAnimationId);
    scanAnimationId = null;
  }
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }
  if (video) {
    video.srcObject = null;
  }
  if (videoWrapper) {
    videoWrapper.style.display = "none";
  }
}

function tickScanner(video, hiddenCanvas, onStatus, onDecoded) {
  if (isProcessing) {
    if (videoStream) {
      scanAnimationId = requestAnimationFrame(() =>
        tickScanner(video, hiddenCanvas, onStatus, onDecoded),
      );
    }
    return;
  }

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const maxDim = 480;
    let width = videoWidth;
    let height = videoHeight;
    if (videoWidth > maxDim || videoHeight > maxDim) {
      if (videoWidth > videoHeight) {
        width = maxDim;
        height = Math.round((videoHeight * maxDim) / videoWidth);
      } else {
        height = maxDim;
        width = Math.round((videoWidth * maxDim) / videoHeight);
      }
    }

    if (hiddenCanvas.width !== width || hiddenCanvas.height !== height) {
      hiddenCanvas.width = width;
      hiddenCanvas.height = height;
    }

    const ctx = hiddenCanvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      console.log("QR Code detected:", code.data);
      isProcessing = true;
      onDecoded(code.data).finally(() => {
        isProcessing = false;
      });
    }
  }

  if (videoStream) {
    scanAnimationId = requestAnimationFrame(() =>
      tickScanner(video, hiddenCanvas, onStatus, onDecoded),
    );
  }
}
