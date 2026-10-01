// Independent of the game renderer's module evaluation and startup work.
let context,
  timer,
  frame = 0;
function draw() {
  const c = context;
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
  frame++;
  // Timestamped heartbeats also let smoke tests verify animation during a stall.
  self.postMessage({
    type: "frame",
    time: Date.now(),
    frame,
    phase,
    painted: true,
  });
}
self.onmessage = ({ data }) => {
  if (data.canvas) context = data.canvas.getContext("2d");
  if (data.type === "stop") {
    clearInterval(timer);
    timer = null;
    return;
  }
  if ((data.type === "start" || data.canvas) && context) {
    clearInterval(timer);
    draw();
    timer = setInterval(draw, 50);
  }
};
