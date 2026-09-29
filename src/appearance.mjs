export const HAIR_STYLES = {
  none: "Bald",
  crop: "Short crop",
  bob: "Bob",
  long: "Long hair",
  ponytail: "Ponytail",
  mohawk: "Mohawk",
  curls: "Curls",
};
export const DEFAULT_APPEARANCE = {
  skin: "#d9ab76",
  shirt: "#39745b",
  pants: "#665b87",
  shoes: "#49372d",
  hair: "crop",
  hairColor: "#593923",
};
export function shade(color) {
  return (
    "#" +
    color
      .slice(1)
      .match(/../g)
      .map((v) =>
        Math.round(parseInt(v, 16) * 0.7)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
const appearanceLocks = new WeakMap();
export function appearanceControls(root, value, changed, options = {}) {
  root.innerHTML = "";
  root.classList.toggle("compact-appearance", !!options.compact);
  if (options.compact) {
    const presets = {
      Explorer: {
        skin: "#d9ab76", shirt: "#39745b", pants: "#665b87",
        shoes: "#49372d", hair: "crop", hairColor: "#593923",
      },
      Sunward: {
        skin: "#865437", shirt: "#d3b562", pants: "#49372d",
        shoes: "#272c35", hair: "curls", hairColor: "#272c35",
      },
      River: {
        skin: "#f2d6b3", shirt: "#46799e", pants: "#272c35",
        shoes: "#593923", hair: "ponytail", hairColor: "#a94955",
      },
    };
    const skinTones = [
      ["#f2d6b3", "Light"],
      ["#d9ab76", "Warm"],
      ["#b97850", "Bronze"],
      ["#865437", "Deep"],
      ["#54372c", "Umber"],
    ];
    const hairColors = [
      ["#272c35", "Black"],
      ["#593923", "Brown"],
      ["#a94955", "Auburn"],
      ["#d3b562", "Golden"],
      ["#d9d4ba", "Silver"],
    ];
    const grid = document.createElement("div");
    grid.className = "compact-appearance-grid";
    const addSelect = (label, options, current, apply) => {
      const field = document.createElement("label");
      field.className = "creation-choice";
      field.textContent = label;
      const select = document.createElement("select");
      select.setAttribute("aria-label", label);
      for (const [id, name] of options) select.append(new Option(name, id));
      select.value = current;
      select.onchange = () => {
        apply(select.value);
        changed();
      };
      field.append(select);
      grid.append(field);
    };
    addSelect(
      "Look",
      [["", "Choose a look"], ...Object.keys(presets).map((name) => [name, name])],
      "",
      (name) => {
        if (presets[name]) Object.assign(value, presets[name]);
      },
    );
    addSelect("Skin tone", skinTones, value.skin, (v) => (value.skin = v));
    addSelect(
      "Hair style",
      Object.entries(HAIR_STYLES),
      value.hair,
      (v) => (value.hair = v),
    );
    addSelect(
      "Hair color",
      hairColors,
      value.hairColor,
      (v) => (value.hairColor = v),
    );
    root.append(grid);
    const note = document.createElement("p");
    note.className = "appearance-help";
    note.textContent = "Choose a look, then fine-tune skin and hair.";
    root.append(note);
    return;
  }
  const swatches = [
    "#d9ab76",
    "#f2d6b3",
    "#b97850",
    "#865437",
    "#54372c",
    "#39745b",
    "#665b87",
    "#49372d",
    "#593923",
    "#a94955",
    "#46799e",
    "#d3b562",
    "#272c35",
    "#d9d4ba",
    "#9a638c",
    "#e0914c",
  ];
  const locks = appearanceLocks.get(value) || new Set();
  appearanceLocks.set(value, locks);
  const toolbar = document.createElement("div");
  toolbar.className = "appearance-toolbar";
  const presets = {
    Explorer: {
      skin: "#d9ab76",
      shirt: "#39745b",
      pants: "#665b87",
      shoes: "#49372d",
      hair: "crop",
      hairColor: "#593923",
    },
    Sunward: {
      skin: "#865437",
      shirt: "#d3b562",
      pants: "#49372d",
      shoes: "#272c35",
      hair: "curls",
      hairColor: "#272c35",
    },
    River: {
      skin: "#f2d6b3",
      shirt: "#46799e",
      pants: "#272c35",
      shoes: "#593923",
      hair: "ponytail",
      hairColor: "#a94955",
    },
  };
  const preset = document.createElement("select");
  preset.setAttribute("aria-label", "Appearance preset");
  preset.append(new Option("Choose a look", ""));
  Object.keys(presets).forEach((k) => preset.append(new Option(k, k)));
  preset.onchange = () => {
    if (preset.value) {
      for (const [k, v] of Object.entries(presets[preset.value]))
        if (!locks.has(k)) value[k] = v;
      changed();
      appearanceControls(root, value, changed);
    }
  };
  const random = document.createElement("button");
  random.type = "button";
  random.textContent = "Randomize unlocked";
  random.onclick = () => {
    for (const k of ["skin", "shirt", "pants", "shoes", "hairColor", "hair"])
      if (!locks.has(k))
        value[k] =
          k === "hair"
            ? Object.keys(HAIR_STYLES)[Math.floor(Math.random() * 7)]
            : swatches[Math.floor(Math.random() * swatches.length)];
    changed();
    for (const input of root.querySelectorAll("select[name],input[name]"))
      input.value = value[input.name];
  };
  toolbar.append(preset, random);
  root.append(toolbar);
  for (const [key, title] of Object.entries({
    skin: "Skin tone",
    shirt: "Starting shirt",
    pants: "Starting pants",
    shoes: "Starting shoes",
    hairColor: "Hair color",
    hair: "Hair style",
  })) {
    const label = document.createElement("label");
    label.textContent = title;
    const input = document.createElement("select");
    input.name = key;
    if (key === "hair")
      for (const [id, name] of Object.entries(HAIR_STYLES))
        input.append(new Option(name, id));
    else
      for (const [i, color] of [
        ...new Set([value[key], ...swatches]),
      ].entries()) {
        const o = new Option(
          i === 0 ? "Current · " + color : "Swatch " + i + " · " + color,
          color,
        );
        o.style.background = color;
        input.append(o);
      }
    input.value = value[key];
    input.oninput = () => {
      value[key] = input.value;
      changed();
    };
    input.onchange = input.oninput;
    const lock = document.createElement("button");
    lock.type = "button";
    lock.textContent = "Lock";
    lock.setAttribute("aria-label", "Lock " + title);
    lock.onclick = () => {
      if (locks.has(key)) locks.delete(key);
      else locks.add(key);
      lock.textContent = locks.has(key) ? "Unlock" : "Lock";
    };
    label.append(input, lock);
    root.append(label);
  }
  for (const [key, title, options] of [
    [
      "face",
      "Face",
      [
        ["classic", "Classic"],
        ["freckles", "Freckles"],
        ["scar", "Scar"],
        ["beard", "Beard"],
      ],
    ],
    [
      "build",
      "Silhouette",
      [
        ["standard", "Standard"],
        ["broad", "Broad"],
        ["slender", "Slender"],
      ],
    ],
  ]) {
    const label = document.createElement("label");
    label.textContent = title;
    const s = document.createElement("select");
    for (const [id, name] of options) s.append(new Option(name, id));
    s.value = value[key] || options[0][0];
    s.onchange = () => {
      value[key] = s.value;
      changed();
    };
    label.append(s);
    root.append(label);
  }
  const advanced = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Custom colors";
  advanced.append(summary);
  for (const key of ["skin", "shirt", "pants", "shoes", "hairColor"]) {
    const label = document.createElement("label");
    label.textContent = key;
    const input = document.createElement("input");
    input.type = "color";
    input.value = value[key];
    input.oninput = () => {
      value[key] = input.value;
      changed();
    };
    label.append(input);
    advanced.append(label);
  }
  root.append(advanced);
}
export function drawHair(c, h, appearance, direction) {
  const style = appearance?.hair;
  if (!style || style === "none") return;
  const x = Math.round(h.x),
    y = Math.round(h.y),
    back = direction >= 3 && direction <= 5;
  const base = appearance.hairColor || "#593923";
  const dark = shade(base), ink = shade(dark);
  const light = "#" + base.slice(1).match(/../g).map(v =>
    Math.min(255, Math.round(parseInt(v, 16) * 1.25 + 16)).toString(16).padStart(2, "0")
  ).join("");
  const r = (dx, dy, w, hh, color) => {
    c.fillStyle = color; c.fillRect(x + dx, y + dy, w, hh);
  };
  // Stepped silhouette and clustered highlights stay crisp at game resolution.
  // The part shifts with facing; the rear has a full crown rather than a face.
  const profile = direction === 2 || direction === 6;
  const flip = direction >= 5 ? -1 : 1;
  if (style === 'crop') {
    // A close, swept cut with a smaller crown and direction-aware sideburns.
    r(-3,-7,6,1,ink);r(-5,-6,9,3,ink);r(-6,-4,11,2,ink);
    r(-3,-6,6,1,dark);r(-4,-5,8,2,base);r(-5,-3,9,1,base);
    r(-3,-5,3,1,light);r(-4,-4,3,1,light);r(0,-4,3,1,dark);
    r(2,-3,2,2,dark);
    if(back){
      r(-5,-2,10,4,ink);r(-4,-2,8,3,base);
      r(-3,-2,3,1,light);r(2,-1,2,3,dark);r(-3,2,6,1,dark);
    }else if(profile){
      const rear=direction===2?3:-5;
      r(rear,-2,2,4,ink);r(rear,-2,1,3,base);
    }else{
      r(-5,-2,1,3,dark);r(4,-2,1,2,dark);
      r(-3,-2,3,1,base);r(-3,-1,1,1,dark);
    }
    return;
  }
  r(-4, -8, 8, 1, ink);
  r(-6, -7, 11, 3, ink);
  r(profile ? (flip === 1 ? -2 : -6) : -7, -4, profile ? 8 : 13, 3, ink);
  r(-5, -7, 8, 2, base);
  r(-6, -5, 11, profile ? 2 : 3, base);
  r(profile ? (flip === 1 ? -2 : -5) : -5, -3, profile ? 7 : 10, 2, dark);
  r(-3, -8, 3, 2, dark);
  r(3, -7, 3, 2, ink);
  r(3, -6, 2, 2, base);
  r(-4, -6, 3, 2, light);
  r(0, -5, 2, 2, light);
  r(3, -4, 2, 1, light);
  if (back) {
    r(-5, -2, 10, 5, ink);
    r(-4, -2, 8, 4, base);
    r(-3, -2, 2, 3, light);
    r(1, -1, 3, 4, dark);
    r(-2, 2, 4, 2, dark);
  } else {
    r(profile ? 3 * flip : -5 * flip - (flip < 0 ? 1 : 0), -2, 2, 4, dark);
    if (!profile) {
      r(-3 * flip, -2, 2, 2, base);
      r(0, -2, 2, 1, base);
    }
  }
  if (["bob", "long", "curls"].includes(style)) {
    const length = style === "long" ? 10 : 6;
    r(-7, -4, 3, length + 1, ink);
    r(-6, -4, 2, length, base);
    r(4, -4, 3, length + 1, ink);
    r(4, -4, 2, length, dark);
    if (back) { r(-4, -2, 8, length - 2, base); r(1, -2, 2, length - 2, dark); }
  }
  if (style === "ponytail") {
    const tail = direction >= 5 ? -7 : 4;
    r(tail, -2, 4, 10, ink);
    r(tail + 1, -1, 2, 8, base);
    r(tail, -1, 3, 1, "#c3a15e");
  }
  if (style === "mohawk") { r(-2, -11, 4, 7, ink); r(-1, -10, 2, 6, light); }
  if (style === "curls") {
    for (const [dx,dy] of [[-6,-7],[-2,-9],[2,-7],[-7,-3],[4,-3]]) {
      r(dx,dy,4,3,ink); r(dx,dy,2,2,base); r(dx,dy,1,1,light);
    }
  }
}
