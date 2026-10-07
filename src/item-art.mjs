import { ITEMS, itemKind } from "./items.mjs";
import { mixGearColor, paintGearIcon } from './gear-art.mjs';
import {paintSuccubusItem} from './succubus-attachments.mjs';
// Small, exact-pixel item silhouettes shared by ground loot and inventory.
export const ITEM_ART_TYPES = [
  "trap",
  "potion",
  "arrow",
    "fruit",
  "coconut",
  "meat",
  "sword",
  "dagger",
  "shield",
  "bow",
  "hat",
  "armor",
  "gloves",
  "pants",
  "boots",
  "charm",
];
const cache = new Map();
export function clearItemArtCache() { cache.clear(); }
for (const id of Object.keys(ITEMS))
  if (!ITEM_ART_TYPES.includes(id)) ITEM_ART_TYPES.push(id);
export function paintItem(c, type) {
  if(paintSuccubusItem(c,type))return;
  if(type==='unknown_mushroom'){c.fillStyle='#30253e';c.fillRect(7,13,11,9);c.fillRect(2,7,20,9);c.fillRect(6,3,12,7);c.fillStyle='#d9c5a0';c.fillRect(9,14,7,6);c.fillStyle='#9653bc';c.fillRect(3,8,18,6);c.fillRect(7,4,10,6);c.fillStyle='#e5c9ff';c.fillRect(7,6,3,3);c.fillRect(15,9,3,3);c.fillRect(3,10,2,2);return;}
  if(type==='dark_essence'){c.fillStyle='#2d173e';c.fillRect(8,5,8,15);c.fillRect(5,9,14,7);c.fillStyle='#8c4dcc';c.fillRect(9,6,5,12);c.fillRect(6,10,11,4);c.fillStyle='#e1b4ff';c.fillRect(10,7,2,5);c.fillRect(7,10,2,2);return;}
  if(ITEMS[type]?.boomerang){c.fillStyle='#352b21';for(let i=0;i<9;i++){c.fillRect(3+i,15-i,4,5);c.fillRect(12+i,7+i,4,5);}c.fillStyle=ITEMS[type].artColor;for(let i=0;i<9;i++){c.fillRect(4+i,15-i,2,3);c.fillRect(13+i,7+i,2,3);}return;}
  if(['gallery_medallion','phantom_charm','miners_keepsake'].includes(type)){
    c.fillStyle='#c5a35e';for(const [x,y,w,h]of [[5,2,2,7],[17,2,2,7],[7,8,2,3],[15,8,2,3],[9,10,6,2]])c.fillRect(x,y,w,h);
    c.fillStyle='#302b29';c.fillRect(7,12,10,10);c.fillStyle=ITEMS[type].artColor;c.fillRect(8,13,8,8);c.fillStyle='#f4e3b4';
    if(type==='gallery_medallion'){c.fillRect(10,14,4,5);c.fillStyle='#554b36';c.fillRect(11,15,3,1);}
    else if(type==='phantom_charm'){c.fillRect(12,14,1,5);c.fillRect(10,18,3,2);c.fillRect(13,14,2,1);}
    else{c.fillRect(10,15,5,1);c.fillRect(12,16,1,4);c.fillRect(9,16,2,1);}
    return;
  }
  if(type==='mystery_score'){c.fillStyle='#655039';c.fillRect(4,2,16,20);c.fillStyle='#e9d8aa';c.fillRect(5,3,14,18);c.fillStyle='#645942';for(let y=7;y<17;y+=3)c.fillRect(7,y,10,1);c.fillRect(10,8,2,6);c.fillRect(8,13,3,2);return;}
  if(type==='stick')return paintItemBase(c,type);
  if (!ITEMS[type]?.slot && !ITEMS[type]?.relic) return paintItemBase(c,type);
  const pixels = Array(576).fill(null);
  const raster = {fillStyle:'#302b2b',fillRect(x,y,w,h) {
    for(let yy=Math.max(0,y);yy<Math.min(24,y+h);yy++)
      for(let xx=Math.max(0,x);xx<Math.min(24,x+w);xx++) pixels[yy*24+xx]=this.fillStyle;
  }};
  paintItemBase(raster,type);
  const at=(x,y)=>x>=0&&x<24&&y>=0&&y<24?pixels[y*24+x]:null;
  const dense=pixels.filter(Boolean).length>300;
  const colors=new Map();
  const tint=(color,light)=>{
    const key=color+light;
    if(!colors.has(key)) colors.set(key,mixGearColor(color,light?'#f7e7c0':'#302b2b',.3));
    return colors.get(key);
  };
  for(let y=0;y<24;y++)for(let x=0;x<24;x++) {
    let color=at(x,y);
    if(!color) {
      if(dense)continue;
      if(![at(x-1,y),at(x+1,y),at(x,y-1),at(x,y+1)].some(Boolean)) continue;
      color='#302b2b';
    } else if(!at(x,y-1)) color=tint(color,true);
    else if(!at(x+1,y)||!at(x,y+1)) color=tint(color,false);
    c.fillStyle=color;c.fillRect(x,y,1,1);
  }
}
function paintItemBase(c, type) {
  if(type==='coffin_lid_shield') {
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    // Narrow head, broad shoulders and a tapered foot: a coffin lid, not a kite.
    for(const [x,y,w,h] of [[9,2,6,2],[7,4,10,2],[5,6,14,3],[6,9,12,3],[7,12,10,4],[8,16,8,5],[9,21,6,1]]) {
      r(x,y,w,h,'#352c27');r(x+1,y,w-2,h,'#896143');r(x+1,y,1,h,'#bc9262');r(x+w-2,y,1,h,'#654731');
    }
    r(9,5,1,15,'#5c402e');r(12,3,1,18,'#5c402e');r(14,9,1,10,'#ac8054');
    for(const [x,y,w] of [[6,7,12],[8,16,8]]) {
      r(x,y,w,2,'#465157');r(x,y,w,1,'#8e9895');
      r(x+1,y,1,1,'#d4d4ba');r(x+w-2,y,1,1,'#d4d4ba');
    }
    r(11,11,3,3,'#465157');r(12,11,1,2,'#a5aaa1');return;
  }
  if(type==='crypt_flame_sword') {
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    r(11,2,2,1,'#f0dfbd');r(10,3,4,12,'#5e5b50');r(11,3,2,12,'#d4bea0');
    r(11,3,1,11,'#f0dfbd');r(7,14,10,3,'#4d3e32');r(8,14,8,1,'#c8a060');
    r(11,17,3,5,'#4d3428');r(11,17,1,4,'#986a46');r(10,21,5,2,'#bd8e54');
    // Detached square embers leave the warm steel silhouette readable.
    for(const [x,y] of [[7,3],[15,6],[8,10],[16,11]]) {r(x,y,2,2,'#e67538');r(x,y,1,1,'#ffd17b');}
    r(14,2,1,2,'#f8ad50');r(6,8,1,1,'#ffd17b');return;
  }
  if(type==='caught_grave_moth'||type==='caught_crypt_beetle') {
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    r(7,3,10,3,'#a78a56');r(5,7,14,15,'#4b827d');r(6,8,12,13,'#739d96');
    r(7,8,1,11,'#d0efdf');r(5,21,14,2,'#b1d8c8');
    if(type==='caught_grave_moth') {
      r(9,11,3,5,'#b8a38d');r(13,11,3,5,'#b8a38d');r(10,16,5,2,'#8d7a70');
      r(12,11,1,7,'#4e414e');r(10,12,1,1,'#e2cfb3');r(14,12,1,1,'#e2cfb3');
    } else {
      r(10,13,6,5,'#3c3549');r(11,12,4,6,'#877b9b');r(12,13,1,5,'#4e414e');
      r(9,14,1,1,'#3c3549');r(16,14,1,1,'#3c3549');r(11,11,3,2,'#514357');r(11,13,1,2,'#bcadc3');
    }
    return;
  }
  if(type==='honeycomb'){
    const rows=['0011100','0111110','1111111','1111111','0111110','0011100'];
    for(const [cx,cy]of [[3,3],[10,3],[17,3],[3,10],[10,10],[17,10]])
      rows.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='1'){
        const edge=y===0||y===5||row[x-1]!=='1'||row[x+1]!=='1';
        c.fillStyle=edge?'#f9e6ac':y<3?'#efb840':'#be7925';c.fillRect(cx+x-3,cy+y,1,1);
      }});
    c.fillStyle='#f3bf45';c.fillRect(16,15,2,5);c.fillRect(15,19,4,2);
    c.fillStyle='#ffe39a';c.fillRect(16,17,1,3);return;
  }
  if(ITEMS[type]?.bansheeGear&&paintGearIcon(c,type))return;
  if(type==='raw_ice'){
    c.fillStyle='#559bb9';c.fillRect(5,9,14,12);c.fillRect(8,5,9,4);c.fillStyle='#91d5e9';c.fillRect(6,10,11,9);c.fillRect(9,6,7,4);c.fillStyle='#defbff';c.fillRect(7,10,3,7);c.fillRect(10,6,2,4);return;
  }
  if(ITEMS[type]?.supplyOnly){
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},color=ITEMS[type].artColor;
    r(6,2,2,8,'#c7a46a');r(16,2,2,8,'#c7a46a');r(8,9,8,2,'#c7a46a');
    r(8,12,8,8,'#283e37');r(9,13,6,6,color);
    if(type==='fern_pendant'){r(11,11,2,10,color);r(7,13,10,2,color);r(8,16,8,2,color);}
    if(type==='snowflake_pendant'){r(11,11,2,11,color);r(6,15,12,2,color);r(8,12,2,2,'#f0ffff');r(14,18,2,2,'#f0ffff');}
    if(type==='sunstone_pendant'){r(11,10,2,12,color);r(6,15,12,2,color);r(10,14,4,4,'#fff0b8');}
    if(type==='hearth_pendant'){r(7,12,10,2,color);r(10,10,4,2,color);r(11,16,2,4,'#f9deaa');}
    if(type==='jade_pendant'){r(10,10,4,12,color);r(6,14,12,4,color);r(10,14,4,4,'#efffc3');}
    return;
  }
  if(ITEMS[type]?.base==='quiver'){
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    for(const x of [10,12,14]){r(x,1,1,12,'#d9bd81');r(x-1,0,2,2,'#f2edcc');}
    r(8,6,8,18,'#3e3027');r(9,7,6,16,ITEMS[type].artColor);r(8,6,8,2,'#ddc18d');r(10,10,1,11,'#c6a779');if(type==='starter_quiver')r(12,13,2,3,'#e6d79a');return;
  }
  if (ITEMS[type]?.skillScroll) {
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    r(5,3,14,18,'#826039');r(6,4,12,16,'#edce82');r(3,2,17,4,'#f5e4b4');r(5,18,17,4,'#d3ad66');
    r(9,7,7,1,'#826039');r(9,10,7,1,'#826039');r(10,13,5,5,'#af4556');r(11,14,3,2,'#e4877a');
    const marks={second_wind:[[12,6],[11,7],[13,7],[12,8]],long_jump:[[10,8],[12,7],[14,6]],quick_revive:[[12,6],[11,7],[12,7],[13,7],[12,8]],pack_mule:[[10,6],[14,6],[10,8],[14,8]],scavenger:[[10,6],[14,6],[12,8]],steady_hand:[[12,6],[12,8],[10,7],[14,7]]};
    for(const [x,y] of marks[ITEMS[type].skillScroll]||[])r(x,y,1,1,'#294e63');return;
  }
  if (ITEMS[type]?.bag) {
    const r = (x,y,w,h,color) => { c.fillStyle=color; c.fillRect(x,y,w,h); };
    r(6,7,12,14,'#3a3024'); r(7,8,10,12,ITEMS[type].color);
    r(9,3,6,5,'#dac28b'); r(8,6,8,3,'#655334');
    r(8,10,2,8,'#fff1c033'); r(11,11,4,5,'#f5d782'); r(12,12,2,3,'#5b6643');
    return;
  }
  if(['relic_dust','magic_essence','legendary_essence'].includes(type)){
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    if(type==='relic_dust'){r(4,15,16,5,'#776650');r(7,11,10,7,'#b4a17a');r(10,7,4,9,'#ddc99c');r(3,7,2,2,'#c4af87');r(18,4,2,2,'#ddc99c');}
    else {const legendary=type==='legendary_essence',color=legendary?'#efb456':'#58bedb';r(8,6,8,14,color);r(6,11,12,6,color);r(10,2,4,19,legendary?'#fff2b4':'#cef8ff');r(3,8,2,3,color);if(legendary){r(17,3,3,3,'#fced8a');r(17,18,4,2,color);}else r(18,7,2,2,color);}
    return;
  }
  // Training equipment keeps its familiar base silhouette with a copper tag.
  if(type.startsWith('starter_')&&ITEMS[type.slice(8)]){
    paintItemBase(c,type.slice(8));c.fillStyle='#644b31';c.fillRect(2,19,6,4);c.fillStyle='#d2aa70';c.fillRect(3,20,4,2);return;
  }
  if(paintGearIcon(c,type))return;
  const r = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  if(type==='azure_bead'){r(10,2,4,4,'#b8a578');r(6,7,12,12,'#256981');r(4,10,16,6,'#256981');r(8,8,8,9,'#68d9ed');r(8,8,3,3,'#ddfaff');r(10,19,4,2,'#184c65');return;}
  if(type==='moon_prism'){for(let y=3;y<22;y++){const w=Math.max(1,7-Math.abs(y-12)*.7)|0;r(12-w,y,w*2+1,1,y<12?'#a8a0ee':'#625baf');}r(11,5,2,12,'#e0dbff');return;}
  if(type==='starheart'){r(10,2,4,20,'#5cb9a0');r(2,10,20,4,'#5cb9a0');r(6,6,12,12,'#5cb9a0');r(8,8,8,8,'#a2f3d4');r(10,6,3,10,'#efffea');r(6,10,11,3,'#efffea');return;}
  if(type==='ritual_dagger'){r(11,2,3,12,'#91efcf');r(9,5,2,7,'#3e9b89');r(8,13,9,3,'#ddb457');r(11,16,3,5,'#78563f');r(10,20,5,2,'#eabf5c');return;}
  if(type==='necromancer_dagger'){r(11,1,3,11,'#b36de0');r(9,4,2,9,'#6e3f9d');r(8,12,9,3,'#8fd3bd');r(11,15,3,7,'#352541');r(9,20,7,2,'#cf8cff');r(6,7,3,2,'#cf8cff');return;}
  if(type==='friendship_wand'){r(11,3,3,17,'#ff8fc8');r(7,2,11,4,'#ffb4df');r(5,4,4,4,'#ffb4df');r(15,4,4,4,'#ffb4df');r(10,7,5,5,'#fff0ff');return;}
  if(type==='sword_of_a_thousand_truths'){r(10,1,5,15,'#fff0ff');r(7,5,11,4,'#ff8fc8');r(10,15,5,7,'#8e5ad4');r(7,20,11,3,'#ffb4df');return;}
  if(type==='krampus_whip'){line(8,20,11,15,'#8b583c',2);line(10,17,13,4,'#d35b54',3);line(11,17,14,8,'#f28b78',1);line(13,7,19,10,'#d35b54',2);line(18,10,21,6,'#f28b78',1);r(6,19,6,2,'#e0b457');return;}
  if(type==='staff'){r(11,1,3,19,'#9d7cc8');r(8,2,9,4,'#d8adff');r(7,4,11,7,'#6a467a');r(10,8,5,5,'#f0c9ff');return;}
  if(type==='mana_rune'){r(10,3,5,18,'#78d6e8');r(6,8,13,5,'#b7f7ff');r(8,5,9,12,'#347d9c');r(10,8,4,6,'#e2ffff');return;}
  if(type==='void_sigil'){r(5,6,14,13,'#422466');r(8,3,8,18,'#9f82e8');r(3,10,18,4,'#cbb0ff');r(10,9,4,5,'#1e1237');return;}
  if(type==='astral_heart'){r(6,5,5,5,'#e48cff');r(13,5,5,5,'#e48cff');r(5,9,14,9,'#ffb5ff');r(9,17,6,4,'#c74ee9');r(10,8,4,5,'#fff0ff');return;}
  if (type === "barricade") {
    for (let n = 0; n < 3; n++) {
      r(4 + n * 6, 3, 3, 19, "#9d7549");
      r(4 + n * 6, 3, 1, 19, "#cbae72");
    }
    r(2, 8, 20, 3, "#785236");
    r(2, 16, 20, 3, "#785236");
    return;
  }
  function line(x, y, xx, yy, color, width = 1) {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(xx - x), Math.abs(yy - y))),
    );
    for (let n = 0; n <= steps; n++)
      r(
        Math.round(x + ((xx - x) * n) / steps),
        Math.round(y + ((yy - y) * n) / steps),
        width,
        width,
        color,
      );
  };
  const gold = "#d5ad61",
    dark = "#202d31",
    silver = "#cadcd8",
    green = "#82aa63";
  const def = ITEMS[type],
    originalType = type;
  type = originalType==='stick'?'stick':itemKind(type);
  if(def?.warlockGear){
    const cloth=def.artColor,bone='#d0c2a2',ink='#292332',mint='#81ceb1';
    if(type==='hat'){r(9,2,6,3,ink);r(6,5,12,4,cloth);r(4,9,16,12,ink);r(5,9,3,11,cloth);r(16,9,3,11,cloth);r(8,8,8,2,bone);r(8,11,8,6,'#443344');r(9,12,2,1,mint);r(13,12,2,1,mint);}
    else if(type==='armor'){r(7,3,10,5,cloth);r(3,7,18,7,cloth);r(6,13,12,9,cloth);r(11,8,2,13,ink);r(5,7,3,3,bone);r(16,7,3,3,bone);r(6,20,5,2,bone);r(13,20,5,2,bone);r(10,10,4,2,mint);}
    else if(type==='charm'){line(6,3,8,10,bone,1);line(18,3,16,10,bone,1);r(8,10,8,11,ink);r(9,11,6,8,cloth);r(11,10,2,11,mint);r(8,14,8,2,mint);}
    else if(type==='staff'){r(11,8,2,15,cloth);r(8,2,8,7,ink);r(9,3,6,5,bone);r(9,4,2,2,'#25392f');r(13,4,2,2,'#25392f');r(10,4,1,1,mint);r(13,4,1,1,mint);r(10,8,4,3,bone);r(10,9,1,2,ink);r(13,9,1,2,ink);r(10,15,4,2,bone);}
    else if(type==='cape'){r(8,2,8,3,bone);r(6,5,12,13,cloth);r(4,11,16,7,cloth);r(4,18,4,4,cloth);r(10,18,4,3,cloth);r(16,18,4,4,cloth);r(11,6,2,11,ink);}
    else {paintItemBase(c,def.base);r(9,10,6,4,cloth);r(10,10,4,1,bone);}
    return;
  }
  if (def?.style === "safari") {
    const khaki = def.artColor, trim = "#74553c", pale = "#eee0b0";
    if (type === "hat") {
      r(7,4,11,12,khaki); r(5,9,15,7,khaki); r(2,15,21,3,pale);
      r(6,12,14,3,trim); r(11,3,3,10,pale);
    } else if (type === "armor") {
      r(5,4,15,17,khaki); r(10,3,5,5,trim); r(12,8,1,13,trim);
      r(6,10,5,6,trim); r(14,10,5,6,trim); r(6,10,5,2,pale); r(14,10,5,2,pale);
    } else if (type === "pants") {
      r(5,3,14,6,khaki); r(5,9,5,13,khaki); r(14,9,5,13,khaki);
      r(5,4,14,2,trim); r(4,11,6,5,trim); r(14,11,6,5,trim); r(11,4,3,2,pale);
    } else for (const x of [2,13]) {
      if (type === "shoulder_armor") { r(x,7,9,9,khaki); r(x,7,9,2,pale); r(x+3,10,3,3,trim); }
      if (type === "gloves") { r(x+1,8,6,12,khaki); r(x+6,12,3,5,khaki); r(x,18,8,3,pale); }
      if (type === "boots") { r(x+1,4,6,16,khaki); r(x,18,10,4,trim); r(x+2,6,4,2,pale); r(x+2,11,4,2,pale); }
    }
    return;
  }
  switch (type) {
    case 'critter_net':
      line(5,23,12,11,'#a27d4f',2);line(8,3,18,3,'#c3ccb5',2);line(7,4,7,11,'#c3ccb5',2);line(19,4,19,11,'#c3ccb5',2);line(8,12,18,12,'#c3ccb5',2);for(let i=9;i<19;i+=3)line(i,4,i,11,'#8daba3');line(8,7,18,7,'#8daba3');break;
    case 'caught_fish':
      r(7,3,10,3,'#a78a56');r(5,7,14,15,'#4b827d');r(7,7,10,14,'#9bcbc180');r(7,8,2,11,'#d0efdf');r(5,21,14,2,'#b1d8c8');r(8,12,3,6,'#4f9cc0');r(11,12,7,5,'#84d6dc');r(15,13,2,2,'#173f54');r(12,11,3,1,'#e6cf83');break;
    case 'caught_crab':
      r(3,7,19,15,'#493e2e');r(9,13,8,5,'#dc8862');r(7,11,3,3,'#efb77e');r(17,11,3,3,'#efb77e');r(8,18,3,1,'#df9e70');r(16,18,3,1,'#df9e70');for(let i=4;i<23;i+=4)r(i,7,1,15,'#bea775');r(3,6,19,2,'#bea775');r(3,21,19,2,'#bea775');r(10,3,5,3,'#bea775');break;
    case 'empty_jar': case 'caught_frog': case 'caught_dragonfly': case 'caught_fairy':
      r(7,3,10,3,'#a78a56');r(5,7,14,15,'#4b827d');r(7,7,10,14,'#9bcbc180');r(7,8,2,11,'#d0efdf');r(5,21,14,2,'#b1d8c8');if(type!=='empty_jar'){r(10,13,type==='caught_frog'?5:3,5,type==='caught_fairy'?'#c7a1dd':type==='caught_dragonfly'?'#85c6cd':'#759c51');r(10,12,1,1,'#f3eebb');r(14,12,1,1,'#f3eebb');}break;
    case 'critter_cage': case 'caught_bird': case 'caught_white_mouse': case 'caught_scavenger':
      r(3,7,19,15,'#493e2e');if(type!=='critter_cage')r(8,12,type==='caught_bird'?6:8,7,type==='caught_white_mouse'?'#e5e7dc':type==='caught_bird'?'#bca477':'#9b886f');for(let i=4;i<23;i+=4)r(i,7,1,15,'#bea775');r(3,6,19,2,'#bea775');r(3,21,19,2,'#bea775');r(10,3,5,3,'#bea775');break;
    case "lantern":
      r(8,2,9,2,dark); r(7,4,2,5,gold); r(16,4,2,5,gold);
      r(5,8,15,3,dark); r(6,11,13,9,gold); r(8,11,9,8,"#fff0ab");
      r(11,13,3,5,"#ffa13f"); r(5,20,15,3,dark); r(11,9,2,11,gold);
      break;
    case "torch":
      r(10,11,4,12,"#805635"); r(9,9,6,5,"#aa986c");
      r(7,4,10,7,"#ec6936"); r(10,1,4,10,"#ffac42"); r(11,5,3,6,"#fff0a4");
      break;
    case "rifle":
      line(4,20,18,6,"#765036",4); line(12,11,21,2,"#39434b",2);
      line(13,11,22,2,"#c8d2ca"); r(3,17,4,6,"#a87b49");
      r(11,14,3,4,dark); r(13,6,4,2,dark);
      break;
    case "cartridge":
      r(9,6,6,15,gold); r(10,3,4,4,"#b97f49"); r(11,2,2,2,"#dbb176");
      r(10,8,2,12,"#fff0ab"); r(8,20,8,2,"#8c663a");
      break;
    case "stick":
      line(5, 13, 12, 3, "#9e7646", 2);
      line(9, 8, 14, 6, "#bf9c60", 1);
      break;
    case "log":
      r(3, 5, 10, 7, "#755237");
      r(3, 5, 10, 2, "#af8953");
      r(10, 5, 4, 7, "#d5b774");
      r(11, 7, 2, 3, "#8e663c");
      break;
    case "stone":
      r(3, 6, 11, 7, "#68766d");
      r(5, 3, 7, 9, "#929e8e");
      r(5, 3, 6, 2, "#c6c9ab");
      r(9, 7, 3, 5, "#79867b");
      break;
    case "bone_shard":
      line(5, 20, 18, 5, "#9a8f76", 3);
      line(7, 19, 19, 4, "#eee5c4", 2);
      r(17, 3, 4, 4, "#c9bea0");
      r(4, 18, 4, 4, "#c9bea0");
      break;
    case "golem_core":
      r(5, 5, 14, 15, "#304d4a");
      r(7, 3, 10, 18, "#709f91");
      r(9, 6, 6, 12, "#a5e0bf");
      r(10, 9, 4, 5, "#e0ffd0");
      break;
    case "web_silk":
      line(3, 5, 20, 20, "#d9c9e7", 1);
      line(20, 5, 3, 20, "#d9c9e7", 1);
      line(11, 3, 11, 22, "#f4eafa", 1);
      line(4, 12, 19, 12, "#b9a5cf", 1);
      break;
    case "beast_fang":
      line(7, 4, 15, 20, "#8f7957", 3);
      line(8, 4, 16, 18, "#fff0c8", 2);
      r(6, 3, 5, 4, "#d9c99e");
      break;
    case "frost_berry":
      r(10, 3, 3, 6, "#71905e");
      r(6, 8, 12, 12, "#522f58");
      r(8, 6, 9, 13, "#d879a4");
      r(10, 8, 3, 3, "#ffd5e8");
      r(14, 12, 3, 3, "#eea8d0");
      break;
    case "wand":
      line(7, 20, 15, 7, "#745a87", 2);
      r(12, 3, 7, 7, def.artColor);
      r(14, 4, 3, 3, "#f4e7ff");
      r(11, 10, 5, 2, gold);
      if (def.style === "flame") {
        r(11, 1, 8, 4, "#ff6034");
        r(13, 0, 4, 4, "#ffd45b");
        r(15, 3, 5, 4, "#f18b45");
      }
      break;
    case "cape":
      r(8, 3, 8, 3, gold);
      r(7, 6, 10, 5, def.artColor);
      r(5, 11, 14, 10, def.artColor);
      r(7, 9, 2, 11, "#583456");
      r(16, 12, 2, 8, "#d09bc4");
      break;
    case "sword":
    case "dagger": {
      const end = type === "sword" ? 3 : 8;
      line(7, 17, 20, end, dark, 3);
      line(8, 17, 21, end, silver, 2);
      line(9, 16, 21, end, "#f2f1d4");
      line(5, 15, 10, 20, gold, 2);
      line(4, 21, 8, 17, "#8b583c", 2);
      r(6,19,1,1,"#dfbb82");r(8,17,1,1,"#f5e2ae");
      r(3, 21, 3, 2, gold);
      break;
    }
    case "bow":
      line(7, 2, 14, 5, dark, 3);
      line(14, 5, 18, 11, dark, 3);
      line(18, 11, 14, 18, dark, 3);
      line(14, 18, 7, 21, dark, 3);
      line(8, 3, 15, 6, gold, 2);
      line(15, 6, 18, 12, gold, 2);
      line(18, 12, 14, 18, gold, 2);
      line(14, 18, 8, 22, gold, 2);
      line(8, 3, 8, 22, "#ece2b2");
      r(17, 10, 3, 5, "#765336");
      r(17,11,2,1,"#d5ad61");r(17,13,2,1,"#d5ad61");
      break;
    case "arrow":
      line(3, 20, 19, 4, "#6d4e36", 2);
      line(4, 20, 20, 4, gold);
      r(17, 2, 5, 3, silver);
      r(20, 3, 2, 5, silver);
      line(2, 15, 7, 20, "#ecdfbc", 2);
      line(2, 19, 4, 21, "#9cbd92", 2);
      break;
    case "stamina_potion":
    case "potion":
      r(9, 2, 7, 3, dark);
      r(10, 2, 5, 2, gold);
      r(9, 5, 7, 4, "#a5c9c7");
      r(6, 9, 13, 11, dark);
      r(8, 7, 9, 15, "#92c1bd");
      r(7, 10, 11, 10, type === "stamina_potion" ? "#2c7948" : "#a62d5c");
      r(9, 11, 7, 10, type === "stamina_potion" ? "#7fdb87" : "#e34e78");
      r(8, 10, 2, 5, "#fae6dc");
      r(10, 18, 6, 2, type === "stamina_potion" ? "#c5ff98" : "#f68e96");
      break;
    case "shield":
      r(4, 3, 16, 12, dark);
      r(6, 3, 12, 17, dark);
      r(9, 19, 6, 3, dark);
      r(6, 5, 12, 10, gold);
      r(8, 14, 8, 5, gold);
      r(10, 19, 4, 2, gold);
      r(8, 6, 8, 9, "#507c63");
      r(9, 14, 6, 4, "#507c63");
      r(11, 5, 2, 14, "#88ad79");
      r(10, 10, 4, 4, silver);
      break;
    case "gloves":
      for (const x of [2, 13]) {
        r(x, 10, 8, 11, dark);
        r(x + 1, 7, 2, 12, green);
        r(x + 4, 5, 2, 14, green);
        r(x + 2, 12, 6, 7, green);
        r(x + 7, 11, 2, 5, "#557e4d");
        r(x + 1, 19, 7, 3, "#b1b876");
        r(x + 2, 8, 1, 3, "#ecdfb7");
        r(x + 5, 6, 1, 3, "#ecdfb7");
      }
      break;
    case "boots":
      for (const x of [2, 13]) {
        r(x, 5, 7, 15, dark);
        r(x + 1, 6, 5, 12, "#567b46");
        r(x + 2, 16, 8, 5, green);
        r(x, 20, 10, 2, "#b6925d");
        r(x + 1, 8, 5, 2, "#a9bf76");
        r(x + 4, 14, 2, 5, "#bbce8b");
      }
      break;
    case "pants":
      r(5, 3, 15, 7, dark);
      r(6, 5, 12, 5, "#8dafaa");
      r(6, 9, 5, 12, "#7b9799");
      r(14, 9, 5, 12, "#647c83");
      r(6, 4, 13, 2, "#bfac77");
      r(10, 4, 3, 2, gold);
      r(7, 11, 1, 8, "#a6b8ad");
      r(15, 11, 1, 8, "#95a59f");
      break;
    case "armor":
      r(5, 3, 5, 7, dark);
      r(15, 3, 5, 7, dark);
      r(6, 7, 13, 15, dark);
      r(6, 4, 3, 7, "#bb9766");
      r(16, 4, 3, 7, "#bb9766");
      r(8, 8, 9, 12, "#997044");
      r(8, 11, 9, 2, "#c39b62");
      r(8, 17, 9, 2, "#c39b62");
      r(11, 8, 2, 12, "#674b33");
      break;
    case "hat":
      r(2, 15, 21, 4, dark);
      r(7, 6, 11, 10, dark);
      r(8, 5, 9, 10, gold);
      r(6, 10, 13, 6, gold);
      r(3, 15, 19, 3, "#ecd18f");
      r(7, 12, 11, 3, "#6c603f");
      r(9, 6, 4, 2, "#f0dca0");
      break;
    case "santa_hat":
      r(2, 15, 21, 4, dark);
      r(6, 9, 14, 8, dark);
      r(8, 6, 10, 10, "#d94d55");
      r(5, 11, 15, 6, "#e45b5b");
      r(4, 15, 18, 3, "#f5f0df");
      r(16, 5, 5, 5, "#f5f0df");
      r(19, 3, 4, 4, "#ffffff");
      break;
    case "shoulder_armor":
      for (const x of [2, 14]) {
        r(x, 8, 9, 11, dark);
        r(x + 1, 6, 7, 9, gold);
        r(x + 2, 5, 5, 5, "#ddc38a");
        r(x + 2, 15, 6, 2, "#b58c56");
        r(x + 4, 8, 2, 5, "#f0dda7");
      }
      break;
    case "charm":
      line(6, 3, 4, 9, gold);
      line(4, 9, 12, 14, gold);
      line(12, 14, 20, 9, gold);
      line(20, 9, 18, 3, gold);
      r(9, 12, 7, 10, "#755134");
      r(10, 13, 5, 8, "#ffb744");
      r(11, 14, 3, 5, "#ffdc7c");
      r(11, 14, 2, 2, "#fff1b5");
      break;
    case "relic":
      r(5, 5, 14, 15, dark);
      r(7, 3, 10, 17, def.artColor || gold);
      r(9, 5, 6, 13, "#343544");
      r(10, 7, 4, 9, def.artColor || gold);
      r(7, 2, 10, 2, gold);
      r(7, 19, 10, 2, gold);
      break;
    case "trap":
      line(3, 15, 8, 20, dark, 3);
      line(8, 20, 17, 20, dark, 3);
      line(17, 20, 21, 15, dark, 3);
      line(3, 14, 8, 19, silver, 2);
      line(8, 19, 17, 19, silver, 2);
      line(17, 19, 21, 14, silver, 2);
      line(4, 13, 8, 6, "#899a8c", 2);
      line(8, 6, 17, 6, "#899a8c", 2);
      line(17, 6, 21, 13, "#899a8c", 2);
      for (let x = 6; x < 21; x += 4) {
        r(x, 8, 2, 3, "#dde0b4");
        r(x, 15, 2, 3, "#dde0b4");
      }
      r(10, 11, 6, 3, gold);
      break;
    case "fruit":
      r(5, 9, 14, 10, dark);
      r(7, 7, 10, 15, "#c78846");
      r(5, 10, 14, 8, "#e1aa54");
      r(7, 9, 4, 3, "#f8d983");
      r(11, 4, 2, 5, "#735131");
      r(13, 3, 6, 3, green);
      r(14, 3, 3, 1, "#bbd088");
      break;
    case "coconut":
      r(5, 7, 14, 13, dark);
      r(6, 6, 13, 14, "#765236");
      r(8, 5, 10, 3, "#ad8251");
      r(8, 9, 9, 8, "#9a6b3c");
      r(10, 10, 2, 2, "#d7b777");
      r(14, 10, 2, 2, "#d7b777");
      r(12, 3, 3, 4, "#567848");
      break;
    case "meat":
      line(4, 20, 10, 14, "#e4d6b4", 3);
      r(2, 19, 3, 4, "#fff0cf");
      r(4, 21, 3, 2, "#fff0cf");
      r(9, 5, 11, 12, "#703c42");
      r(7, 9, 14, 6, "#9d4a52");
      r(11, 5, 8, 12, "#c76f76");
      r(12, 7, 5, 3, "#edaf98");
      r(9, 12, 3, 4, "#e39984");
      break;
    default:
      r(8, 8, 8, 8, gold);
  }
  if (def?.variant || def?.relic) {
    // Distinct palette, trim, silhouette and emblem for every catalog item.
    const tint = def.artColor;
    if (type === "hat") {
      r(7, 7, 10, 5, tint);
      if (def.style === "horned") {
        line(5, 10, 3, 3, "#e4d8ac", 2);
        line(18, 10, 21, 3, "#e4d8ac", 2);
      }
      if (def.style === "hood") {
        r(5, 6, 3, 12, tint);
        r(17, 6, 3, 12, tint);
      }
      if (def.style === "circlet") {
        r(4, 10, 17, 2, tint);
        r(11, 7, 3, 4, "#e8d5ff");
      }
      if (["helmet", "fullhelm"].includes(def.style)) {
        r(5, 8, 3, 9, tint);
        r(16, 8, 3, 9, tint);
        r(7, 13, 10, 4, def.style === "fullhelm" ? "#48545a" : tint);
        r(8, 18, 8, 2, dark);
        if (def.style === "fullhelm") r(9, 14, 6, 1, "#d8e3dc");
      }
      if (def.style === "mask") {
        r(6, 11, 13, 7, tint);
        r(8, 13, 3, 2, "#f1d98d");
        r(14, 13, 3, 2, "#f1d98d");
        r(10, 18, 5, 2, "#31563a");
      }
      if (def.style === "crown") {
        r(5, 9, 14, 3, tint);
        r(6, 5, 3, 5, tint);
        r(11, 3, 3, 7, tint);
        r(16, 5, 3, 5, tint);
        r(11, 8, 3, 3, "#fff0b4");
      }
    } else if (type === "shoulder_armor") {
      r(3, 8, 7, 4, tint);
      r(2, 10, 9, 8, tint);
      r(3, 17, 8, 3, dark);
      r(5, 7, 4, 3, "#e7d4a0");
      r(14, 8, 7, 4, tint);
      r(13, 10, 9, 8, tint);
      r(14, 17, 8, 3, dark);
      r(16, 7, 4, 3, "#e7d4a0");
      if (def.style === "leaf") {
        line(4, 15, 9, 10, "#c9df9e", 2);
        line(15, 15, 20, 10, "#c9df9e", 2);
      } else if (def.style === "moon") {
        r(5, 12, 3, 3, "#e7d8ff");
        r(16, 12, 3, 3, "#e7d8ff");
      } else if (def.style === "sun") {
        r(5, 11, 3, 5, "#fff0b4");
        r(16, 11, 3, 5, "#fff0b4");
      }
    } else if (type === "armor") {
      r(8, 6, 9, 13, tint);
      if (def.style === "robe" || def.style === "coat") r(6, 17, 14, 5, tint);
      if (def.style === "plate") {
        r(4, 5, 5, 5, tint);
        r(16, 5, 5, 5, tint);
      }
    } else if (type === "pants") {
      r(6, 7, 5, 12, tint);
      r(14, 7, 5, 12, tint);
    } else if (type === "gloves") {
      r(5, 10, 5, 7, tint);
      r(15, 8, 5, 7, tint);
      if (def.style === "spiked") {
        r(4, 7, 2, 4, "#d2e1a5");
        r(17, 5, 2, 4, "#d2e1a5");
      }
    } else if (type === "boots") {
      r(5, 6, 5, 12, tint);
      r(14, 6, 5, 12, tint);
      if (def.style === "tall") {
        r(4, 3, 6, 4, tint);
        r(13, 3, 6, 4, tint);
      }
    } else if (type === "sword" || type === "dagger") {
      line(
        10,
        15,
        20,
        type === "sword" ? 3 : 8,
        tint,
        def.style === "broad" ? 4 : 2,
      );
      if (def.style === "crescent" || def.style === "hook")
        line(18, 7, 22, 6, tint, 2);
    } else if (type === "shield") {
      r(8, 7, 9, 11, tint);
      if (def.style === "tower") {
        r(5, 4, 3, 15, tint);
        r(17, 4, 3, 15, tint);
      }
    } else if (type === "bow") {
      line(14, 3, 20, 12, tint, 2);
      line(20, 12, 14, 21, tint, 2);
      if (def.style === "winged") {
        line(14, 3, 21, 4, tint, 2);
        line(14, 21, 21, 20, tint, 2);
      }
    } else if (type === "relic") {
      const accent = "#fff0b4";
      if (def.relicStyle === "scarab") {
        r(9, 8, 6, 8, accent);
        r(6, 10, 3, 5, tint);
        r(15, 10, 3, 5, tint);
        line(10, 7, 8, 4, accent);
        line(14, 7, 16, 4, accent);
      } else if (def.relicStyle === "eye") {
        r(7, 10, 10, 5, accent);
        r(10, 8, 4, 9, tint);
        r(11, 10, 2, 4, dark);
      } else if (def.relicStyle === "stone") {
        r(8, 8, 8, 8, accent);
        r(10, 9, 5, 6, tint);
      } else if (def.relicStyle === "reliquary") {
        r(9, 6, 6, 11, tint);
        r(10, 8, 4, 7, accent);
        r(8, 5, 8, 2, accent);
      } else if (def.relicStyle === "totem") {
        r(9, 5, 6, 12, tint);
        r(7, 8, 10, 3, accent);
        r(10, 12, 4, 4, accent);
      } else if (def.relicStyle === "sun") {
        for (const [x, y] of [
          [11, 5],
          [11, 17],
          [5, 11],
          [17, 11],
        ])
          r(x, y, 2, 2, accent);
        r(9, 9, 6, 6, accent);
        r(11, 11, 2, 2, tint);
      } else if (def.relicStyle === "moon") {
        r(9, 7, 7, 10, accent);
        r(11, 6, 7, 10, tint);
      } else if (def.relicStyle === "amber") {
        r(9, 8, 7, 8, accent);
        r(10, 9, 5, 6, tint);
        r(11, 10, 2, 2, "#fff5c8");
      }
    }
    // Unique heraldic inlay, retained at native pixel size.
    for (let bit = 0; bit < 6; bit++)
      if (def.variant & (1 << bit))
        r(9 + (bit % 3) * 2, 11 + Math.floor(bit / 3) * 2, 1, 1, "#fff0c1");
  }
  if (originalType === "cinder_wand") {
    r(9, 3, 3, 2, "#ffd894");
    r(11, 1, 1, 2, "#ff7840");
  }
}
export function itemCanvas(type, dye = null) {
  const key = type + (dye || "");
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 24;
  paintItem(canvas.getContext("2d"), type);
  if (dye && /^#[0-9a-f]{6}$/i.test(dye)) {
    const c = canvas.getContext("2d");
    c.save();
    c.globalCompositeOperation = "source-atop";
    c.globalAlpha = 0.35;
    c.fillStyle = dye;
    c.fillRect(0, 0, 24, 24);
    c.restore();
  }
  if (cache.size >= 512) cache.delete(cache.keys().next().value);
  cache.set(key, canvas);
  return canvas;
}
export function drawItem(c, type, x, y, size = 24, dye = null) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(
    detailedItemCanvas(type, dye),
    Math.round(x - size / 2),
    Math.round(y - size / 2),
    size,
    size,
  );
  c.restore();
}
// Retain authored silhouettes but add subpixel bevels at twice their native
// resolution. Cached once per item/dye, never rebuilt for each inventory frame.
export function detailedItemCanvas(type,dye=null){
 const key='detail:'+type+':'+(dye||'');if(cache.has(key))return cache.get(key);
 const base=itemCanvas(type,dye),out=document.createElement('canvas');out.width=out.height=48;
 const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0,48,48);
 if(ctx.getImageData&&ctx.putImageData){
  const image=ctx.getImageData(0,0,48,48),source=new Uint8ClampedArray(image.data),at=(x,y)=>x>=0&&y>=0&&x<48&&y<48?source[(y*48+x)*4+3]:0;
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){
   const i=(y*48+x)*4;if(!source[i+3])continue;
   const light=!at(x,y-1)||!at(x-1,y),shadow=!at(x,y+1)||!at(x+1,y);
   if(light||shadow)for(let n=0;n<3;n++)image.data[i+n]=Math.max(0,Math.min(255,source[i+n]+(light?18:-24)));
  }ctx.putImageData(image,0,0);
 }cache.set(key,out);return out;
}
export function drawItemPart(
  c,
  type,
  part,
  x,
  y,
  width = 8,
  height = 10,
  dye = null,
) {
  const crop = {
    gloves: { L: [1, 4, 11, 18], R: [12, 4, 11, 18] },
    boots: { L: [1, 3, 11, 20], R: [12, 3, 11, 20] },
    shoulder_armor: { L: [1, 5, 11, 16], R: [12, 5, 11, 16] },
  }[itemKind(type)]?.[part];
  if (!crop) return;
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(
    itemCanvas(type, dye),
    ...crop,
    Math.round(x - width / 2),
    Math.round(y - height / 2),
    width,
    height,
  );
  c.restore();
}
export function lootSpot(game, x, y) {
  const clear = (xx, yy, space = true) =>
    xx >= 24 &&
    yy >= 24 &&
    xx <= 1576 &&
    yy <= 1576 &&
    !game.blocked(xx, yy, 12) &&
    (!space || game.loot.every((l) => Math.hypot(l.x - xx, l.y - yy) >= 20));
  if (clear(x, y)) return { x, y };
  for (let radius = 16; radius <= 224; radius += 16)
    for (let n = 0; n < 24; n++) {
      const a = (n / 24) * Math.PI * 2,
        xx = Math.round(x + Math.cos(a) * radius),
        yy = Math.round(y + Math.sin(a) * radius);
      if (clear(xx, yy)) return { x: xx, y: yy };
    }
  return {
    x: Math.max(24, Math.min(1576, x)),
    y: Math.max(24, Math.min(1576, y)),
  };
}
