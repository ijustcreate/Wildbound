import {
  shoreGoblinMotion,
  replaceShoreGoblinMotion,
  loadShoreGoblinArt,
  drawShoreGoblin,
} from "./shore-goblin-motion.mjs";
import { directionVector, poseAt, projectPoint } from "./player-motion.mjs";
import { Animator } from "./animation.mjs";
import { RigStudio } from "./player-studio.mjs";
const $ = (id) => document.getElementById(id),
  key = "wildbound-shore-goblin-test-v1";
try {
  const saved = localStorage.getItem(key);
  if (saved) replaceShoreGoblinMotion(JSON.parse(saved));
} catch (error) {
  $("status").textContent = "Saved test could not load: " + error.message;
}
export const studio = new RigStudio(save);
studio.setSubject("shore_goblin");
const animator = new Animator({ library: {}, canvas: () => null }),
  canvas = $("views"),
  c = canvas.getContext("2d");
const labels = [
  "South",
  "Southwest",
  "West",
  "Northwest",
  "North",
  "Northeast",
  "East",
  "Southeast",
];
let time = 0,
  playing = true,
  last = performance.now();
function save() {
  localStorage.setItem(key, JSON.stringify(shoreGoblinMotion));
  $("status").textContent = "Shore Goblin test saved locally";
  return "Shore Goblin test saved locally";
}
for (const name of Object.keys(shoreGoblinMotion.clips))
  $("motion").append(new Option(name.replaceAll("_", " "), name));
$("motion").value = "run";
$("motion").onchange = () => {
  time = 0;
  render();
};
$("pause").onclick = () => {
  playing = !playing;
  $("pause").textContent = playing ? "Pause" : "Play";
};
$("save-test").onclick = save;
$("open-studio").onclick = () => {
  const show = $("editor").hidden;
  $("editor").hidden = !show;
  $("open-studio").textContent = show ? "Close rig editor" : "Edit rig";
  if (show) {
    studio.mount($("rig-editor"));
    studio.animate(0);
    $("editor").scrollIntoView({ behavior: "smooth" });
  }
};
export function render(action = $("motion").value, at = time) {
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  const clip = shoreGoblinMotion.clips[action],
    frame = clip.loop
      ? (at * clip.fps) % clip.length
      : Math.min(clip.length - 1, at * clip.fps);
  for (let d = 0; d < 8; d++) {
    const col = d % 4,
      row = Math.floor(d / 4),
      x = col * 360 + 180,
      y = row * 325 + 216,
      [faceX, faceY] = directionVector(d),
      actor = {
        kind: "shore_goblin",
        sprite: "shore_goblin",
        x: 0,
        y: 0,
        faceX,
        faceY,
        hp: 80,
        shoreRole: $("role").value,
        shoreColor: Number($("color").value),
        animationAction: action,
        playerFrame: frame,
      };
    c.fillStyle = "#294242";
    c.fillRect(col * 360 + 8, row * 325 + 8, 344, 309);
    c.fillStyle = "#1c3031";
    c.beginPath();
    c.ellipse(x, y + 3, 79, 17, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(x, y);
    c.scale(2.8, 2.8);
    drawShoreGoblin(c, actor, at);
    if ($("bones").checked) {
      const p = Object.fromEntries(
        Object.entries(poseAt(shoreGoblinMotion, action, frame)).map(
          ([n, v]) => [n, projectPoint(v, d)],
        ),
      );
      c.lineWidth = 0.25;
      c.strokeStyle = "#85efe2";
      for (const [n, j] of Object.entries(shoreGoblinMotion.joints)) {
        const a = p[n],
          b = p[j.parent];
        if (b) {
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
        c.fillStyle = "#e4d3a4";
        c.fillRect(a.x - 0.4, a.y - 0.4, 0.8, 0.8);
      }
    }
    c.restore();
    animator.draw(c, { ...actor, x, y: row * 325 + 272 }, at, 48);
    c.fillStyle = "#e4d3a4";
    c.font = "15px system-ui";
    c.textAlign = "left";
    c.fillText(labels[d], col * 360 + 24, row * 325 + 32);
    c.fillStyle = "#96b0a8";
    c.font = "12px system-ui";
    c.fillText("1×", x + 38, row * 325 + 266);
  }
}
// The game uses Workshop for this event. The standalone test supplies a small
// isolated part editor and saves through the same rig callback.
window.addEventListener("rig-sprite-edit", ({ detail }) => {
  const sprite = structuredClone(detail.sprite),
    surface = $("part-canvas"),
    pen = surface.getContext("2d");
  surface.width = sprite.width;
  surface.height = sprite.height;
  const zoom = Math.min(
    20,
    Math.floor(480 / Math.max(sprite.width, sprite.height)),
  );
  surface.style.width = sprite.width * zoom + "px";
  surface.style.height = sprite.height * zoom + "px";
  $("part-name").textContent = detail.name;
  const repaint = () => {
    pen.clearRect(0, 0, sprite.width, sprite.height);
    sprite.pixels.forEach((n, i) => {
      if (n) {
        pen.fillStyle = sprite.palette[n];
        pen.fillRect(i % sprite.width, Math.floor(i / sprite.width), 1, 1);
      }
    });
  };
  const paint = (e) => {
    const r = surface.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.left) / r.width) * sprite.width),
      y = Math.floor(((e.clientY - r.top) / r.height) * sprite.height);
    if (x < 0 || y < 0 || x >= sprite.width || y >= sprite.height) return;
    const color = $("part-color").value;
    if (!sprite.palette.includes(color)) sprite.palette.push(color);
    sprite.pixels[y * sprite.width + x] =
      e.buttons & 2 ? 0 : sprite.palette.indexOf(color);
    repaint();
  };
  surface.onpointerdown = (e) => {
    surface.setPointerCapture(e.pointerId);
    paint(e);
  };
  surface.onpointermove = (e) => {
    if (e.buttons) paint(e);
  };
  surface.oncontextmenu = (e) => e.preventDefault();
  $("part-save").onclick = async () => {
    await detail.apply(sprite);
    $("part-editor").close();
  };
  $("part-cancel").onclick = () => $("part-editor").close();
  repaint();
  $("part-editor").showModal();
});
window.shoreGoblinTest = {
  studio,
  render,
  save,
  setPlaying: (value) => {
    playing = value;
  },
};
window.shoreGoblinTest.ready = loadShoreGoblinArt().then((ok) => {
  $("status").textContent = ok
    ? "31 editable joints · 52 imported entries · 3 colors"
    : "Artwork failed to load";
  if (!ok) throw Error("Shore Goblin artwork unavailable");
  render();
  return true;
});
function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (playing) time += dt * Number($("speed").value);
  render();
  if (!$("editor").hidden) studio.animate(dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
