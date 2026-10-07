import { rigSubject } from "./rig-subjects.mjs";
import { rgbaToSprite, spriteToRgba, validateSprite } from "./pixels.mjs";
export function validClip(c) {
  return (
    c &&
    ["idle", "walk", "attack", "hurt"].includes(c.action) &&
    Number.isFinite(c.fps) &&
    c.fps >= 1 &&
    c.fps <= 30 &&
    Array.isArray(c.rows) &&
    c.rows.length === 4 &&
    c.rows.every(
      (r) =>
        Array.isArray(r) &&
        r.length > 0 &&
        r.length <= 16 &&
        r.every((s) => validateSprite(s) && s.width === 64 && s.height === 64),
    )
  );
}
export function loadAnimations() {
  try {
    return JSON.parse(localStorage.getItem("wildbound-animations") || "{}");
  } catch {
    return {};
  }
}
export function animationFrame(bank, name, actor, time) {
  const kit = bank?.[name];
  if (!kit) return null;
  const action =
    actor.hit > 0
      ? "hurt"
      : actor.attack > 0
        ? "attack"
        : actor.moving
          ? "walk"
          : "idle";
  const clip = kit[action] || kit.idle || kit.walk;
  if (!clip?.rows?.length) return null;
  const x = actor.faceX || 0,
    y = actor.faceY ?? 1,
    row = Math.abs(x) > Math.abs(y) ? (x < 0 ? 1 : 2) : y < 0 ? 3 : 0;
  const frames = clip.rows[row];
  const t = action === "attack" ? 0.34 - actor.attack : time;
  return frames[Math.max(0, Math.floor(t * clip.fps)) % frames.length];
}
export class FrameWorkshop {
  constructor(assets) {
    this.assets = assets;
    this.bank = { ...assets.animationBank, ...loadAnimations() };
    assets.animationBank = this.bank;
    this.frame = 0;
    this.row = 0;
    this.playing = true;
    const open = document.createElement("button");
    open.textContent = "Creature sheet import";
    open.id = "animation-sheets";
    document.getElementById("import-image").after(open);
    this.dialog = document.createElement("dialog");
    this.dialog.className = "frame-dialog";
    this.dialog.innerHTML = `<header><h2>Directional animation sheets</h2><button id="frames-close">Close</button></header><p>One action per sheet. Four rows: down, left, right, up. Equal cells, transparent background, same scale and foot position in every frame. Cells become exactly 64 × 64 without trimming.</p><div class="frame-fields"><label>Character <select id="frames-character"></select></label><label>Action <select id="frames-action"><option>idle</option><option>walk</option><option>attack</option><option>hurt</option></select></label><label>Columns <input id="frames-columns" type="number" min="1" max="16" value="6"></label><label>Frames/sec <input id="frames-fps" type="number" min="1" max="30" value="8"></label></div><input id="frames-file" type="file" accept="image/*"><div class="frame-stage"><canvas id="frames-canvas" width="64" height="64"></canvas><div><label>Facing <select id="frames-facing"><option>down</option><option>left</option><option>right</option><option>up</option></select></label><p id="frames-position"></p><button id="frames-prev">Previous</button><button id="frames-next">Next</button><button id="frames-play">Play / pause</button><p><label><input id="frames-onion" type="checkbox" checked> Onion skin</label></p><input id="frames-color" type="color" value="#d9ab76"><label><input id="frames-erase" type="checkbox"> Erase</label><button id="frames-undo">Undo</button><p>Pause to paint or erase. The cross marks the shared ground anchor.</p></div></div><button id="frames-save">Save to game</button><button id="frames-export">Export character package</button><label>Load package <input id="frames-json" type="file" accept=".json"></label><p id="frames-status" role="status"></p>`;
    document.body.append(this.dialog);
    const $ = (id) => this.dialog.querySelector("#frames-" + id);
    this.$ = $;
    for (const name of [
      ...Object.keys(assets.library).filter((n) =>
        [
          "panther",
          "snake",
          "bat",
          "vine",
          "golem",
          "monkey",
          "boar",
          "wasp",
          "crocodile",
        ].includes(n),
      ),
      "skeleton",
      "archer",
    ])
      if (!rigSubject(name)) $("character").append(new Option(name, name));
    open.onclick = () => {
      this.load();
      this.dialog.showModal();
    };
    $("close").onclick = () => this.dialog.close();
    $("character").onchange = $("action").onchange = () => this.load();
    $("facing").onchange = () => {
      this.row = $("facing").selectedIndex;
      this.frame = 0;
      this.render();
    };
    $("file").onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        const bitmap = await createImageBitmap(file),
          cols = Math.max(1, Math.min(16, Number($("columns").value) || 6));
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const c = canvas.getContext("2d");
        c.imageSmoothingEnabled = false;
        const rows = [];
        for (let y = 0; y < 4; y++) {
          const row = [];
          for (let x = 0; x < cols; x++) {
            c.clearRect(0, 0, 64, 64);
            c.drawImage(
              bitmap,
              (x * bitmap.width) / cols,
              (y * bitmap.height) / 4,
              bitmap.width / cols,
              bitmap.height / 4,
              0,
              0,
              64,
              64,
            );
            row.push(rgbaToSprite(c.getImageData(0, 0, 64, 64).data, 64, 64));
          }
          rows.push(row);
        }
        bitmap.close();
        this.clip = {
          action: $("action").value,
          fps: 8,
          rows,
          anchor: { x: 32, y: 48 },
        };
        this.frame = 0;
        this.playing = false;
        this.history = [];
        this.render();
        $("status").textContent =
          "Imported with fixed cell bounds. Check every facing before saving.";
      } catch (e) {
        $("status").textContent = e.message;
      }
    };
    $("prev").onclick = () => this.step(-1);
    $("next").onclick = () => this.step(1);
    $("play").onclick = () => (this.playing = !this.playing);
    $("onion").onchange = () => this.render();
    $("fps").onchange = () => {
      if (this.clip)
        this.clip.fps = Math.max(1, Math.min(30, Number($("fps").value) || 8));
    };
    $("save").onclick = () => {
      if (!validClip(this.clip)) return;
      try {
        const name = $("character").value;
        this.bank[name] ??= {};
        this.bank[name][$("action").value] = structuredClone(this.clip);
        localStorage.setItem("wildbound-animations", JSON.stringify(this.bank));
        this.assets.animationBank = this.bank;
        $("status").textContent =
          "Saved. The game now uses these frames for " + name + ".";
      } catch (e) {
        $("status").textContent = "Save failed: " + e.message;
      }
    };
    const canvas = $("canvas");
    canvas.onpointerdown = (e) => {
      if (!this.clip || this.playing) return;
      this.history ??= [];
      this.history.push(structuredClone(this.clip.rows[this.row][this.frame]));
      canvas.setPointerCapture(e.pointerId);
      this.painting = true;
      this.paint(e);
    };
    canvas.onpointermove = (e) => {
      if (this.painting) this.paint(e);
    };
    canvas.onpointerup = () => (this.painting = false);
    $("undo").onclick = () => {
      if (this.history?.length) {
        this.clip.rows[this.row][this.frame] = this.history.pop();
        this.render();
      }
    };
    $("export").onclick = () => {
      const name = $("character").value,
        a = document.createElement("a"),
        url = URL.createObjectURL(
          new Blob(
            [
              JSON.stringify({
                version: 1,
                name,
                animations: this.bank[name] || {},
              }),
            ],
            { type: "application/json" },
          ),
        );
      a.href = url;
      a.download = name + "-animation.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    $("json").onchange = async (e) => {
      try {
        const p = JSON.parse(await e.target.files[0].text());
        if (p.version !== 1 || !Object.values(p.animations).every(validClip))
          throw Error("Invalid character animation package");
        this.bank[$("character").value] = p.animations;
        localStorage.setItem("wildbound-animations", JSON.stringify(this.bank));
        this.load();
      } catch (e) {
        $("status").textContent = e.message;
      }
    };
  }
  load() {
    this.clip = structuredClone(
      this.bank[this.$("character").value]?.[this.$("action").value] || null,
    );
    this.frame = 0;
    this.history = [];
    this.render();
  }
  step(d) {
    if (!this.clip) return;
    this.playing = false;
    this.frame =
      (this.frame + d + this.clip.rows[this.row].length) %
      this.clip.rows[this.row].length;
    this.history = [];
    this.render();
  }
  paint(e) {
    const c = this.$("canvas"),
      r = c.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.left) / r.width) * 64),
      y = Math.floor(((e.clientY - r.top) / r.height) * 64);
    if (x < 0 || y < 0 || x >= 64 || y >= 64) return;
    const s = this.clip.rows[this.row][this.frame];
    let n = 0;
    if (!this.$("erase").checked) {
      const color = this.$("color").value;
      n = s.palette.indexOf(color);
      if (n < 0) {
        n = s.palette.length;
        s.palette.push(color);
      }
    }
    s.pixels[y * 64 + x] = n;
    this.render();
  }
  animate(time) {
    if (this.dialog.open && this.playing && this.clip) {
      this.frame =
        Math.floor(time * this.clip.fps) % this.clip.rows[this.row].length;
      this.render();
    }
  }
  render() {
    const c = this.$("canvas").getContext("2d");
    c.clearRect(0, 0, 64, 64);
    if (!this.clip) {
      this.$("position").textContent = "No animation yet. Import a sheet.";
      return;
    }
    const frames = this.clip.rows[this.row],
      draw = (s, alpha) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        canvas
          .getContext("2d")
          .putImageData(new ImageData(spriteToRgba(s), 64, 64), 0, 0);
        c.globalAlpha = alpha;
        c.drawImage(canvas, 0, 0);
      };
    if (!this.playing && this.$("onion").checked)
      draw(frames[(this.frame + frames.length - 1) % frames.length], 0.25);
    draw(frames[this.frame], 1);
    c.fillStyle = "#e8bd75";
    c.fillRect(30, 48, 5, 1);
    c.fillRect(32, 46, 1, 5);
    this.$("position").textContent =
      "Frame " + (this.frame + 1) + " / " + frames.length;
  }
}
