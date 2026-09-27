import {ComboEditor} from './combo-editor.mjs';
import {ParticleEditor} from './particle-editor.mjs';
import {HouseBuilder} from './house-builder.mjs';
import { rigSubject } from "./rig-subjects.mjs";
import {
  creatures,
  rules,
  rigPreset,
  creatureDefaults,
  definitionPack,
  applyDefinitions,
  validateRig,
} from "./definitions.mjs";
import { Animator } from "./animation.mjs";
import { RigStudio } from "./player-studio.mjs";
import { saveProjectRigs } from './project-rigs.mjs';
const element = (tag, text) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};
export class Designer {
  constructor(assets, events, items, onSave) {
    this.assets = assets;
    this.events = events;
    this.items = items;
    this.onSave = onSave;
    this.kind = "lion";
    this.tab = "Creature";
    this.part = 0;
    this.facing = "down";
    this.action = "walk";
    this.playing = true;
    this.time = 0;
    this.poseTime = 0;
    this.animator = new Animator(assets);
    this.playerStudio = new RigStudio(async () => {
      localStorage.setItem(
        "wildbound-design",
        JSON.stringify(definitionPack(this.events, this.items)),
      );
      this.onSave();
      return await saveProjectRigs(this.events, this.items);
    });
    this.dialog = element("dialog");
    this.dialog.className = "designer-dialog";
    document.body.append(this.dialog);
    this.render();
  }
  open() {
    this.render();
    this.dialog.showModal();
  }
  button(parent, label, fn) {
    const b = element("button", label);
    b.type = "button";
    b.onclick = fn;
    parent.append(b);
    return b;
  }
  field(parent, label, object, key, opts = {}) {
    const row = element("label", label.replace(/([A-Z])/g, " $1")),
      v = object[key],
      input = opts.options ? element("select") : element("input");
    if (opts.options) {
      for (const val of opts.options)
        input.append(new Option(val || "none", val));
      input.value = v ?? "";
    } else if (typeof v === "boolean") {
      input.type = "checkbox";
      input.checked = v;
    } else {
      input.type =
        typeof v === "number"
          ? "number"
          : key.toLowerCase().includes("color")
            ? "color"
            : "text";
      input.value = v ?? "";
      if (input.type === "number") {
        input.step = opts.step || 0.1;
        input.min = opts.min ?? -100;
        input.max = opts.max ?? 1000;
      }
    }
    input.onchange = () => {
      const before = object[key];
      object[key] =
        input.type === "checkbox"
          ? input.checked
          : typeof v === "number"
            ? Math.max(
                Number(input.min),
                Math.min(Number(input.max), Number(input.value) || 0),
              )
            : input.value;
      if (opts.change && !opts.change(object[key])) {
        if (opts.validate) object[key] = before;
      }
      if (this.tab === "Creature") creatures[this.kind].edited = true;
      this.status.textContent = "Unsaved changes · preview is live";
    };
    row.append(input);
    parent.append(row);
    return input;
  }
  shell(){
    const header=this.dialog.querySelector(':scope > header'),nav=this.dialog.querySelector(':scope > nav'),body=element('main');body.className='studio-body';body.id='studio-panel';body.setAttribute('role','tabpanel');body.setAttribute('aria-label',this.tab);
    for(const child of [...this.dialog.children])if(child!==header&&child!==nav)body.append(child);this.dialog.append(body);
    nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Editor jobs');
    const labels=['Players','Creature','Rig & animation','Rules','Items','Events','House Builder','Particles','Combos'];
    [...nav.children].forEach((b,i)=>{const active=labels[i]===this.tab;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(active));b.setAttribute('aria-controls','studio-panel');b.tabIndex=active?0:-1;b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?labels.length-1:(i+(e.key==='ArrowLeft'?-1:1)+labels.length)%labels.length;this.tab=labels[next];this.render();this.dialog.querySelector('[aria-selected="true"]')?.focus();};});
  }
  render() {
    this.particleEditor?.stop();
    this.comboEditor?.stop();
    if (rigSubject(this.kind) && this.tab === "Rig & animation") {
      this.tab = "Players";
      this.playerStudio.setSubject(
        this.kind.startsWith("explorer") ? "player" : this.kind,
      );
    }
    if (this.kind.startsWith("explorer") && this.tab === "Rig & animation")
      this.tab = "Players";
    if (this.kind.startsWith("explorer") && this.tab === "Creature")
      this.kind = "lion";
    this.dialog.replaceChildren();
    const header = element("header");
    header.append(element("h2", "Wildbound Studio"));
    this.button(header, "Close", () => this.dialog.close());
    this.dialog.append(header);
    const nav = element("nav");
    for (const tab of [
      "Players",
      "Creature",
      "Rig & animation",
      "Rules",
      "Items",
      "Events",
      "House Builder",
      "Particles",
      "Combos",
    ])
      this.button(
        nav,
        tab === "Players"
          ? "Rig studio"
          : tab === "Rig & animation"
            ? "Other creature rigs"
            : tab,
        () => {
          this.tab = tab;
          this.render();
        },
      );
    this.dialog.append(nav);
    this.dialog.classList.toggle("player-designer", this.tab === "Players");
    if (this.tab === "Players") {
      const root = element("section");
      this.dialog.append(root);
      this.playerStudio.mount(root);
      this.shell();return;
    }
    if(this.tab==='Combos'){this.comboEditor ||= new ComboEditor();const root=element('section');this.dialog.append(root);this.comboEditor.mount(root);this.shell();return;}
    if(this.tab==='Particles'){this.particleEditor ||= new ParticleEditor();const root=element('section');this.dialog.append(root);this.particleEditor.mount(root);this.shell();return;}
    if(this.tab==='House Builder'){this.houseBuilder ||= new HouseBuilder();const root=element('section');this.dialog.append(root);this.houseBuilder.mount(root);this.shell();return;}
    this.status = element(
      "p",
      "Changes preview live. Save to keep them between sessions.",
    );
    this.status.setAttribute("role", "status");
    const controls = element("div");
    controls.className = "studio-controls";
    this.dialog.append(controls);
    if (["Creature", "Rig & animation"].includes(this.tab)) {
      this.field(controls, "Creature", this, "kind", {
        options: Object.keys(creatures).filter(
          (n) => !n.startsWith("explorer"),
        ),
        change: () => {
          this.part = 0;
          this.render();
          return true;
        },
      });
      this.button(controls, "Duplicate creature", () => {
        const name = this.dialog
          .querySelector("#new-creature-name")
          .value.trim()
          .replace(/[^a-zA-Z0-9_-]/g, "-");
        if (!name || creatures[name]) {
          this.status.textContent = "Choose a new unique name.";
          return;
        }
        creatures[name] = structuredClone(creatures[this.kind]);
        creatures[name].name = name;
        this.kind = name;
        this.render();
      });
      const name = element("input");
      name.id = "new-creature-name";
      name.placeholder = "new-creature-name";
      controls.append(name);
      const layout = element("div");
      layout.className = "studio-layout";
      const preview = element("section");
      this.canvas = element("canvas");
      this.canvas.width = 240;
      this.canvas.height = 240;
      preview.append(this.canvas);
      this.field(preview, "Facing", this, "facing", {
        options: ["down", "up", "left", "right"],
      });
      this.field(preview, "Preview action", this, "action", {
        options: ["idle", "walk", "attack", "hurt"],
      });
      this.button(
        preview,
        "Play / pause",
        () => (this.playing = !this.playing),
      );
      preview.append(
        element(
          "p",
          "Artwork comes from Sprite Workshop. Create or crop a head, torso, limb, foot, wing, stem or tail tip, then assign it to a part.",
        ),
      );
      const editor = element("section");
      editor.className = "studio-fields";
      layout.append(preview, editor);
      this.dialog.append(layout);
      const def = creatures[this.kind];
      if (rigSubject(this.kind))
        this.button(preview, "Edit in Rig studio", () => {
          this.playerStudio.setSubject(this.kind);
          this.tab = "Players";
          this.render();
        });
      if (this.tab === "Creature") {
        this.field(editor, "Faction", def, "faction", {
          options: ["enemy", "ally", "neutral"],
        });
        this.field(editor, "Behavior family", def, "aiKind", {
          options: [
            "lion",
            "panther",
            "crocodile",
            "boar",
            "snake",
            "bat",
            "wasp",
            "vine",
            "golem",
            "monkey",
            "skeleton",
            "archer",
            "rhino",
          ],
        });
        editor.append(
          element("h3", "Behavior modules · toggle to add or remove"),
        );
        for (const k of Object.keys(def.behaviors))
          this.field(editor, k, def.behaviors, k);
        editor.append(element("h3", "Unit sound effects"));
        def.sounds ||= { attack: "attack", hurt: "hurt", defeat: "defeat" };
        for (const k of ["attack", "hurt", "defeat"])
          this.field(editor, k, def.sounds, k, {
            options: ["", "attack", "hurt", "defeat", "heal", "event", "trap", "dodge", "win", "lose"],
          });
        editor.append(element("h3", "Behavior options"));
        for (const k of Object.keys(def.stats))
          this.field(editor, k, def.stats, k, { min: 0, max: 1500 });
        this.field(editor, "Drop item", def, "dropType", {
          options: ["", ...Object.keys(this.items)],
        });
        this.field(editor, "Drop chance", def.stats, "dropChance", {
          min: 0,
          max: 1,
        });
      } else {
        this.field(editor, "Renderer", def.rig, "mode", {
          options: ["rig", "legacy", "frames"],
        });
        const preset = element("select");
        for (const n of ["quadruped", "humanoid", "serpent", "winged", "plant"])
          preset.append(new Option(n, n));
        preset.value = def.rig.type;
        editor.append(preset);
        this.button(editor, "Apply rig preset", () => {
          def.rig = rigPreset(preset.value);
          this.part = 0;
          this.render();
        });
        for (const k of [
          "stride",
          "rate",
          "bob",
          "tailThickness",
          "tailLength",
          "tailSegments",
          "tailTaper",
          "tailSwing",
          "tailTip",
        ])
          this.field(editor, k, def.rig, k, {
            min: 0,
            max: k === "tailTaper" ? 1 : 64,
          });
        const select = element("select");
        def.rig.parts.forEach((p, i) =>
          select.append(new Option(p.name, String(i))),
        );
        select.value = this.part;
        select.onchange = () => {
          this.part = Number(select.value);
          this.render();
        };
        editor.append(element("h3", "Parts & attachment points"), select);
        this.button(editor, "Add part", () => {
          const p = structuredClone(rigPreset("humanoid").parts[0]);
          p.name = "part" + Date.now().toString(36).slice(-5);
          p.parent = "";
          p.motion = "none";
          def.rig.parts.push(p);
          this.part = def.rig.parts.length - 1;
          this.render();
        });
        this.button(editor, "Remove part", () => {
          const p = def.rig.parts[this.part];
          if (p) {
            for (const child of def.rig.parts)
              if (child.parent === p.name) child.parent = p.parent;
            def.rig.parts.splice(this.part, 1);
            this.part = 0;
            this.render();
          }
        });
        const p = def.rig.parts[this.part];
        if (p) {
          this.field(editor, "Part name", p, "name", { change: () => true });
          this.field(editor, "Parent joint", p, "parent", {
            options: [
              "",
              ...def.rig.parts.filter((q) => q !== p).map((q) => q.name),
            ],
            validate: true,
            change: () => validateRig(def.rig),
          });
          this.field(editor, "Motion", p, "motion", {
            options: ["none", "legL", "legR", "armL", "armR", "wingL", "wingR"],
          });
          const facing = element("input");
          facing.type = "checkbox";
          facing.checked = !!this.editFacing;
          const l = element("label", "Edit only " + this.facing + " facing");
          l.append(facing);
          editor.append(l);
          facing.onchange = () => {
            this.editFacing = facing.checked;
            this.render();
          };
          let target = p;
          if (this.editFacing) {
            p.views ??= {};
            p.views[this.facing] ??= {
              x: p.x,
              y: p.y,
              w: p.w,
              h: p.h,
              angle: p.angle,
              pivotX: p.pivotX,
              pivotY: p.pivotY,
              source: p.source,
              rect: [...p.rect],
              color: p.color,
            };
            target = p.views[this.facing];
          }
          this.field(editor, "Artwork sprite", target, "source", {
            options: ["", ...Object.keys(this.assets.library)],
          });
          for (const k of [
            "x",
            "y",
            "w",
            "h",
            "angle",
            "pivotX",
            "pivotY",
            "color",
          ])
            this.field(editor, k, target, k, {
              min: ["w", "h"].includes(k)
                ? 1
                : ["pivotX", "pivotY"].includes(k)
                  ? 0
                  : -64,
              max: ["pivotX", "pivotY"].includes(k) ? 1 : 128,
            });
          const crop = element("div");
          crop.className = "part-crop";
          for (let n = 0; n < 4; n++)
            this.field(
              crop,
              ["crop X", "crop Y", "crop W", "crop H"][n],
              target.rect,
              n,
              { min: n > 1 ? 1 : 0, max: 128, step: 1 },
            );
          editor.append(crop);
          this.sourceCanvas = element("canvas");
          this.sourceCanvas.width = this.sourceCanvas.height = 160;
          editor.append(this.sourceCanvas);
          this.sourceTarget = target;
          this.sourceCanvas.onpointerdown = (e) => {
            if (!target.source) return;
            const source = this.assets.canvas(target.source),
              box = this.sourceCanvas.getBoundingClientRect();
            this.cropStart = {
              x: Math.floor(
                ((e.clientX - box.left) / box.width) * source.width,
              ),
              y: Math.floor(
                ((e.clientY - box.top) / box.height) * source.height,
              ),
            };
            this.sourceCanvas.setPointerCapture(e.pointerId);
          };
          this.sourceCanvas.onpointerup = (e) => {
            if (!this.cropStart) return;
            const source = this.assets.canvas(target.source),
              box = this.sourceCanvas.getBoundingClientRect(),
              x = Math.max(
                0,
                Math.min(
                  source.width,
                  Math.round(
                    ((e.clientX - box.left) / box.width) * source.width,
                  ),
                ),
              ),
              y = Math.max(
                0,
                Math.min(
                  source.height,
                  Math.round(
                    ((e.clientY - box.top) / box.height) * source.height,
                  ),
                ),
              );
            target.rect = [
              Math.min(x, this.cropStart.x),
              Math.min(y, this.cropStart.y),
              Math.max(1, Math.abs(x - this.cropStart.x)),
              Math.max(1, Math.abs(y - this.cropStart.y)),
            ];
            this.cropStart = null;
            this.render();
          };
          editor.append(element("h3", "Animation keys · " + this.action));
          def.rig.clips ??= {};
          def.rig.clips[this.action] ??= { duration: 1, keys: [] };
          const clip = def.rig.clips[this.action];
          this.field(editor, "Duration (seconds)", clip, "duration", {
            min: 0.1,
            max: 10,
          });
          const slider = element("input");
          slider.type = "range";
          slider.min = 0;
          slider.max = 1;
          slider.step = 0.01;
          slider.value = this.poseTime;
          slider.oninput = () => {
            this.poseTime = Number(slider.value);
            this.playing = false;
          };
          editor.append(slider);
          const keyFields = element("div");
          this.keyPose ??= { x: 0, y: 0, angle: 0 };
          for (const k of ["x", "y", "angle"])
            this.field(keyFields, "Pose " + k, this.keyPose, k, {
              min: -64,
              max: 64,
            });
          editor.append(keyFields);
          this.button(editor, "Set key for selected part", () => {
            let key = clip.keys.find(
              (k) => Math.abs(k.t - this.poseTime) < 0.005,
            );
            if (!key) {
              key = { t: this.poseTime, parts: {} };
              clip.keys.push(key);
              clip.keys.sort((a, b) => a.t - b.t);
            }
            key.parts[p.name] = { ...this.keyPose };
            this.render();
          });
          for (const key of clip.keys)
            this.button(
              editor,
              Math.round(key.t * 100) +
                "% · " +
                Object.keys(key.parts).join(", "),
              () => {
                this.poseTime = key.t;
                this.keyPose = {
                  ...(key.parts[p.name] || { x: 0, y: 0, angle: 0 }),
                };
                this.playing = false;
                this.render();
              },
            );
          this.button(editor, "Delete key at cursor", () => {
            clip.keys = clip.keys.filter(
              (k) => Math.abs(k.t - this.poseTime) > 0.005,
            );
            this.render();
          });
        }
      }
    } else if (this.tab === "Rules") {
      const fields = element("div");
      fields.className = "studio-fields";
      for (const k of Object.keys(rules))
        this.field(fields, k, rules, k, {
          min: 0.01,
          max: k === "portalDamage" ? 1 : 2000,
        });
      this.dialog.append(fields);
    } else if (this.tab === "Items") {
      this.item ??= "sword";
      this.field(controls, "Item", this, "item", {
        options: Object.keys(this.items),
        change: () => {
          this.render();
          return true;
        },
      });
      const item = this.items[this.item],
        fields = element("div");
      fields.className = "studio-fields";
      for (const k of ["name", "description", "color"])
        this.field(fields, k, item, k);
      for (const k of ["damage", "armor", "stack", "punch", "magnet"]) {
        item[k] ??= 0;
        this.field(fields, k, item, k, { min: 0, max: 999 });
      }
      item.slot ??= "";
      this.field(fields, "Equipment slot", item, "slot", {
        options: [
          "",
          "head",
          "neck",
          "cape",
          "shoulders",
          "chest",
          "gloves",
          "pants",
          "feet",
          "hand1",
          "hand2",
        ],
      });
      for (const k of ["light", "twoHanded", "rootResist"]) {
        item[k] ??= false;
        this.field(fields, k, item, k);
      }
      this.dialog.append(fields);
    } else {
      this.eventIndex ??= 0;
      const select = element("select");
      this.events.forEach((e, i) =>
        select.append(new Option(e.name, String(i))),
      );
      select.value = this.eventIndex;
      select.onchange = () => {
        this.eventIndex = Number(select.value);
        this.render();
      };
      controls.append(select);
      this.button(controls, "Add event", () => {
        this.events.push({
          ...this.events[0],
          name: "New encounter",
          kind: this.kind,
        });
        this.eventIndex = this.events.length - 1;
        this.render();
      });
      const fields = element("div");
      fields.className = "studio-fields";
      const event = this.events[this.eventIndex];
      event.type ??= "encounter";
      event.weight ??= 10;
      event.duration ??= 45;
      event.spread ??= 0.45;
      event.intensity ??= 1;
      this.field(fields, "Event type", event, "type", {
        options: ["encounter", "monsoon", "blizzard", "volcano", "stampede"],
      });
      for (const k of ["weight", "duration", "spread", "intensity"])
        this.field(fields, k, event, k, { min: 0, max: 1000 });
      for (const k of ["name", "verse", "tip"]) this.field(fields, k, event, k);
      this.field(fields, "Creature", event, "kind", {
        options: Object.keys(creatures),
      });
      for (const k of ["count", "hp", "speed", "damage"])
        this.field(fields, k, event, k, {
          min: k === "count" ? 1 : 0,
          max: k === "count" ? 20 : 1000,
        });
      this.dialog.append(fields);
    }
    const footer = element("footer");
    this.button(footer, "Save definitions", async () => {
      try {
        for (const c of Object.values(creatures))
          if (!validateRig(c.rig))
            throw Error("Invalid parent chain or part geometry: " + c.name);
        localStorage.setItem(
          "wildbound-design",
          JSON.stringify(definitionPack(this.events, this.items)),
        );
        this.onSave();
        await saveProjectRigs(this.events, this.items);
        this.status.textContent =
          "Saved. Existing creatures refreshed; new events use these settings.";
      } catch (e) {
        this.status.textContent = e.message;
      }
    });
    this.button(footer, "Export definitions", () => {
      const url = URL.createObjectURL(
          new Blob(
            [JSON.stringify(definitionPack(this.events, this.items), null, 2)],
            { type: "application/json" },
          ),
        ),
        a = element("a");
      a.href = url;
      a.download = "wildbound-definitions.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const input = element("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      try {
        applyDefinitions(
          JSON.parse(await e.target.files[0].text()),
          this.events,
          this.items,
        );
        this.render();
        this.status.textContent = "Imported. Preview, then Save definitions.";
      } catch (e) {
        this.status.textContent = e.message;
      }
    };
    footer.append(input);
    this.dialog.append(footer, this.status);this.shell();
  }
  animate(dt) {
    if (this.dialog.open && this.tab === "Players") {
      this.playerStudio.animate(dt);
      return;
    }
    if (!this.dialog.open || !this.canvas || !this.canvas.isConnected) return;
    if (this.playing) this.time += dt;
    const c = this.canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#253b32";
    c.fillRect(0, 0, 240, 240);
    for (let n = 0; n < 240; n += 20) {
      c.strokeStyle = "#61776033";
      c.strokeRect(n, 0, 20, 240);
      c.strokeRect(0, n, 240, 20);
    }
    const face = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[
        this.facing
      ],
      rig = creatures[this.kind].rig,
      t = this.playing
        ? this.time
        : this.poseTime * (rig.clips?.[this.action]?.duration || 1);
    this.animator.draw(
      c,
      {
        kind: this.kind,
        x: 120,
        y: 118,
        moving: this.action === "walk",
        step: t * rig.rate,
        faceX: face[0],
        faceY: face[1],
        attack: this.action === "attack" ? 0.34 - (t % 0.34) : 0,
        animationAction: this.action,
        rigOverride: rig,
        poseTime: this.playing ? undefined : this.poseTime,
      },
      t,
      this.kind === "dragon" ? 80 : 110,
    );
    if (this.sourceCanvas?.isConnected) {
      const x = this.sourceCanvas.getContext("2d"),
        p = this.sourceTarget,
        source = p.source && this.assets.canvas(p.source);
      x.imageSmoothingEnabled = false;
      x.fillStyle = "#263c32";
      x.fillRect(0, 0, 160, 160);
      if (source) {
        x.drawImage(source, 0, 0, 160, 160);
        x.strokeStyle = "#ffcf75";
        x.lineWidth = 2;
        const [sx, sy, sw, sh] = p.rect;
        x.strokeRect(
          (sx / source.width) * 160,
          (sy / source.height) * 160,
          (sw / source.width) * 160,
          (sh / source.height) * 160,
        );
      }
    }
  }
}
