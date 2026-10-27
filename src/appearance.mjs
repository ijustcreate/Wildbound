import {drawNativeHair,FACIAL_HAIR_STYLES,facialHairStyle} from './hair-design.mjs';
export {FACIAL_HAIR_STYLES} from './hair-design.mjs';
export const HAIR_STYLES = {
  none: "Bald",
  crop: "Short crop",
  bob: "Bob",
  long: "Long hair",
  ponytail: "Ponytail",
  mohawk: "Mohawk",
  curls: "Curls",
  sidepart: "Side part",
  undercut: "Undercut",
  pixie: "Pixie cut",
  waves: "Wavy hair",
  afro: "Afro",
  braids: "Long braid",
  locs: "Locs",
  topknot: "Top knot",
  twinbraids: "Twin braids",
  sideponytail: "Side ponytail",
  shag: "Shag",
  spikes: "Spikes",
};
export const FACE_STYLES={classic:'Classic',freckles:'Freckles',scar:'Scar',glasses:'Glasses',elf:'Elf ears',beard:'Full beard',stubble:'Stubble',goatee:'Goatee',warpaint:'War paint'};
export const hairCoversEar=style=>['bob','long','curls','waves','afro','locs','shag'].includes(style);
export const DEFAULT_APPEARANCE = {
  skin: "#d9ab76",
  shirt: "#66744e",
  pants: "#79634a",
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
    addSelect('Face details',Object.entries(FACE_STYLES),value.face||'classic',v=>value.face=v);
    addSelect('Facial hair',Object.entries(FACIAL_HAIR_STYLES),value.facialHair||({beard:'fullbeard',goatee:'goatee',stubble:'stubble'}[value.face])||'none',v=>value.facialHair=v);
    root.append(grid);
    const note = document.createElement("p");
    note.className = "appearance-help";
    note.textContent = "Choose a look, then fine-tune skin, hair and facial hair.";
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
            ? Object.keys(HAIR_STYLES)[Math.floor(Math.random() * Object.keys(HAIR_STYLES).length)]
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
      Object.entries(FACE_STYLES),
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
    ['facialHair','Facial hair',Object.entries(FACIAL_HAIR_STYLES)],
  ]) {
    const label = document.createElement("label");
    label.textContent = title;
    const s = document.createElement("select");
    for (const [id, name] of options) s.append(new Option(name, id));
    s.value = key==='facialHair'?facialHairStyle(value):value[key] || options[0][0];
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
  for (const key of ["skin", "shirt", "pants", "shoes", "hairColor", "facialHairColor"]) {
    const label = document.createElement("label");
    label.textContent = key;
    const input = document.createElement("input");
    input.type = "color";
    input.value = value[key] || value.hairColor;
    input.oninput = () => {
      value[key] = input.value;
      changed();
    };
    label.append(input);
    advanced.append(label);
  }
  root.append(advanced);
  const design=document.createElement('details'),heading=document.createElement('summary');
  heading.textContent='Hair construction';design.append(heading);
  for(const [key,title,choices]of [
    ['fringe','Fringe',[['','Use hairstyle'],['swept','Swept'],['blunt','Blunt'],['open','Open forehead'],['short','Short'],['curled','Curled'],['locks','Broad locks']]],
    ['part','Parting',[['left','Left'],['right','Right']]],
    ['volume','Volume',[['','Use hairstyle'],['-1','Close'],['0','Normal'],['1','Full'],['2','Very full']]],
    ['length','Nape length',[['','Use hairstyle'],['0','Cropped'],['3','Jaw'],['6','Shoulder'],['10','Long']]],
  ]){
    const label=document.createElement('label'),select=document.createElement('select');label.textContent=title;select.setAttribute('aria-label','Hair '+title.toLowerCase());
    for(const [id,name]of choices)select.append(new Option(name,id));select.value=String(value.hairDesign?.[key]??choices[0][0]);
    select.onchange=()=>{value.hairDesign={...value.hairDesign};if(select.value==='')delete value.hairDesign[key];else value.hairDesign[key]=['volume','length'].includes(key)?Number(select.value):select.value;changed();};
    label.append(select);design.append(label);
  }
  root.append(design);
}
export function drawHair(c, h, appearance, direction, frame = 0, action = 'idle') {
  return drawNativeHair(c,h,appearance,direction,frame,action);
}
