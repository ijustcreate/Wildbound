import { rigSubject } from "./rig-subjects.mjs";
import {
  GAME_PALETTE,
  rgbaToSprite,
  spriteToRgba,
  convertRegion,
  floodFill,
  validateSprite,
} from "./pixels.mjs";
const $ = (id) => document.getElementById(id);
import { ensureFootprint } from "./world.mjs";
import { Animator } from "./animation.mjs";
export class Workshop {
  constructor(assets) {
    this.assets = assets;
    this.sprite = structuredClone(assets.library.tree);
    this.name = "tree";
    this.tool = "pencil";
    this.color = "#dbb36a";
    this.history = [];
    this.future = [];
    this.source = null;
    this.crop = null;
    this.view = { x: 0, y: 0, zoom: 1 };
    this.previewAnimator = new Animator({ canvas: () => this.previewCanvas });
    this.bind();
    this.openSprite("tree");
    this.library();
  }
  bind() {
    $("sprite-layer").onchange = () => {
      this.layer = $("sprite-layer").value;
      ensureFootprint(this.sprite, this.name);
      $("layer-hint").textContent =
        this.layer === "footprint"
          ? "Red = solid. Paint the base; erase to allow walking."
          : "Paint colors and transparency.";
      this.render();
    };
    $("canopy-toggle").onchange = () => {
      this.checkpoint();
      this.sprite.occludes = $("canopy-toggle").checked;
      this.render();
    };
    $("import-image").onclick = () => $("image-file").click();
    $("image-file").onchange = (e) => {
      const f = e.target.files[0];
      if (f) this.loadImage(f);
      e.target.value = "";
    };
    $("new-sprite").onclick = () => {
      this.history = [];
      this.future = [];
      this.name = "new-sprite";
      this.sprite = {
        width: 48,
        height: 48,
        palette: ["transparent"],
        pixels: Array(48 * 48).fill(0),
      };
      $("sprite-name").value = this.name;
      this.render();
    };
    $("asset-search").oninput = () => this.library();
    $("show-grid").onchange = () => this.render();
    for (const b of document.querySelectorAll("[data-tool]"))
      b.onclick = () => this.setTool(b.dataset.tool);
    $("paint-color").oninput = (e) => this.setColor(e.target.value);
    $("palette").replaceChildren(
      ...GAME_PALETTE.map((color) => {
        const b = document.createElement("button");
        b.style.background = color;
        b.title = color;
        b.setAttribute("aria-label", "Paint " + color);
        b.onclick = () => this.setColor(color);
        return b;
      }),
    );
    $("undo-button").onclick = () => this.undo();
    $("redo-button").onclick = () => this.redo();
    const canvas = $("pixel-canvas");
    canvas.onpointerdown = (e) => {
      if (e.button !== 0) return;
      canvas.setPointerCapture(e.pointerId);
      this.drawing = true;
      this.checkpoint();
      this.lastPoint = null;
      this.paint(e);
    };
    canvas.onpointermove = (e) => {
      if (this.drawing) this.paint(e);
    };
    canvas.onpointerup = canvas.onpointercancel = () => {
      this.drawing = false;
      this.lastPoint = null;
    };
    $("save-sprite").onclick = () => this.save();
    $("export-png").onclick = () => {
      const c = this.spriteCanvas(this.sprite);
      c.toBlob((b) =>
        download(b, ($("sprite-name").value || "sprite") + ".png"),
      );
    };
    $("export-library").onclick = () =>
      download(
        new Blob([JSON.stringify(this.assets.library, null, 2)], {
          type: "application/json",
        }),
        "wildbound-sprites.json",
      );
    $("import-library").onclick = () => $("library-file").click();
    $("library-file").onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 20e6)
          throw new Error("Library must be smaller than 20 MB.");
        const data = JSON.parse(await file.text());
        if (
          !data ||
          Array.isArray(data) ||
          typeof data !== "object" ||
          Object.keys(data).length > 500
        )
          throw new Error(
            "Choose a sprite library JSON with up to 500 assets.",
          );
        this.assets.saveBatch(data);
        this.library();
        this.status("Imported " + Object.keys(data).length + " sprites.");
      } catch (err) {
        this.status(err.message);
      }
      e.target.value = "";
    };
    $("close-crop").onclick = () => $("crop-dialog").close();
    $("crop-size").onchange =
      $("remove-bg").onchange =
      $("quantize").onchange =
        () => this.drawSource();
    $("bg-tolerance").oninput = () => {
      $("tolerance-label").textContent = $("bg-tolerance").value;
      this.drawSource();
    };
    $("use-crop").onclick = () => {
      if (!this.source || !this.crop) return;
      this.sprite = this.convert(this.crop);
      this.name = "imported-sprite";
      $("sprite-name").value = this.name;
      this.history = [];
      this.future = [];
      this.render();
      $("crop-dialog").close();
      this.status("Crop imported. Paint or erase, then save to the game.");
    };
    $("split-sheet").onclick = () => {
      if (!this.source) return;
      try {
        const rows = Number($("sheet-rows").value),
          cols = Number($("sheet-cols").value),
          prefix = $("sheet-prefix").value.trim();
        if (
          !Number.isInteger(rows) ||
          !Number.isInteger(cols) ||
          rows < 1 ||
          cols < 1 ||
          rows > 12 ||
          cols > 12
        )
          throw new Error("Use 1–12 rows and columns.");
        if (!/^[a-zA-Z0-9 _-]{1,48}$/.test(prefix))
          throw new Error("Use a short asset prefix with letters and numbers.");
        const entries = {};
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++)
            entries[prefix + "-" + String(y * cols + x + 1).padStart(2, "0")] =
              this.convert({
                x: (x * this.source.width) / cols,
                y: (y * this.source.height) / rows,
                w: this.source.width / cols,
                h: this.source.height / rows,
              });
        this.assets.saveBatch(entries);
        this.library();
        this.openSprite(Object.keys(entries)[0]);
        $("crop-dialog").close();
        this.status(
          "Imported " +
            rows * cols +
            " sprites. Each is individually editable.",
        );
      } catch (e) {
        alert(e.message);
      }
    };
    const source = $("source-canvas");
    source.oncontextmenu = (e) => e.preventDefault();
    source.onpointerdown = (e) => {
      if (!this.source) return;
      source.setPointerCapture(e.pointerId);
      const p = this.sourcePoint(e);
      this.drag = {
        start: p,
        x: e.offsetX,
        y: e.offsetY,
        pan: e.button === 2 || e.shiftKey,
        view: { ...this.view },
      };
    };
    source.onpointermove = (e) => {
      if (!this.drag) return;
      if (this.drag.pan) {
        const rect = source.getBoundingClientRect();
        this.view.x =
          this.drag.view.x +
          ((e.offsetX - this.drag.x) * source.width) / rect.width;
        this.view.y =
          this.drag.view.y +
          ((e.offsetY - this.drag.y) * source.height) / rect.height;
      } else {
        const p = this.sourcePoint(e),
          a = this.drag.start;
        this.crop = {
          x: Math.min(a.x, p.x),
          y: Math.min(a.y, p.y),
          w: Math.max(1, Math.abs(p.x - a.x)),
          h: Math.max(1, Math.abs(p.y - a.y)),
        };
      }
      this.drawSource();
    };
    source.onpointerup = source.onpointercancel = () => (this.drag = null);
    source.onwheel = (e) => {
      if (!this.source) return;
      e.preventDefault();
      const p = this.sourcePoint(e),
        z = Math.max(
          0.05,
          Math.min(12, this.view.zoom * (e.deltaY > 0 ? 0.9 : 1.1)),
        );
      this.view.x += (this.view.zoom - z) * p.x;
      this.view.y += (this.view.zoom - z) * p.y;
      this.view.zoom = z;
      this.drawSource();
    };
    document.addEventListener("keydown", (e) => {
      if (
        !$("workshop").classList.contains("active") ||
        ["INPUT", "SELECT"].includes(document.activeElement.tagName)
      )
        return;
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.redo();
      } else if ({ b: "pencil", e: "eraser", g: "fill", i: "picker" }[e.key])
        this.setTool(
          { b: "pencil", e: "eraser", g: "fill", i: "picker" }[e.key],
        );
    });
  }
  status(s) {
    $("workshop-status").textContent = s;
  }
  setTool(tool) {
    this.tool = tool;
    for (const b of document.querySelectorAll("[data-tool]"))
      b.classList.toggle("selected", b.dataset.tool === tool);
  }
  setColor(color) {
    this.color = color;
    $("paint-color").value = color;
    $("color-value").textContent = color.toUpperCase();
  }
  library() {
    const filter = $("asset-search").value.toLowerCase();
    $("asset-count").textContent = Object.keys(this.assets.library).length;
    const buttons = [];
    for (const name of Object.keys(this.assets.library)) {
      // Player art and animation are edited together in the player studio.
      // Preserve old imported images on disk, but do not present them as a
      // competing way to change the active player rig.
      if (
        !!rigSubject(name) ||
        name.startsWith("explorer") ||
        /^part-(teal|coral|blue|gold|purple|green)-/.test(name)
      )
        continue;
      if (!name.includes(filter)) continue;
      const b = document.createElement("button");
      b.className = "asset-thumb" + (name === this.name ? " selected" : "");
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      canvas.getContext("2d").imageSmoothingEnabled = false;
      canvas.getContext("2d").drawImage(this.assets.canvas(name), 0, 0, 48, 48);
      const label = document.createElement("span");
      label.textContent = name;
      b.append(canvas, label);
      b.onclick = () => this.openSprite(name);
      buttons.push(b);
    }
    $("asset-library").replaceChildren(...buttons);
  }
  openSprite(name) {
    this.name = name;
    this.sprite = structuredClone(this.assets.library[name]);
    ensureFootprint(this.sprite, name);
    $("canopy-toggle").checked = !!this.sprite.occludes;
    $("sprite-name").value = name;
    this.history = [];
    this.future = [];
    this.render();
    this.library();
  }
  checkpoint() {
    this.history.push(structuredClone(this.sprite));
    if (this.history.length > 50) this.history.shift();
    this.future = [];
  }
  undo() {
    if (!this.history.length) return;
    this.future.push(structuredClone(this.sprite));
    this.sprite = this.history.pop();
    this.render();
  }
  redo() {
    if (!this.future.length) return;
    this.history.push(structuredClone(this.sprite));
    this.sprite = this.future.pop();
    this.render();
  }
  paint(e) {
    const r = $("pixel-canvas").getBoundingClientRect(),
      x = Math.max(
        0,
        Math.min(
          this.sprite.width - 1,
          Math.floor(((e.clientX - r.left) / r.width) * this.sprite.width),
        ),
      ),
      y = Math.max(
        0,
        Math.min(
          this.sprite.height - 1,
          Math.floor(((e.clientY - r.top) / r.height) * this.sprite.height),
        ),
      );
    if (this.layer === "footprint") {
      ensureFootprint(this.sprite, this.name);
      const value = this.tool === "eraser" ? 0 : 1;
      if (this.tool === "picker") return;
      if (this.tool === "fill") {
        floodFill(
          { ...this.sprite, pixels: this.sprite.footprint },
          x,
          y,
          value,
        );
        this.drawing = false;
      } else {
        const from = this.lastPoint || { x, y },
          steps = Math.max(Math.abs(x - from.x), Math.abs(y - from.y), 1);
        for (let i = 0; i <= steps; i++) {
          const px = Math.round(from.x + ((x - from.x) * i) / steps),
            py = Math.round(from.y + ((y - from.y) * i) / steps);
          this.sprite.footprint[py * this.sprite.width + px] = value;
          if ($("mirror").checked)
            this.sprite.footprint[
              py * this.sprite.width + this.sprite.width - 1 - px
            ] = value;
        }
        this.lastPoint = { x, y };
      }
      this.render();
      return;
    }
    if (this.tool === "picker") {
      const p = this.sprite.pixels[y * this.sprite.width + x];
      if (p) this.setColor(this.sprite.palette[p]);
      return;
    }
    let color = 0;
    if (this.tool !== "eraser") {
      color = this.sprite.palette.indexOf(this.color);
      if (color < 0) {
        color = this.sprite.palette.length;
        this.sprite.palette.push(this.color);
      }
    }
    if (this.tool === "fill") {
      floodFill(this.sprite, x, y, color);
      this.drawing = false;
    } else {
      const from = this.lastPoint || { x, y },
        steps = Math.max(Math.abs(x - from.x), Math.abs(y - from.y), 1);
      for (let i = 0; i <= steps; i++) {
        const px = Math.round(from.x + ((x - from.x) * i) / steps),
          py = Math.round(from.y + ((y - from.y) * i) / steps);
        this.sprite.pixels[py * this.sprite.width + px] = color;
        if ($("mirror").checked)
          this.sprite.pixels[
            py * this.sprite.width + this.sprite.width - 1 - px
          ] = color;
      }
      this.lastPoint = { x, y };
    }
    this.render();
  }
  save() {
    try {
      if(this.attachmentSave) { if(!validateSprite(this.sprite))throw Error('Invalid sprite.');this.attachmentSave(structuredClone(this.sprite));return; }
      const name = $("sprite-name").value.trim();
      this.assets.save(name, this.sprite);
      this.name = name;
      this.library();
      this.status("Saved “" + name + "”. The game now uses this sprite.");
    } catch (e) {
      this.status(e.message);
    }
  }
  spriteCanvas(sprite) {
    const c = document.createElement("canvas");
    c.width = sprite.width;
    c.height = sprite.height;
    c.getContext("2d").putImageData(
      new ImageData(spriteToRgba(sprite), sprite.width, sprite.height),
      0,
      0,
    );
    return c;
  }
  checker(ctx, w, h, size = 12) {
    for (let y = 0; y < h; y += size)
      for (let x = 0; x < w; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 ? "#bac4b0" : "#d1d8c4";
        ctx.fillRect(x, y, size, size);
      }
  }
  render() {
    $("canopy-toggle").checked = !!this.sprite.occludes;
    const canvas = $("pixel-canvas"),
      ctx = canvas.getContext("2d"),
      s = this.sprite,
      unit = canvas.width / s.width;
    ctx.imageSmoothingEnabled = false;
    this.checker(ctx, canvas.width, canvas.height, unit * 2);
    this.previewCanvas = this.spriteCanvas(s);
    ctx.drawImage(this.previewCanvas, 0, 0, canvas.width, canvas.height);
    if (this.layer === "footprint") {
      ensureFootprint(s, this.name);
      ctx.fillStyle = "#fa5e627d";
      s.footprint.forEach((v, i) => {
        if (v)
          ctx.fillRect(
            (i % s.width) * unit,
            (Math.floor(i / s.width) * canvas.height) / s.height,
            unit,
            canvas.height / s.height,
          );
      });
    }
    if ($("show-grid").checked && s.width <= 64) {
      ctx.strokeStyle = "#1b38221c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= s.width; i++) {
        ctx.moveTo(i * unit, 0);
        ctx.lineTo(i * unit, canvas.height);
      }
      for (let i = 0; i <= s.height; i++) {
        ctx.moveTo(0, (i * canvas.height) / s.height);
        ctx.lineTo(canvas.width, (i * canvas.height) / s.height);
      }
      ctx.stroke();
    }
    const p = $("sprite-preview").getContext("2d");
    p.imageSmoothingEnabled = false;
    p.fillStyle = "#294636";
    p.fillRect(0, 0, 180, 130);
    p.strokeStyle = "#6d895b44";
    for (let x = 0; x < 180; x += 26) {
      p.beginPath();
      p.moveTo(x, 0);
      p.lineTo(x, 130);
      p.stroke();
    }
    for (let y = 0; y < 130; y += 26) {
      p.beginPath();
      p.moveTo(0, y);
      p.lineTo(180, y);
      p.stroke();
    }
    p.drawImage(this.spriteCanvas(s), 42, 17, 96, 96);
    $("pixel-status").textContent =
      s.width +
      " × " +
      s.height +
      " · " +
      (s.palette.length - 1) +
      " COLORS · TRANSPARENT RGBA";
    if (this.layer === "footprint")
      $("pixel-status").textContent =
        s.width +
        " × " +
        s.height +
        " · " +
        s.footprint.filter(Boolean).length +
        " SOLID PIXELS";
  }
  animate(time) {
    if (!$("animate-preview").checked || !this.previewCanvas) return;
    const c = $("sprite-preview").getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#294636";
    c.fillRect(0, 0, 180, 130);
    c.strokeStyle = "#6d895b44";
    for (let x = 0; x < 180; x += 26) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 130);
      c.stroke();
    }
    for (let y = 0; y < 130; y += 26) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(180, y);
      c.stroke();
    }
    const kind = this.name,
      mode = $("preview-action").value,
      actor = {
        id: 1,
        x: 90,
        y: 67,
        sprite: kind,
        kind,
        faceX: Math.sin(time * 0.45),
        faceY: Math.cos(time * 0.45),
        moving: mode === "walk",
        step: time * 8,
        state: mode === "attack" ? "windup" : "hunt",
        attack: mode === "attack" ? 0.34 * (1 - (time % 1)) : 0,
      };
    if (this.layer === "footprint")
      c.drawImage(this.previewCanvas, 42, 17, 96, 96);
    else this.previewAnimator.draw(c, actor, time, 76);
    if (this.layer === "footprint") {
      ensureFootprint(this.sprite, this.name);
      c.fillStyle = "#fa5e628a";
      this.sprite.footprint.forEach((v, i) => {
        if (v)
          c.fillRect(
            42 + ((i % this.sprite.width) * 96) / this.sprite.width,
            17 + (Math.floor(i / this.sprite.width) * 96) / this.sprite.height,
            96 / this.sprite.width,
            96 / this.sprite.height,
          );
      });
    }
  }
  async loadImage(file) {
    if (file.size > 30e6) {
      this.status("Please use an image smaller than 30 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () =>
          reject(
            new Error("Could not read this image. Try PNG, JPEG, or WebP."),
          );
        img.src = url;
      });
      if (img.width * img.height > 25000000)
        throw new Error("Please use an image smaller than 25 megapixels.");
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      this.source = c.getContext("2d").getImageData(0, 0, c.width, c.height);
      this.sourceImage = c;
      this.crop = { x: 0, y: 0, w: c.width, h: c.height };
      const z = Math.min(720 / c.width, 510 / c.height) * 0.9;
      this.view = {
        zoom: z,
        x: (720 - c.width * z) / 2,
        y: (510 - c.height * z) / 2,
      };
      $("crop-dialog").showModal();
      this.drawSource();
    } catch (e) {
      this.status(e.message);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  sourcePoint(e) {
    const r = $("source-canvas").getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          this.source.width - 1,
          (((e.clientX - r.left) / r.width) * 720 - this.view.x) /
            this.view.zoom,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          this.source.height - 1,
          (((e.clientY - r.top) / r.height) * 510 - this.view.y) /
            this.view.zoom,
        ),
      ),
    };
  }
  convert(rect) {
    return convertRegion(this.source, rect, Number($("crop-size").value), {
      removeBackground: $("remove-bg").checked,
      tolerance: Number($("bg-tolerance").value),
      quantize: $("quantize").checked,
    });
  }
  drawSource() {
    if (!this.source) return;
    const c = $("source-canvas").getContext("2d");
    c.imageSmoothingEnabled = false;
    this.checker(c, 720, 510, 12);
    c.save();
    c.translate(this.view.x, this.view.y);
    c.scale(this.view.zoom, this.view.zoom);
    c.drawImage(this.sourceImage, 0, 0);
    if (this.crop) {
      c.strokeStyle = "#f9d582";
      c.lineWidth = 2 / this.view.zoom;
      c.strokeRect(this.crop.x, this.crop.y, this.crop.w, this.crop.h);
      c.fillStyle = "#f9d58214";
      c.fillRect(this.crop.x, this.crop.y, this.crop.w, this.crop.h);
    }
    c.restore();
    const p = $("crop-preview").getContext("2d");
    p.imageSmoothingEnabled = false;
    this.checker(p, 180, 180, 10);
    p.drawImage(this.spriteCanvas(this.convert(this.crop)), 0, 0, 180, 180);
  }
}
export function download(blob, name) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
