export async function fetchVersionAndCheck(
  currentVersion: string,
  updateIndicator: HTMLElement | null,
) {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return;
  }
  if (currentVersion === "development") return;

  try {
    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL.slice(0, -1)
      : import.meta.env.BASE_URL;

    const response = await fetch(`${baseUrl}/version.json?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = (await response.json()) as { version?: string };

    if (data?.version && data.version !== currentVersion) {
      if (updateIndicator) updateIndicator.style.display = "inline-flex";
    }
  } catch (err) {
    console.warn("Failed to check version:", err);
  }
}

export function initVersionCheck() {
  const updateIndicator = document.getElementById("update-indicator");
  const metaTag = document.querySelector('meta[name="app-version"]');
  const currentVersion = metaTag
    ? metaTag.getAttribute("content")
    : "development";
  let updateChecking = false;

  if (updateIndicator) {
    updateIndicator.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  async function checkVersion() {
    if (updateChecking) return;
    updateChecking = true;
    await fetchVersionAndCheck(
      currentVersion || "development",
      updateIndicator,
    );
    updateChecking = false;
  }

  setTimeout(checkVersion, 5000);

  let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      visibilityTimeout = setTimeout(() => {
        checkVersion();
        visibilityTimeout = null;
      }, 2000);
    }
  });

  setInterval(checkVersion, 5 * 60 * 1000);
}
