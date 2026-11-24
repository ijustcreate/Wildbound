export const LOCATION_DESIGN_KEY='wildbound-location-designs-v1';
export const EDITABLE_LOCATIONS=Object.freeze([
 {id:'temple',name:'Jungle temple · ground floor',type:'house'},
 {id:'temple-upper',name:'Jungle temple · upper sanctum',type:'grid'},
 {id:'old-well',name:'Old well · underground tunnels',type:'grid'},
 {id:'mausoleum',name:'Mausoleum · crypt',type:'grid'},
 {id:'storage',name:'Private storeroom',type:'grid'},
]);
const clone=v=>structuredClone(v);
let cacheRaw,cacheData;const accepted=new WeakSet();
function readLibrary(){const raw=globalThis.localStorage?.getItem(LOCATION_DESIGN_KEY)||'null';if(raw===cacheRaw&&cacheData)return cacheData;cacheRaw=raw;try{const data=JSON.parse(raw);if(data?.version===1&&data.layouts&&typeof data.layouts==='object')return cacheData=data;}catch{}return cacheData={version:1,updatedAt:0,layouts:{},drafts:{}};}
export function locationLibrary(){return clone(readLibrary());}
export async function loadLocationStorage(){
 if(!globalThis.desktop?.loadLocationDesigns)return;
 const disk=await globalThis.desktop.loadLocationDesigns();
 if(disk?.version===1&&disk.updatedAt>locationLibrary().updatedAt)globalThis.localStorage?.setItem(LOCATION_DESIGN_KEY,JSON.stringify(disk));
}
export async function flushLocationStorage(data=locationLibrary()){
 data.updatedAt=Date.now();globalThis.localStorage?.setItem(LOCATION_DESIGN_KEY,JSON.stringify(data));
 if(globalThis.desktop?.saveLocationDesigns)await globalThis.desktop.saveLocationDesigns(data);return data;
}
export function validateLocationDesign(d){
 if(!EDITABLE_LOCATIONS.some(l=>l.id===d?.id)||d.version!==1||typeof d.name!=='string'||!d.name.trim()||d.name.length>60)return 'Give this location a name.';
 if(EDITABLE_LOCATIONS.find(l=>l.id===d.id).type!==d.type)return 'Incorrect layout type for this location.';
 if(d.type==='house'&&((d.house?.scenery?.length||0)>1000||(d.house?.spawnPoints?.length||0)>64))return 'Too many scenery objects or fixed spawns.';
 if(d.type==='house')return ['walls','floors','doors','furniture','pools','paths','trees'].every(k=>Array.isArray(d.house?.[k]))?'':'Missing building layout.';
 if(!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<8||d.width>100||d.height<8||d.height>100||d.tile!==16||d.tiles?.length!==d.width*d.height||d.tiles.some(t=>t!==0&&t!==1&&!(d.id==='mausoleum'&&t===2)))return 'Invalid floor grid.';
 if(!Array.isArray(d.markers)||d.markers.length>160)return 'Too many objects.';
 const floor=p=>p&&Number.isFinite(p.x+p.y)&&p.x>=16&&p.y>=16&&p.x<d.width*16-16&&p.y<d.height*16-16&&d.tiles[Math.floor(p.y/16)*d.width+Math.floor(p.x/16)];
 if(d.markers.some(p=>p.data?.items&&(!Array.isArray(p.data.items)||p.data.items.length>64||p.data.items.some(i=>i&&(typeof i.type!=='string'||!Number.isFinite(i.qty)||i.qty<1||i.qty>999)))))return 'Use valid item IDs and quantities from 1 to 999.';
 if(d.markers.some(p=>!floor(p)))return 'Place every object on open floor inside the boundary.';
 for(const role of d.id==='mausoleum'?['exit','chest','coffin']:d.id==='storage'?['exit']:['exit','chest'])if(d.markers.filter(m=>m.role===role).length!==1)return 'Keep exactly one '+role+' marker.';
 const exit=d.markers.find(m=>m.role==='exit'),start=Math.floor(exit.y/16)*d.width+Math.floor(exit.x/16),seen=new Set([start]),queue=[start];
 for(let i=0;i<queue.length;i++){const a=queue[i];for(const b of[a-1,a+1,a-d.width,a+d.width])if(b>=0&&b<d.tiles.length&&d.tiles[b]&&!seen.has(b)&&Math.abs(b%d.width-a%d.width)+Math.abs(Math.floor(b/d.width)-Math.floor(a/d.width))===1){seen.add(b);queue.push(b);}}
 if(d.markers.some(m=>!seen.has(Math.floor(m.y/16)*d.width+Math.floor(m.x/16))))return 'Connect all objects to the exit with walkable floor.';
 return '';
}
export async function saveLocationDesign(d){const error=validateLocationDesign(d);if(error)throw Error(error);const data=locationLibrary();data.layouts[d.id]=clone(d);data.drafts??={};data.drafts[d.id]=clone(d);await flushLocationStorage(data);return d;}
export function preserveLocationDraft(d){const data=locationLibrary();data.drafts??={};data.drafts[d.id]=clone(d);data.updatedAt=Date.now();globalThis.localStorage?.setItem(LOCATION_DESIGN_KEY,JSON.stringify(data));}
export function activeLocationDesign(id){const d=readLibrary().layouts[id];if(!d)return null;if(accepted.has(d))return d;if(validateLocationDesign(d))return null;accepted.add(d);return d;}
export function locationMarker(id,role,fallback){return activeLocationDesign(id)?.markers?.find(m=>m.role===role)||fallback;}
export function locationFloorBlocked(id,x,y,r=5){const d=activeLocationDesign(id);if(!d||d.type!=='grid')return false;return [[0,0],[-r,-r],[r,-r],[-r,r],[r,r]].some(([dx,dy])=>{const tx=Math.floor((x+dx)/16),ty=Math.floor((y+dy)/16);return tx<0||ty<0||tx>=d.width||ty>=d.height||!d.tiles[ty*d.width+tx];});}
export function applyDungeonDesign(room,id,{preserveProgress=false,design=activeLocationDesign(id)}={}){
 const d=design;if(!d||d.type!=='grid')return room;
 const factor=preserveProgress&&room.worldVersion>=1?(room.tile||32)/16:1;
 room.tiles=clone(d.tiles);room.width=d.width;room.height=d.height;room.tile=16*factor;room.designName=d.name;
 for(const role of ['exit','arrival','chest','coffin']){const m=d.markers.find(m=>m.role===role);if(m)room[role]={...(room[role]||{}),...(!preserveProgress?m.data||{}:{}),x:m.x*factor,y:m.y*factor};}
 room.decorations=d.markers.filter(m=>m.role==='prop').map(m=>({...clone(m),x:m.x*factor,y:m.y*factor}));
 room.candles=d.markers.filter(m=>m.role==='light').map((m,i)=>({x:m.x*factor,y:m.y*factor,radius:66*factor,phase:i}));
 if(!preserveProgress){room.enemies=d.markers.filter(m=>m.role==='enemy').map((m,i)=>({...clone(m.actor||{}),id:id+'-authored-'+i,kind:m.kind||'skeleton',x:m.x,y:m.y,hp:m.hp||60,maxHp:m.hp||60,speed:m.actor?.speed||35,damage:m.actor?.damage||9,state:m.kind==='crypt_skeleton_boss'?'dormant':'idle',cooldown:0,attack:0,step:0,moving:false,faceX:0,faceY:1}));}
 if(preserveProgress)for(const actor of room.enemies||[]){const tx=Math.floor(actor.x/room.tile),ty=Math.floor(actor.y/room.tile);if(tx<0||ty<0||tx>=d.width||ty>=d.height||!d.tiles[ty*d.width+tx]){actor.x=room.exit.x;actor.y=room.exit.y;}}
 if(id==='mausoleum'){const previous=room.gates||[];room.gates=room.decorations.filter(p=>p.kind==='crypt_door').map(p=>({...p,opened:previous.find(g=>g.id===p.id)?.opened||false}));}
 room.explored=preserveProgress?(room.explored||[]).filter(i=>i>=0&&i<d.tiles.length):[];return room;
}
export function drawDesignedRoom(c,id,design=activeLocationDesign(id)){
 const d=design;if(!d||d.type!=='grid')return false;
 c.save();c.fillStyle='#10251e';c.fillRect(0,0,d.width*16,d.height*16);
 for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++){const floor=d.tiles[y*d.width+x],crypt=id==='mausoleum',well=id==='old-well',houseScale=['storage','temple-upper'].includes(id),shade=houseScale?Math.floor(x/2)+Math.floor(y/2):x+y;c.fillStyle=floor?(crypt?'#686375':well?'#3d3a35':(shade%2?'#738268':'#68795e')):(crypt?'#353448':'#344a3d');c.fillRect(x*16,y*16,16,16);c.fillStyle=floor?(crypt?'#8c8795':well?'#625c4b':'#9ba583'):'#6c7964';if(!floor||!houseScale||y%2===0)c.fillRect(x*16+(houseScale&&x%2?0:1),y*16+1,houseScale?16:14,1);c.fillStyle='#18291f55';if(!floor||!houseScale||x%2===1)c.fillRect(x*16+15,y*16,1,16);}
c.restore();return true;
}
