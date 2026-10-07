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
export const FACE_STYLES={classic:'Classic',freckles:'Freckles',scar:'Scar',elf:'Elf ears',beard:'Full beard',stubble:'Stubble',goatee:'Goatee',warpaint:'War paint'};
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
export function drawHair(c, h, appearance, direction, frame = 0, action = 'idle') {
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
  const profile = direction === 2 || direction === 6;
  const turn = direction === 0 || direction === 4 ? 0 : direction < 4 ? -1 : 1;
  const moving = !['idle','sleep','death'].includes(action);
  // Sample the animation clock, not wall time, so paused rig frames stay still.
  const sway = moving ? Math.round(Math.sin(frame * .7) * 1.2) : 0;
  const r = (dx, dy, w, hh, color) => {
    c.fillStyle = color; c.fillRect(x + dx, y + dy, w, hh);
  };
  const part = turn * 2;
  const tuft=(xx,yy,w=3,hh=3)=>{r(xx,yy+1,w,hh,ink);r(xx+1,yy,Math.max(1,w-1),hh,base);r(xx+1,yy,1,1,light);};
  // These silhouettes are deliberately authored separately, not recolored crops.
  if(style==='afro'){
    for(const [xx,yy,w,hh] of [[-4,-13,8,3],[-7,-11,14,4],[-9,-7,18,5],[-8,-3,17,4],[-6,0,13,3]]){r(xx,yy,w,hh,ink);r(xx+1,yy+1,w-2,Math.max(1,hh-1),base);}
    for(const [xx,yy] of [[-4,-11],[0,-12],[4,-10],[-7,-7],[-2,-8],[2,-8],[6,-5],[-7,-2],[4,-2]]){r(xx,yy,2,1,light);r(xx+1,yy+1,2,1,dark);}
    if(!back){r(-4,-2,9,6,appearance.skin||'#d9ab76');r(-5,1,1,2,dark);r(5,1,1,2,dark);}return;
  }
  if(style==='spikes'){
    r(-5,-6,11,3,ink);r(-4,-5,9,2,base);
    for(const [xx,yy,hh]of [[-5,-9,4],[-2,-12,6],[1,-11,6],[4,-9,4]]){r(xx,yy,2,hh,ink);r(xx+1,yy+1,1,hh-1,light);}if(back)r(-4,-3,9,5,base);return;
  }
  if(style==='topknot'){
    r(-4,-7,9,4,ink);r(-3,-6,7,3,base);r(-1,-12,5,5,ink);r(0,-11,3,3,base);r(0,-11,2,1,light);r(-1,-7,5,1,'#c3a15e');if(back){r(-4,-3,9,6,base);r(2,-2,2,4,dark);}return;
  }
  if(['sidepart','undercut','pixie'].includes(style)){
    r(-4,-8,8,1,ink);r(-5,-7,11,3,ink);r(-4,-7,9,3,base);r(-4,-7,5,1,light);r(-5,-4,11,1,dark);
    const swept=turn>0?-1:1;r(-3*swept,-8,3,1,base);r(-3*swept,-4,4,1,base);r(-3*swept,-3,2,1,base);
    if(style==='sidepart'){r(1,-6,1,3,dark);r(-5,-3,2,3,dark);r(4,-3,1,3,dark);}
    if(style==='undercut'){r(-5,-3,2,3,shade(appearance.skin||'#d9ab76'));r(4,-3,1,3,shade(appearance.skin||'#d9ab76'));r(-4,-4,1,1,light);}
    if(style==='pixie'){tuft(-5,-5,3,2);tuft(3,-4,2,2);r(-2,-2,1,1,base);}
    if(back){r(-4,-3,9,style==='undercut'?2:5,base);r(2,-2,2,style==='undercut'?1:3,dark);}return;
  }
  const kind=style;
  if (style === 'mohawk') {
    const mirror=turn>0,paint=(dx,dy,w,hh,color)=>r(mirror?1-dx-w:dx,dy,w,hh,color);
    if(!turn){
      r(-1,-10,3,7,ink);r(0,-9,1,6,light);r(-1,-7,1,4,base);
      if(back){r(-1,-3,3,6,dark);r(0,-3,1,5,base);}
    }else{
      const wide=profile?7:5;
      paint(-3,-9,wide,5,ink);paint(-2,-10,wide-2,2,ink);
      paint(-2,-8,wide-2,4,base);paint(-2,-9,wide-3,1,light);
      paint(-3,-5,wide,1,dark);
      if(back){paint(0,-4,3,6,dark);paint(0,-3,1,5,base);}
    }
    return;
  }
  const crown = style === 'crop' ? -7 : -8;
  r(-3,crown,7,1,ink); r(-5,crown+1,11,3,ink); r(-6,crown+3,13,2,ink);
  r(-3,crown+1,7,1,base); r(-4,crown+2,9,3,base);
  r(-4,crown+2,3,1,light); r(-5,crown+3,3,1,light);
  r(part,crown+1,1,3,dark); r(3,crown+3,2,2,dark);
  if(style==='crop'){
    r(-3+part,crown-1,3,1,ink);r(-2+part,crown,3,1,base);
    r(-4+part,crown+2,3,1,light);r(1+part,crown+3,2,1,base);
  }
  if(['bob','long','waves','shag','locs'].includes(style)){
    r(-2+part,crown,4,1,base);r(part,crown+1,1,4,dark);
    r(-4,crown+3,2,2,light);r(3,crown+2,2,3,dark);
  }
  if (back) {
    r(-5,-3,11,6,ink); r(-4,-3,9,5,base);
    r(-3,-3,2,3,light); r(2,-2,2,4,dark);
    r(-2,2,5,1,dark); r(0,0,1,2,dark);
  } else {
    if(turn){
      // In side views the temple belongs behind the ear; keep the cheek clear.
      const rear=-turn;
      r(rear>0?3:-4,-3,2,3,dark);
      r(turn<0?-4:2,-3,3,1,base);
      if(!profile)r(turn<0?-4:4,-2,1,1,base);
    }else{
      r(-5,-3,2,3,dark);r(4,-3,1,3,dark);
      r(-3,-3,3,1,base);r(-2,-2,1,1,dark);
      if(style==='bob')r(1,-3,3,1,base);
    }
  }
  if (['bob','long','curls','waves','shag','locs'].includes(style)) {
    const length = ['long','locs'].includes(style) ? 10 : ['waves','shag'].includes(style)?8:style === 'bob' ? 6 : 5;
    for (const side of [-1,1]) {
      if(!back&&turn&&side===turn)continue;
      // Face-side locks are tucked behind the ear; the rear lock is fuller.
      const dx = side < 0 ? -5 : 3, hem = style === 'long' ? sway : 0;
      r(dx,-3,3,length,ink); r(dx+(side<0?1:0),-3,2,length-1,side<0?base:dark);
      r(dx+(side<0?1:0),-2,1,2,light);
      r(dx+hem,length-4,3,2,ink); r(dx+hem+1,length-4,1,1,base);
    }
    if (back) {
      r(-4,-2,9,length-1,base); r(-3,-2,1,length-2,light);
      r(2,-1,2,length-2,dark); r(-1,0,1,length-3,dark);
      r(-3,length-3,6,1,ink);
    }
  }
  if(kind==='waves'||kind==='shag')for(const side of [-1,1])for(let i=0;i<3;i++){
    if(!back&&turn&&side===turn&&i>0)continue;
    tuft(side*(5+(i%2))-1,-4+i*3+(moving?sway:0),3,3);
  }
  if(kind==='shag'){r(-4,-3,2,3,base);r(-1,-4,2,3,light);r(2,-3,2,2,base);r(-7,4,2,2,ink);r(6,3,2,2,ink);}
  if(kind==='locs'){
    const columns=back?[-4,-1,2,4]:turn?[-turn*5,-turn*3]:[-5,4];
    for(const xx of columns){r(xx,-4,2,12,ink);r(xx,-3,1,10,base);for(let yy=-1;yy<8;yy+=3)r(xx,yy,1,1,light);r(xx,8+(xx%2),2,1,'#c3a15e');}
  }
  if(['braids','twinbraids','sideponytail'].includes(kind)){
    const tails=kind==='twinbraids'?[-5,5]:[turn?-turn*5:kind==='sideponytail'?6:back?0:5];
    for(const tail of tails){r(tail-1,-3,3,3,ink);r(tail,-2,1,2,'#e8be7b');for(let i=0;i<5;i++){
      const xx=tail+(kind==='sideponytail'?sway:((i%2)*2-1))+(moving?Math.round(sway*i/4):0),yy=i*2;
      r(xx-1,yy,3,3,ink);r(xx,yy,2,2,base);r(xx,yy,1,1,light);
    }r(tail+(moving?sway:0),10,2,1,'#c3a15e');}
  }
  if (style === 'ponytail') {
    const tail = turn ? -turn*5 : back ? 0 : 5;
    r(tail-1,-3,4,4,ink); r(tail,-3,2,3,base);
    r(tail+sway,-1,4,5,ink);r(tail+sway+1,4,2,4,ink); r(tail+sway,0,2,6,base);
    r(tail+sway,1,1,4,light); r(tail+sway+1,6,1,2,dark);
    r(tail-1,-1,4,1,'#c3a15e'); r(tail,-1,1,1,'#f4ddb0');
  }
  if (style === 'curls') {
    for (const [dx,dy] of [[-5,-6],[-2,-7],[2,-6],[-5,-3],[3,-3],[-4,0],[3,0]]) {
      if(!back&&turn&&Math.sign(dx)===turn&&dy>=-3)continue;
      r(dx,dy+1,3,2,dark);r(dx+1,dy,2,3,base);r(dx+1,dy,1,1,light);
    }
  }
}
