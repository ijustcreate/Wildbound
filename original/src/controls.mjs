export const PAD_NAMES = [
  "A",
  "B",
  "X",
  "Y",
  "LB",
  "RB",
  "LT",
  "RT",
  "Back",
  "Start",
  "L3",
  "R3",
  "D-up",
  "D-down",
  "D-left",
  "D-right",
];
export const DEFAULT_MAPPING = {attack:0,jump:1,dodge:7,loot:2,trap:10,interact:3,pause:9,board:4,potion:5,block:6,inventory:8,portal:12,bait:13,field:11};
export function controllerFamily(pad) {
  const id = String(pad?.id || '').toLowerCase();
  if (/switch|nintendo|joy[- ]?con|pro controller/.test(id)) return 'switch';
  if (/xbox|xinput|360/.test(id)) return 'xbox';
  if (/dualsense|dualshock|playstation|ps[345]|sony/.test(id)) return 'playstation';
  return 'generic';
}
export const CONTROLLER_NAMES = { switch:'Nintendo Switch', xbox:'Xbox / Xbox 360', playstation:'PlayStation', generic:'Game controller' };
const FACE_NAMES = {
  xbox: ['A','B','X','Y'],
  switch: ['B','A','Y','X'],
  playstation: ['Cross','Circle','Square','Triangle'],
  generic: ['South','East','West','North'],
};
export function controllerButtonNames(padOrFamily) {
  const family = typeof padOrFamily === 'string' ? padOrFamily : controllerFamily(padOrFamily);
  const faces = FACE_NAMES[family] || FACE_NAMES.generic;
  return { ...Object.fromEntries(faces.map((name, i) => [i, name])), 4:'LB', 5:'RB', 6:'LT', 7:'RT', 8:'View', 9:'Menu', 10:'L3', 11:'R3', 12:'D-up', 13:'D-down', 14:'D-left', 15:'D-right' };
}
export function labelsForController(mapping, padOrFamily) {
  const family = typeof padOrFamily === 'string' ? padOrFamily : controllerFamily(padOrFamily);
  const names = controllerButtonNames(family);
  return Object.fromEntries(Object.entries(mapping).map(([action, index]) => [action, names[index] || `Button ${index}`]));
}
export function normalizeMapping(saved = {}) {
  const result = {}, used = new Set();
  for (const [action, fallback] of Object.entries(DEFAULT_MAPPING)) {
    const value = saved[action];
    const candidate = Number.isInteger(value) && value >= 0 && value <= 31 && !used.has(value) ? value :
      !used.has(fallback) ? fallback : Array.from({length:32},(_,i)=>i).find(i=>!used.has(i));
    result[action] = candidate; used.add(candidate);
  }
  return result;
}
export function renderPlayerMappings(root, game, mapping, pads = Array.from(navigator.getGamepads?.() || []).filter(Boolean)) {
  root.replaceChildren();
  const rows = game.players.map(p=>({name:p.name, device:p.device, pad:pads.find(pad=>p.device==='pad:'+pad.index)}));
  for(const pad of pads) if(!rows.some(r=>r.pad===pad)) rows.push({name:'Unassigned controller',device:'pad:'+pad.index,pad});
  if(!rows.length) rows.push({name:'Keyboard / mouse',device:'keyboard'});
  for(const row of rows) {
    const card=document.createElement('section');card.className='controller-card';
    const title=document.createElement('h4');title.textContent=row.name;card.append(title);
    const desc=document.createElement('p');desc.textContent=row.device==='keyboard'?'Keyboard / mouse':row.pad?
      `Controller ${row.pad.index+1} · ${CONTROLLER_NAMES[controllerFamily(row.pad)]} · ${row.pad.id} · ${row.pad.mapping==='standard'?'standard layout':'device-specific button layout'}`:
      row.device.startsWith('pad:')?'Controller disconnected':row.device;card.append(desc);
    const list=document.createElement('dl');
    const bindings=row.device==='keyboard'?{Move:'WASD / arrows',Aim:'Mouse',...KEYS}:{Move:'Left stick',Aim:'Right stick',...Object.fromEntries(Object.entries(mapping).map(([k,v])=>[k,`${labelsForController(mapping, row.pad || 'generic')[k]} · ${v}`]))};
    for(const [action,key] of Object.entries(bindings)){const term=document.createElement('dt'),value=document.createElement('dd');term.textContent=action;value.textContent=key;list.append(term,value);}
    card.append(list);root.append(card);
  }
}
export const KEYS = {
  attack: "F / click",
  jump: "J",
  dodge: "Space / RMB",
  loot: "E · tap near loot",
  interact: "E",
  trap: "Q",
  potion: "H",
  inventory: "I",
  portal: "P",
  block: "C",
  board: "B",
  pause: "Esc",
  bait: "V",
  field: "G",
};
export function controlLabels(mapping) {
  return Object.fromEntries(
    Object.entries(mapping).map(([action, index]) => [
      action,
      `${KEYS[action] || action} / ${PAD_NAMES[index] || "button " + index}`,
    ]),
  );
}
export function controlHelp(mapping) {
  return [
    "attack",
    "dodge",
    "jump",
    "interact",
    "trap",
    "potion",
    "inventory",
    "portal",
  ]
    .map((action) => `${action}: ${controlLabels(mapping)[action]}`)
    .join(" · ");
}
