// Start the loader independently before importing the game and editor graph.
(() => {
  const loader = document.getElementById("loading");
  let canvas = document.getElementById("infinity");
  const boot = (window.wildboundBoot = {
    frames: [],
    painted: false,
    mode: "worker",
  });
  let worker, fallbackTimer, resolvePaint;
  const firstPaint = new Promise((resolve) => (resolvePaint = resolve));
  function painted(data) {
    boot.painted = true;
    boot.frames.push(data);
    if (boot.frames.length > 40) boot.frames.shift();
    if (boot.firstDraw === undefined) {
      boot.firstDraw = performance.now();
      resolvePaint();
    }
  }
  function fallback() {
    if (boot.mode === "fallback") return;
    boot.mode = "fallback";
    worker?.terminate();
    worker = null;
    // A transferred canvas cannot acquire a main-thread context again.
    const replacement = canvas.cloneNode();
    canvas.replaceWith(replacement);
    canvas = replacement;
    const c = canvas.getContext("2d");
    boot.startAnimation = () => {
      clearInterval(fallbackTimer);
      const draw = () => {
        c.clearRect(0, 0, 220, 100);
        const phase = Math.floor(performance.now() / 50) % 100;
        for (let i = 0; i < 100; i++) {
          const t = (i / 100) * Math.PI * 2;
          c.fillStyle = (i - phase + 100) % 100 < 12 ? "#f4d993" : "#51754d";
          c.fillRect(
            Math.round((110 + Math.cos(t) * 64) / 4) * 4,
            Math.round((50 + Math.sin(t * 2) * 23) / 4) * 4,
            4,
            4,
          );
        }
        painted({ time: Date.now(), phase, painted: true });
      };
      draw();
      fallbackTimer = setInterval(draw, 50);
    };
    boot.stopAnimation = () => clearInterval(fallbackTimer);
    boot.startAnimation();
  }
  try {
    worker = new Worker("src/loading-worker.js");
    worker.onmessage = ({ data }) => {
      if (data.type === "frame") painted(data);
    };
    worker.onerror = fallback;
    const offscreen = canvas.transferControlToOffscreen();
    boot.startAnimation = () => worker?.postMessage({ type: "start" });
    boot.stopAnimation = () => worker?.postMessage({ type: "stop" });
    worker.postMessage({ canvas: offscreen }, [offscreen]);
  } catch {
    fallback();
  }
  new MutationObserver(() => {
    if (loader.classList.contains("done")) boot.stopAnimation();
  }).observe(loader, { attributes: true, attributeFilter: ["class"] });
  const domReady = new Promise((resolve) => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", resolve, { once: true });
  });
  boot.ready = Promise.all([firstPaint, domReady])
    .then(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    )
    .then(async () => {
      boot.importStarted = performance.now();
      try {
        await import("../app.mjs");
        boot.finished = performance.now();
      } catch (error) {
        boot.error = String(error);
        boot.stopAnimation();
        loader.querySelector("p").textContent =
          `Could not start Wildbound: ${error?.message || error}. Restart the app.`;
        console.error(error);
      }
    });
})();
