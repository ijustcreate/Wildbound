import { drawVillager, villagerMotion } from "./villager-motion.mjs";
import { VILLAGERS, villagerById } from "./villager-data.mjs";
import { directionVector } from "./player-motion.mjs";
const pick = document.getElementById("actor"),
  action = document.getElementById("action"),
  views = document.getElementById("views"),
  cast = document.getElementById("cast");
for (const v of VILLAGERS) pick.add(new Option(v.name, v.id));
pick.value = "april";
for (const name of Object.keys(villagerMotion.clips))
  action.add(new Option(name, name));
let playing = true,
  clock = 0;
document.getElementById("play").onclick = () => {
  playing = !playing;
  document.getElementById("play").textContent = playing ? "Pause" : "Play";
};
export function render(name = action.value, time = clock) {
  const c = views.getContext("2d");
  c.fillStyle = "#23383d";
  c.fillRect(0, 0, 1280, 400);
  c.imageSmoothingEnabled = false;
  for (let d = 0; d < 8; d++) {
    const [faceX, faceY] = directionVector(d);
    c.save();
    c.translate(80 + d * 160, 310);
    c.scale(4, 4);
    drawVillager(
      c,
      { villagerId: pick.value, faceX, faceY, animationAction: name },
      time,
    );
    c.restore();
    c.fillStyle = "#e1d2b4";
    c.font = "15px system-ui";
    c.textAlign = "center";
    c.fillText(
      ["S", "SW", "W", "NW", "N", "NE", "E", "SE"][d],
      80 + d * 160,
      370,
    );
  }
  document.getElementById("story").textContent =
    `${villagerById(pick.value).name}: ${villagerById(pick.value).story}`;
}
function renderCast() {
  const c = cast.getContext("2d");
  c.fillStyle = "#b0aaa7";
  c.fillRect(0, 0, cast.width, cast.height);
  for (const [v, spec] of VILLAGERS.entries()) {
    c.save();
    c.translate(90 + v * 180, 265);
    c.scale(4, 4);
    drawVillager(
      c,
      {
        villagerId: spec.id,
        faceX: 0,
        faceY: 1,
        animationAction: "idle",
        playerFrame: 0,
      },
      0,
    );
    c.restore();
    c.font = "bold 18px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#293639";
    c.fillText(spec.name, 90 + v * 180, 315);
  }
}
let previous = performance.now();
function tick(now) {
  if (playing) clock += (now - previous) / 1000;
  previous = now;
  render();
  requestAnimationFrame(tick);
}
renderCast();
requestAnimationFrame(tick);
window.villagerTest = {
  render,
  renderCast,
  setActor: (id) => {
    pick.value = id;
  },
  setPlaying: (p) => {
    playing = p;
  },
  ready: Promise.resolve(true),
};
