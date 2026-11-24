// Camera policy is independent of simulation: rendering never moves a player.
export const CAMERA_DEFAULTS=Object.freeze({enabled:true,minZoom:.65,maxZoom:1.65,padding:64,mergeRatio:.78,mergeDelay:.7,followSpeed:5,twoLayout:'auto',threeLayout:'wide',divider:3,dynamicSplit:true,seamResponse:12,seamPulse:.65,splitDuration:.62,mergeFade:.42,reducedMotion:false});
export const CAMERA_KEY='wildbound-multiplayer-camera-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function normalizeCameraSettings(value={}){
 const s={...CAMERA_DEFAULTS,...value};
 for(const [key,a,b]of [['minZoom',.25,2],['maxZoom',.5,3],['padding',24,150],['mergeRatio',.5,.95],['mergeDelay',0,3],['followSpeed',1,15],['divider',1,8],['seamResponse',5,22],['seamPulse',0,1],['splitDuration',.5,1.1],['mergeFade',.2,1]])s[key]=clamp(Number.isFinite(Number(s[key]))?Number(s[key]):CAMERA_DEFAULTS[key],a,b);
 s.maxZoom=Math.max(s.minZoom,s.maxZoom);s.enabled=s.enabled!==false;s.dynamicSplit=s.dynamicSplit!==false;s.reducedMotion=!!s.reducedMotion;
 s.twoLayout=['auto','vertical','horizontal'].includes(s.twoLayout)?s.twoLayout:'auto';s.threeLayout=['wide','tall'].includes(s.threeLayout)?s.threeLayout:'wide';return s;
}
let settings;
export function cameraSettings(){if(!settings){try{settings=normalizeCameraSettings(JSON.parse(globalThis.localStorage?.getItem(CAMERA_KEY)||'{}'));}catch{settings=normalizeCameraSettings();}}return settings;}
export function saveCameraSettings(value){const next=normalizeCameraSettings(value);globalThis.localStorage?.setItem(CAMERA_KEY,JSON.stringify(next));settings=next;return next;}
export function cameraRects(count,w,h,s=CAMERA_DEFAULTS){
 const gap=s.divider,vertical=s.twoLayout==='vertical'||s.twoLayout==='auto'&&w>=h;
 if(count<=1)return [{x:0,y:0,w,h}];
 const hw=(w-gap)/2,hh=(h-gap)/2;
 if(count===2)return vertical?[{x:0,y:0,w:hw,h},{x:hw+gap,y:0,w:hw,h}]:[{x:0,y:0,w,h:hh},{x:0,y:hh+gap,w,h:hh}];
 if(count===3)return s.threeLayout==='wide'?[{x:0,y:0,w,h:hh},{x:0,y:hh+gap,w:hw,h:hh},{x:hw+gap,y:hh+gap,w:hw,h:hh}]:[{x:0,y:0,w:hw,h},{x:hw+gap,y:0,w:hw,h:hh},{x:hw+gap,y:hh+gap,w:hw,h:hh}];
 return [{x:0,y:0,w:hw,h:hh},{x:hw+gap,y:0,w:hw,h:hh},{x:0,y:hh+gap,w:hw,h:hh},{x:hw+gap,y:hh+gap,w:hw,h:hh}];
}
export function cameraFit(players,w,h,s=CAMERA_DEFAULTS){
 const xs=players.map(p=>p.x),ys=players.map(p=>p.y-(p.jumpHeight||0)*.5),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const needed=Math.min(w/(maxX-minX+s.padding*2),h/(maxY-minY+s.padding*2));
 return {x:(minX+maxX)/2,y:(minY+maxY)/2,zoom:clamp(needed,s.minZoom,s.maxZoom),needed};
}
const belowDeck=p=>p.pirateRide?.level==='hold';
function separateShipFloors(group){
 const aboard=group.filter(belowDeck);
 return aboard.length&&aboard.length<group.length?[aboard,group.filter(p=>!belowDeck(p))]:null;
}
function divide(group){
 const floors=separateShipFloors(group);
 if(floors)return floors;
 let best=null;
 for(const axis of ['x','y']){const sorted=[...group].sort((a,b)=>a[axis]-b[axis]||String(a.id).localeCompare(String(b.id)));for(let i=1;i<sorted.length;i++){const gap=sorted[i][axis]-sorted[i-1][axis];if(!best||gap>best.gap)best={gap,groups:[sorted.slice(0,i),sorted.slice(i)]};}}
 return best.groups;
}
const orderGroups=(groups,order)=>groups.map(g=>[...g].sort((a,b)=>order.get(a.id)-order.get(b.id))).sort((a,b)=>order.get(a[0].id)-order.get(b[0].id));
const signature=groups=>groups.map(g=>g.map(p=>p.id).join(',')).join('|');
export class MultiplayerCamera {
 constructor(){this.groups=[];this.mergeAge=0;this.mergeKey='';}
 update(players,w,h,dt,s=CAMERA_DEFAULTS){
  const ids=players.map(p=>p.id).join(',');
  if(this.ids!==ids){this.ids=ids;this.groups=players.length?[[...players]]:[];this.mergeAge=0;}
  const order=new Map(players.map((p,i)=>[p.id,i]));const current=new Map(players.map(p=>[p.id,p]));this.groups=this.groups.map(g=>g.map(p=>current.get(p.id)));
  if(!s.enabled){this.groups=players.length?[[...players]]:[];return this.layout(w,h,s);}
  let changed=false;
  while(this.groups.length<Math.min(4,players.length)){
   this.groups=orderGroups(this.groups,order);const rects=cameraRects(this.groups.length,w,h,s);let worst=-1,fit=Infinity;
   this.groups.forEach((g,i)=>{const bounds=this.availableBounds?.get(g.map(p=>p.id).join(','))||rects[i],f=separateShipFloors(g)?0:cameraFit(g,bounds.w,bounds.h,s).needed;if(g.length>1&&f<s.minZoom&&f<fit){worst=i;fit=f;}});
   if(worst<0)break;this.groups.splice(worst,1,...divide(this.groups[worst]));changed=true;
  }
  this.groups=orderGroups(this.groups,order);let candidate=null;
  // Full regroup first, then pairwise merges. Require extra room before merging.
  const candidates=this.groups.length>1?[[players]]:[];
  for(let i=0;i<this.groups.length;i++)for(let j=i+1;j<this.groups.length;j++)candidates.push(this.groups.filter((_,k)=>k!==j).map((g,k)=>k===i?[...g,...this.groups[j]]:g));
  for(const raw of candidates){const groups=orderGroups(raw,order);const rects=cameraRects(groups.length,w,h,s);if(groups.every((g,i)=>g.length===1||!separateShipFloors(g)&&cameraFit(g,rects[i].w,rects[i].h,s).needed>=s.minZoom/s.mergeRatio)){candidate=groups;break;}}
  this.mergeTarget=candidate;const key=candidate?signature(candidate):'';
  this.mergeAge=!changed&&key&&key===this.mergeKey?this.mergeAge+Math.max(0,dt):0;if(key!==this.mergeKey)this.mergeReady='';this.mergeKey=key;
  const wait=Math.max(s.mergeDelay,s.mergeFade);this.mergeProgress=candidate?.length===1?Math.max(0,Math.min(1,(this.mergeAge-(wait-s.mergeFade))/s.mergeFade)):0;
  if(candidate&&this.mergeAge>=wait){if(candidate.length!==1||this.mergeReady===key){this.groups=candidate;this.mergeAge=0;this.mergeReady='';}else this.mergeReady=key;}
  return this.layout(w,h,s);
 }
 layout(w,h,s){return cameraRects(this.groups.length,w,h,s).slice(0,this.groups.length).map((rect,i)=>({...rect,players:this.groups[i],key:this.groups[i].map(p=>p.id).join(','),camera:cameraFit(this.groups[i],rect.w,rect.h,s.enabled?s:{...s,minZoom:.01})}));}
}
