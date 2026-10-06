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
  const override=globalThis.localStorage?.getItem('wildbound-controller-family:'+id);
  if(['switch','xbox','playstation','generic'].includes(override))return override;
  if (/switch|nintendo|joy[- ]?con|pro controller|057e/.test(id)) return 'switch';
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
  const extra=family==='switch'?{4:'L',5:'R',6:'ZL',7:'ZR',8:'−',9:'+'}:family==='playstation'?{4:'L1',5:'R1',6:'L2',7:'R2',8:'Share',9:'Options'}:{};
  return { ...Object.fromEntries(faces.map((name, i) => [i, name])), 4:'LB', 5:'RB', 6:'LT', 7:'RT', 8:'View', 9:'Menu', 10:'L3', 11:'R3', 12:'D-up', 13:'D-down', 14:'D-left', 15:'D-right', ...extra };
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
  // One shared settings surface can display a different physical layout per player.
  const glyphModule=import('./controller-glyphs.mjs');
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
    const bindings=row.device==='keyboard'?{Move:'WASD / arrows',Aim:'Mouse',...KEYS}:{Move:'Left stick',Aim:'Right stick','summon':'RB · set skill: Tame / Raise Skeleton',...Object.fromEntries(Object.entries(mapping).map(([k,v])=>[k,`${labelsForController(mapping, row.pad || 'generic')[k]} · ${v}`]))};
    for(const [action,key] of Object.entries(bindings)){const term=document.createElement('dt'),value=document.createElement('dd');term.textContent=action;value.textContent=key;list.append(term,value);}
    card.append(list);root.append(card);
    const family=row.device==='keyboard'?'keyboard':row.pad?controllerFamily(row.pad):'xbox';
    const directions=document.createElement('div');directions.className='controller-directions';
    const appendGroup=(label,group,items)=>{
      const section=document.createElement('section'),heading=document.createElement('strong'),icons=document.createElement('div');
      section.className='controller-directions-group';heading.textContent=label;icons.className='controller-direction-icons';
      for(const [direction,title] of items){
        const cell=document.createElement('span'),name=document.createElement('small');cell.className='controller-direction-cell';
        name.textContent=title;cell.append(name);icons.append(cell);
        glyphModule.then(({controllerGlyph})=>cell.prepend(controllerGlyph(document.createElement('canvas'),family,group,direction)));
      }
      section.append(heading,icons);directions.append(section);
    };
    if(family==='keyboard'){
      appendGroup('MOVE · WASD','wasd',[['up','W'],['left','A'],['down','S'],['right','D']]);
      appendGroup('MOVE · ARROWS','arrows',[['up','↑'],['left','←'],['down','↓'],['right','→']]);
      appendGroup('MOUSE','mouse',[['left','Attack'],['right','Dodge']]);
    }else{
      appendGroup('D-PAD','dpad',[['up','Up'],['left','Left'],['down','Down'],['right','Right']]);
      appendGroup('FACE BUTTON POSITIONS','face',[['up','Top'],['left','Left'],['right','Right'],['down','Bottom']]);
    }
    card.append(directions);
    if(row.pad){
      const label=document.createElement('label');label.textContent='Controller button labels ';
      const select=document.createElement('select');
      for(const [value,text] of Object.entries({auto:'Automatic detection',...CONTROLLER_NAMES}))select.add(new Option(text,value));
      const key='wildbound-controller-family:'+String(row.pad.id).toLowerCase();
      select.value=globalThis.localStorage?.getItem(key)||'auto';
      select.onchange=()=>{if(select.value==='auto')localStorage.removeItem(key);else localStorage.setItem(key,select.value);renderPlayerMappings(root,game,mapping,pads);};
      label.append(select);card.append(label);
    }
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
  summon: "R · set skill: Tame / Raise Skeleton",
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
