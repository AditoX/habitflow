if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/src/js/service-worker.js", { scope: "/" }).catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
