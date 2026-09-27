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
export function defaultHouse(){
 const walls=[],doors=[];
 const wall=(x,y,w,h,kind='wall')=>walls.push({x,y,w,h,kind});
 const horizontal=(x,y,w,openings,kind='wall')=>{let left=x;for(const center of openings){const size=kind==='fence'?96:64;wall(left,y,center-size/2-left,16,kind);doors.push({x:center-size/2,y,w:size,h:16,open:false,kind:kind==='fence'?'gate':'door'});left=center+size/2;}wall(left,y,x+w-left,16,kind);};
 horizontal(480,480,640,[640]);horizontal(480,1104,640,[800]);wall(480,496,16,608);wall(1104,496,16,608);
 horizontal(496,672,608,[640,960]);horizontal(496,944,608,[640,960]);wall(784,496,16,176);wall(784,960,16,144);
 horizontal(320,144,960,[800],'fence');wall(320,160,16,320,'fence');wall(1264,160,16,320,'fence');wall(320,464,160,16,'fence');wall(1120,464,160,16,'fence');
 const furniture=[];const add=(kind,x,y,w,h)=>furniture.push({kind,x,y,w,h});
 add('counter',512,512,96,32);add('counter',688,512,64,32);add('sink',528,512,40,32);add('stove',688,512,48,32);add('table',544,576,64,48);add('chair',560,640,24,24);
 add('bed',928,512,80,112);add('dresser',1032,528,48,80);add('plant',832,512,32,32);
 add('sofa',512,736,48,128);add('bookcase',1040,736,32,128);add('rug',920,832,128,80);add('table',944,848,64,48);add('plant',1056,880,32,32);
 add('desk',512,992,112,40);add('chair',544,1040,32,32);add('bookcase',688,992,32,96);add('rug',832,992,160,64);add('dresser',1040,976,48,80);
 add('mailbox',1136,1360,24,32);add('bench',528,288,112,32);add('plant',512,352,32,32);
 return {version:1,name:'The Living House',walls,doors,floors:[{x:480,y:480,w:640,h:640}],pools:[{x:896,y:240,w:256,h:160}],paths:[{x:768,y:1120,w:64,h:352},{x:608,y:400,w:64,h:80}],furniture,trees:[{x:400,y:256,size:92},{x:416,y:400,size:82},{x:1200,y:240,size:96},{x:1216,y:416,size:80},{x:400,y:1248,size:96},{x:512,y:1392,size:80},{x:1248,y:1232,size:92},{x:1216,y:1456,size:80}],rooms:[{name:'Kitchen',x:640,y:568},{name:'Bedroom',x:944,y:648},{name:'Living room',x:800,y:904},{name:'Study',x:656,y:1080},{name:'Entrance hall',x:928,y:1080}]};
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
 try{const data=JSON.parse(globalThis.localStorage?.getItem(HOUSE_KEY)||'null');if(data?.designs?.length&&data.designs.every(d=>typeof d.id==='string'&&validateHouse(d.house)))return data;}catch{}
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

