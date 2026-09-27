import { ITEMS } from "./items.mjs";
// Procedural pixel assets follow joint anchors and preserve eight-facing silhouettes.
export function wearableDetails(c, p, gear, look, d, time, cosmetics = {}) {
  const back = d >= 3 && d <= 5,
    side = d === 2 || d === 6;
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const chest = p.chest,
    head = p.head;
  if (gear.chest) {
    // Decoration follows the torso instead of stamping a second torso above it.
    const bottom = p.pelvis;
    const tint = cosmetics.dye || ITEMS[gear.chest]?.artColor || '#957b52';
    const steps = Math.max(1, Math.ceil(Math.hypot(bottom.x-chest.x,bottom.y-chest.y)));
    for(let n=0;n<=steps;n++) {
      const t=n/steps,x=chest.x+(bottom.x-chest.x)*t,y=chest.y+(bottom.y-chest.y)*t;
      rect(x-2,y,4,1,t>.8?'#423d36':tint);
      if(t<.8) {rect(x-2,y,1,1,back?'#5c5849':'#c2ad79');if(!side)rect(x+1,y,1,1,'#c2ad79');}
    }
    rect(bottom.x-1,bottom.y-1,2,1,ITEMS[gear.chest]?.color || '#d9bc73');
  }
  if (gear.pants)
    for (const side of ["L", "R"]) {
      const k = p["knee" + side];
      rect(k.x - 2, k.y - 1, 4, 3, cosmetics.dye || "#c1b88e");
    }
  if (look?.face === "freckles" && !back) {
    rect(head.x - 3, head.y, 1, 1, "#985e42");
    rect(head.x + 2, head.y, 1, 1, "#985e42");
  }
  if (look?.face === "scar" && !back)
    rect(head.x + 2, head.y - 2, 1, 4, "#ad6e5b");
  if (look?.face === "beard" && !back) {
    rect(head.x - 2, head.y + 2, 5, 2, look.hairColor || "#593923");
    rect(head.x - 1, head.y + 4, 3, 1, look.hairColor || "#593923");
  }
}
export function directionalHelmet(c, id, h, d, cosmetics = {}) {
  const def = ITEMS[id],
    back = d >= 3 && d <= 5,
    side = d === 2 || d === 6;
  if (!def) return;
  const r = (x, y, w, hh, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, hh);
  };
  const color = cosmetics.dye || def.artColor || def.color || "#9d936b";
  if (back || side) {
    if (def.style === "circlet") {
      r(h.x - 5, h.y - 4, 10, 2, color);
      r(h.x - 1, h.y - 5, 2, 3, "#dcd3f1");
      return true;
    }
    r(h.x - (side ? 4 : 5), h.y - 6, side ? 8 : 10, 5, color);
    r(h.x - (side ? 4 : 5), h.y - 1, side ? 3 : 10, 2, "#4f554c");
    if (def.style === "hood") {
      r(h.x - 5, h.y - 2, 3, 8, color);
      if (back) r(h.x + 2, h.y - 2, 3, 8, color);
    }
    if (def.style === "horned") {
      r(h.x - 7, h.y - 9, 2, 6, "#e3d8bc");
      r(h.x + 5, h.y - 9, 2, 6, "#e3d8bc");
      r(h.x - 8, h.y - 11, 2, 3, "#b5bcb7");
      r(h.x + 6, h.y - 11, 2, 3, "#b5bcb7");
    }
    if (!def.style || def.style === "cap") r(h.x - 6, h.y - 2, 12, 2, color);
    if (def.rarity && def.rarity !== "common")
      r(h.x - 1, h.y - 5, 2, 2, def.color || "#e4cd82");
    return true;
  }
  return false;
}
