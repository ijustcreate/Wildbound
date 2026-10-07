export const HOUSE_KEY='wildbound-house-designs-v1';
export const HOUSE_STATE_KEY='wildbound-house-state-v1';
let pendingSave=Promise.resolve(),saveTimer;
export async function loadHouseStorage(){
 if(!globalThis.desktop?.loadHouseDesigns)return;
 const disk=await globalThis.desktop.loadHouseDesigns();
 let local;try{local=JSON.parse(globalThis.localStorage.getItem(HOUSE_STATE_KEY)||'null');}catch{}
 if(disk?.version===1&&(!local||disk.updatedAt>local.updatedAt)){
  globalThis.localStorage.setItem(HOUSE_STATE_KEY,JSON.stringify(disk));
  if(disk.library)globalThis.localStorage.setItem(HOUSE_KEY,JSON.stringify(disk.library));
 }
}
export function houseDraft(){try{return JSON.parse(globalThis.localStorage?.getItem(HOUSE_STATE_KEY)||'null')?.draft||null;}catch{return null;}}
export function preserveHouseDraft(h,id){
 const state={version:1,updatedAt:Date.now(),library:houseLibrary(),draft:{id,house:structuredClone(h)}};
 globalThis.localStorage?.setItem(HOUSE_STATE_KEY,JSON.stringify(state));
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>{flushHouseStorage().catch(()=>{});},200);
}
export function flushHouseStorage(){
 clearTimeout(saveTimer);
 let state;try{state=JSON.parse(globalThis.localStorage?.getItem(HOUSE_STATE_KEY)||'null');}catch{}
 state||={version:1,updatedAt:Date.now(),draft:null};state.library=houseLibrary();state.updatedAt=Date.now();
 globalThis.localStorage?.setItem(HOUSE_STATE_KEY,JSON.stringify(state));
 if(globalThis.desktop?.saveHouseDesigns)pendingSave=pendingSave.catch(()=>{}).then(()=>globalThis.desktop.saveHouseDesigns(state));
 return pendingSave;
}
export const contains=(r,x,y)=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h;
export const LOW_FURNITURE={bed:12,table:16,desk:16,sofa:10,chair:8,bench:8,counter:16};
export function furnitureHeight(f){return f.jumpable!==false&&LOW_FURNITURE[f.kind]?Math.max(6,Math.min(18,Number(f.surfaceHeight)||LOW_FURNITURE[f.kind])):0;}
export function upgradeHouseFeatures(h){
 if(!h.lightingVersion){
  h.lightingVersion=1;
  if(!(h.furniture||[]).some(f=>['lamp','ceiling_light'].includes(f.kind)))for(const floor of h.floors||[]){
   for(const [dx,dy]of [[24,24],[floor.w-48,floor.h-48]]){const x=floor.x+dx,y=floor.y+dy;if(x<900&&x+24>700&&y<878&&y+24>700)continue;if((h.furniture||[]).some(f=>x<f.x+f.w&&x+24>f.x&&y<f.y+f.h&&y+24>f.y))continue;h.furniture.push({kind:'lamp',x,y,w:24,h:24,lightMode:'auto',lightRadius:180});}
  }
 }
 for(const p of h.pools||[])p.waterType='pool';
 for(const f of h.furniture||[])if(LOW_FURNITURE[f.kind]&&f.jumpable===undefined){f.jumpable=true;f.surfaceHeight=LOW_FURNITURE[f.kind];}
 if(h.featuresVersion>=1)return h;
 h.featuresVersion=1;
 if(h.walls.some(w=>w.kind==='window'))return h;
 const walls=[];
 for(const w of h.walls){
  const horizontal=w.w>w.h,length=horizontal?w.w:w.h,x=w.x+w.w/2,y=w.y+w.h/2;
  const inside=(x,y)=>h.floors.some(f=>contains(f,x,y));
  const exterior=horizontal?inside(x,w.y-2)!==inside(x,w.y+w.h+2):inside(w.x-2,y)!==inside(w.x+w.w+2,y);
  if(w.kind==='fence'||length<144||!exterior){walls.push(w);continue;}
  const half=(length-48)/2;
  walls.push({...w,[horizontal?'w':'h']:half},{...w,kind:'window',x:horizontal?w.x+half:w.x,y:horizontal?w.y:w.y+half,[horizontal?'w':'h']:48},{...w,x:horizontal?w.x+half+48:w.x,y:horizontal?w.y:w.y+half+48,[horizontal?'w':'h']:half});
 }
 h.walls=walls;return h;
}
export function defaultHouse(){
 const walls=[],doors=[];
 const wall=(x,y,w,h,kind='wall')=>walls.push({x,y,w,h,kind});
 const horizontal=(x,y,w,openings,kind='wall')=>{let left=x;for(const center of openings){const size=kind==='fence'?128:96;wall(left,y,center-size/2-left,16,kind);doors.push({x:center-size/2,y,w:size,h:16,open:false,kind:kind==='fence'?'gate':'door'});left=center+size/2;}wall(left,y,x+w-left,16,kind);};
 // A continuous central gallery links front entry, board room and rear patio.
 // Side-room partitions never cut across that axis or the party's board area.
 horizontal(480,480,640,[640,800]);horizontal(480,1104,640,[800]);wall(480,496,16,608);
 wall(1104,496,16,56);doors.push({x:1104,y:552,w:16,h:96,open:false,kind:'door'});wall(1104,648,16,456);
 for(const y of [672,944]){horizontal(496,y,240,[624]);horizontal(864,y,240,[976]);}
 for(const y of [496,960]){wall(736,y,16,y===496?176:144);wall(848,y,16,y===496?176:144);}
 horizontal(320,144,960,[800],'fence');wall(320,160,16,320,'fence');wall(1264,160,16,320,'fence');wall(320,464,160,16,'fence');wall(1120,464,160,16,'fence');
 const furniture=[];const add=(kind,x,y,w,h)=>furniture.push({kind,x,y,w,h});
 add('counter',512,512,96,32);add('counter',656,512,64,32);add('sink',528,512,40,32);add('stove',656,512,48,32);add('table',544,576,80,48);add('chair',560,640,24,24);add('chair',600,560,24,24);
 add('bed',912,512,80,112);add('dresser',1032,512,48,32);add('plant',880,512,32,32);
 add('sofa',512,736,48,128);add('bookcase',1040,736,32,128);add('rug',920,832,128,80);add('table',944,848,64,48);add('plant',1056,880,32,32);
 add('desk',512,992,112,40);add('chair',544,1040,32,32);add('bookcase',688,992,24,96);add('rug',760,992,72,80);add('bookcase',1040,976,32,112);add('desk',896,992,80,40);add('chair',912,1048,24,24);
 add('mailbox',1136,1360,24,32);add('bench',528,288,112,32);add('plant',512,352,32,32);
 return upgradeHouseFeatures({version:1,floorplanVersion:2,name:'The Living House',walls,doors,floors:[{x:480,y:480,w:640,h:640}],pools:[{x:896,y:240,w:256,h:160}],paths:[{x:736,y:1120,w:128,h:352},{x:736,y:400,w:128,h:80},{x:576,y:432,w:576,h:48},{x:1120,y:552,w:128,h:96}],furniture,trees:[{x:400,y:256,size:92},{x:416,y:400,size:82},{x:1200,y:240,size:96},{x:1216,y:416,size:80},{x:400,y:1248,size:96},{x:512,y:1392,size:80},{x:1248,y:1232,size:92},{x:1216,y:1456,size:80}],rooms:[{name:'Kitchen & dining',x:624,y:648},{name:'Bedroom',x:976,y:648},{name:'Board & living room',x:800,y:904},{name:'Study',x:624,y:1080},{name:'Entrance gallery',x:800,y:1080},{name:'Library',x:976,y:1080}]});
}
export function validateHouse(h){
 if(h?.version!==1||typeof h.name!=='string'||!h.name.trim()||h.name.length>60)return false;
 const rect=r=>r&&['x','y','w','h'].every(k=>Number.isFinite(r[k]))&&r.x>=16&&r.y>=16&&r.w>=8&&r.h>=8&&r.x+r.w<=1584&&r.y+r.h<=1584;
 for(const key of ['walls','doors','floors','pools','paths','furniture'])if(!Array.isArray(h[key])||h[key].length>300||!h[key].every(rect))return false;
 if(!Array.isArray(h.trees)||h.trees.length>100||!h.trees.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&t.x>=32&&t.x<=1568&&t.y>=32&&t.y<=1568&&Number.isFinite(t.size)&&t.size>=32&&t.size<=160))return false;
 if(!Array.isArray(h.rooms)||h.rooms.length>40||!h.rooms.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&typeof r.name==='string'&&r.name.length<60))return false;
 return h.floors.some(r=>contains(r,800,800))&&!h.walls.concat(h.doors,h.pools,h.furniture.filter(f=>!['rug','plant'].includes(f.kind))).some(r=>r.x<900&&r.x+r.w>700&&r.y<878&&r.y+r.h>700);
}
export function houseLibrary(){
 try{const data=JSON.parse(globalThis.localStorage?.getItem(HOUSE_KEY)||'null');if(data?.designs?.length&&data.designs.every(d=>typeof d.id==='string'&&validateHouse(d.house))){for(const d of data.designs)upgradeHouseFeatures(d.house);return data;}}catch{}
 return {active:'default',designs:[{id:'default',house:defaultHouse()}]};
}
export function activeHouse(){const lib=houseLibrary();return structuredClone((lib.designs.find(d=>d.id===lib.active)||lib.designs[0]).house);}
export function saveHouseVersion(h,id=null,activate=true){
 if(!validateHouse(h))throw Error('Keep the board and starting area clear (700–900, 700–878), include a floor under the board, and keep objects within the map.');
 const lib=houseLibrary();id ||= crypto.randomUUID();const entry=lib.designs.find(d=>d.id===id);if(entry)entry.house=structuredClone(h);else lib.designs.push({id,house:structuredClone(h)});if(activate)lib.active=id;
 globalThis.localStorage.setItem(HOUSE_KEY,JSON.stringify(lib));return id;
}
export function activateHouse(id){const lib=houseLibrary();if(!lib.designs.some(d=>d.id===id))throw Error('Unknown house');lib.active=id;globalThis.localStorage.setItem(HOUSE_KEY,JSON.stringify(lib));}
export function carveDoor(h,door){
 const horizontal=door.w>door.h,parts=[];
 for(const w of h.walls){
  if(horizontal&&w.w>w.h&&Math.abs(w.y-door.y)<20&&door.x<w.x+w.w&&door.x+door.w>w.x){door.y=w.y;door.h=w.h;if(door.x>w.x)parts.push({...w,w:door.x-w.x});if(door.x+door.w<w.x+w.w)parts.push({...w,x:door.x+door.w,w:w.x+w.w-door.x-door.w});}
  else if(!horizontal&&w.h>w.w&&Math.abs(w.x-door.x)<20&&door.y<w.y+w.h&&door.y+door.h>w.y){door.x=w.x;door.w=w.w;if(door.y>w.y)parts.push({...w,h:door.y-w.y});if(door.y+door.h<w.y+w.h)parts.push({...w,y:door.y+door.h,h:w.y+w.h-door.y-door.h});}
  else parts.push(w);
 }h.walls=parts;h.doors.push(door);
}

