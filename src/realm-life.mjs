import {REALMS,realmHash,realmVoidBlocked,realmFootprint,realmTerrainAt,realmContexts,realmEventContext} from './realm-world.mjs';
import {drawRealmSprite} from './realm-art.mjs';
import {drawWildFauna} from './wild-fauna-art.mjs';
import {drawMonarchFairyDragon} from './monarch-fairy-dragon.mjs';
import {drawAxolotl} from './axolotl.mjs';
import {seedMarshFireflies,tickMarshFirefly,firefliesAwake,drawMarshFirefly} from './swamp-fireflies.mjs';
export const REALM_FAUNA={swamp:['bayou_frog','marsh_firefly','nutria'],caverns:['cave_cricket','blind_fish','olm'],shadow:['dusk_moth','veil_beetle','shadow_stag','monarch_fairy_dragon']};
const colors={bayou_frog:['#3f6550','#9cac69'],marsh_firefly:['#596b48','#e8e69a'],nutria:['#71543e','#b9976a'],cave_cricket:['#6a6963','#babca4'],blind_fish:['#b7bbaa','#ede2cb'],olm:['#cf9fac','#f3d1d5'],dusk_moth:['#796584','#ceb5ce'],veil_beetle:['#4d5c71','#9ca6c1'],pale_hart:['#a6a4bc','#e2dfdf']};
function makeOlmSprite(view){
 const s={width:64,height:64,palette:['transparent','#322936','#925f77','#d99eae','#f4cbd0','#fa5b91','#181923','#78d9e6','#fff0dd'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0)};
 const r=(x,y,w,h,v)=>{for(let yy=Math.max(0,y);yy<Math.min(64,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(64,x+w);xx++)s.pixels[yy*64+xx]=v;};
 const side=view===2||view===6,rear=view>=3&&view<=5,faceRight=view<=4;
 if(side){
  const hx=faceRight?46:18,tail=faceRight?7:57,dir=faceRight?1:-1;
  r(12,36,38,14,1);r(15,36,34,11,3);r(18,37,27,5,4);
  r(faceRight?34:12,30,20,17,1);r(faceRight?36:14,31,17,14,3);r(faceRight?38:16,32,12,6,4);
  r(tail-2,39,5,3,2);r(tail-4,36,3,10,3);r(tail-6,37,2,8,4);r(tail-2,37,8,2,3);
  r(hx-6,31,12,11,1);r(hx-5,32,10,9,3);r(hx-3,33,6,4,4);r(hx+dir*3,35,2,2,6);r(hx+dir*3,35,1,1,7);r(hx+dir*4,39,3,2,2);r(hx+dir*5,39,2,1,8);
  const gx=hx-dir*8;for(let i=0;i<3;i++){const gy=31+i*4;r(gx-dir*2,gy,4,2,5);r(gx-dir*4,gy-3,2,3,5);r(gx-dir*4,gy+2,2,3,5);r(gx-dir*6,gy-4,2,2,4);r(gx-dir*6,gy+4,2,2,4);}
  for(const [x,y] of [[hx-dir*9,45],[hx-dir*1,46],[tail+dir*8,46]]){r(x-2,y,5,5,1);r(x-1,y+1,3,3,3);r(x-2,y+4,2,2,2);r(x+2,y+4,2,2,2);}
 }else{
  const hx=32+(view===1?3:view===7?-3:rear&&view===3?-2:rear&&view===5?2:0),tailY=rear?56:8;
  r(27,tailY-7,10,15,1);r(29,tailY-5,6,12,3);r(30,tailY-3,4,9,4);
  r(20,24,24,27,1);r(22,25,20,24,3);r(25,27,14,15,4);r(25,40,14,7,8);
  r(hx-14,21,28,17,1);r(hx-12,22,24,14,3);r(hx-9,23,18,9,4);
  if(!rear){
   for(const sideSign of [-1,1])for(let i=0;i<3;i++){const gx=hx+sideSign*(13+i%2),gy=25+i*4;r(gx-1,gy,3,3,5);r(gx+sideSign*2,gy-4,2,5,5);r(gx+sideSign*2,gy+2,2,5,5);r(gx+sideSign*4,gy-6,2,3,4);r(gx+sideSign*4,gy+4,2,3,4);}
   r(hx-8,28,4,4,6);r(hx+4,28,4,4,6);r(hx-7,28,2,2,7);r(hx+5,28,2,2,7);r(hx-3,34,6,2,2);r(hx-2,34,4,1,8);
  }else{r(hx-6,25,12,10,2);r(hx-4,27,8,5,3);}
  for(const x of [21,39]){r(x,42,5,8,1);r(x+1,43,3,5,3);r(x,49,2,2,2);r(x+3,49,2,2,2);}
 }
 return s;
}
function makeNutriaSprite(view){
 const s={width:64,height:64,palette:['transparent','#30231f','#52372b','#795039','#a97149','#d4b88c','#332932','#f0d9ad'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0)};
 const r=(x,y,w,h,v)=>{for(let yy=Math.max(0,y);yy<Math.min(64,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(64,x+w);xx++)s.pixels[yy*64+xx]=v;};
 const side=[2,6].includes(view),rear=view>=3&&view<=5,facing=view<=4?1:-1;
 const ovalRows=(cx,top,widths,step=2)=>widths.forEach((half,i)=>{const y=top+i*step;r(cx-half,y,half*2,step,1);r(cx-half+1,y+1,half*2-2,Math.max(1,step-1),3);});
 if(side){
  const headX=facing>0?46:18;
  for(let i=0;i<9;i++){const x=facing>0?4+i*2:60-i*2,y=43+i%3; r(x,y,Math.max(1,8-i),2,i<3?2:3);}
  ovalRows(32,31,[4,8,11,13,14,14,13,12,10,7]);
  r(23,33,18,5,4);r(26,34,12,3,5);
  r(headX-6,32,12,12,1);r(headX-5,33,10,10,3);r(headX-4,34,6,4,4);
  r(headX-4,29,4,4,1);r(headX+2,29,4,4,1);r(headX-3,30,2,2,4);r(headX+3,30,2,2,4);
  if(!rear){const eyeX=headX+facing*2;r(eyeX,36,2,2,6);r(eyeX,36,1,1,7);}
  r(headX+facing*3,39,5,5,5);r(headX+facing*7,40,2,2,1);
  r(headX+facing*5,39,7,1,5);r(headX+facing*5,41,8,1,5);r(headX+facing*5,43,6,1,5);
  for(const [x,y]of [[23,44],[39,44]]){r(x,y,5,7,1);r(x+1,y,3,5,3);r(x,y+5,5,3,5);}
 }else{
  const tailTop=rear?49:7,tailSign=rear?1:-1;
  for(let i=0;i<8;i++){const y=tailTop+tailSign*i*2,half=Math.max(1,4-Math.floor(i/2));r(32-half,y,half*2,2,i<2?2:3);r(31,y+1,2,1,4);}
  ovalRows(32,17,[3,6,9,11,13,14,15,15,14,13,12,11,10,9,8,7]);
  r(25,24,14,5,4);r(26,26,11,3,5);
  for(const [x,y]of [[22,35],[37,35],[23,44],[36,44]]){r(x,y,5,8,1);r(x+1,y,3,6,3);r(x,y+6,5,3,5);}
  if(!rear){
   const hx=32+(view===1||view===7?(view===1?2:-2):0),hy=39;
   r(hx-11,hy,22,13,1);r(hx-9,hy,18,11,3);r(hx-7,hy+1,14,6,4);
   r(hx-10,hy-4,7,6,1);r(hx+3,hy-4,7,6,1);r(hx-9,hy-3,4,3,4);r(hx+5,hy-3,4,3,4);
   r(hx-6,hy+5,3,2,6);r(hx+3,hy+5,3,2,6);r(hx-6,hy+5,1,1,7);r(hx+3,hy+5,1,1,7);
   r(hx-4,hy+9,8,4,5);r(hx-2,hy+9,4,2,1);
   r(hx-13,hy+9,9,1,5);r(hx-13,hy+11,8,1,5);r(hx+4,hy+9,9,1,5);r(hx+5,hy+11,8,1,5);
  }else{r(27,20,10,4,2);r(28,20,8,2,4);}
 }
 return s;
}
// Bodies and limbs remain separate editable sprites; locomotion is articulated at runtime.
export function makeFaunaSprites(){
 const out={};
 for(const [kind,[base,light]]of Object.entries(colors))for(let view=0;view<8;view++){
  const s={width:64,height:64,palette:['transparent','#272635',base,light,'#f0e5d3'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0)};
  const r=(x,y,w,h,v)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&yy>=0&&xx<64&&yy<64)s.pixels[yy*64+xx]=v;};
  const side=[2,6].includes(view),rear=view>=3&&view<=5,diagonal=[1,3,5,7].includes(view),facing=view<=4?1:-1;
  const big=['nutria','olm','pale_hart'].includes(kind),w=side?36:diagonal?30:22;
  if(kind==='pale_hart'){
   r(32-w/2,31,w,21,1);r(33-w/2,32,w-2,17,2);r(34-w/2,32,w-4,5,3);
   const hx=side?32+facing*14:diagonal?32+facing*8:32;
   r(hx-5,19,10,24,1);r(hx-4,20,8,22,2);r(hx-7,16,14,10,2);r(hx-9,14,5,4,3);r(hx+4,14,5,4,3);
   r(hx-6,4,2,13,3);r(hx+4,4,2,13,3);r(hx-10,7,6,2,3);r(hx+4,7,6,2,3);if(!rear){r(hx-5,20,2,2,1);r(hx+3,20,2,2,1);}
  }else if(kind==='olm'){
   if(side){r(12,40,37,10,1);r(14,40,35,8,2);r(16,40,28,3,3);r(6,45,10,4,2);r(3,48,5,3,3);r(46,38,12,12,2);r(52,40,3,2,1);r(44,34,3,6,3);r(44,49,3,5,3);if(facing<0)for(let y=0;y<64;y++)s.pixels.splice(y*64,64,...s.pixels.slice(y*64,y*64+64).reverse());}else{const hx=diagonal?32+facing*7:32,hy=rear?27:48;r(27,30,10,24,1);r(28,30,8,23,2);r(29,32,3,17,3);r(30,rear?53:16,4,13,2);r(hx-6,hy-4,12,10,2);r(hx-8,hy-2,3,7,3);r(hx+5,hy-2,3,7,3);if(!rear){r(hx-4,hy,2,2,1);r(hx+3,hy,2,2,1);}}
  }else if(kind==='nutria'){
   r(32-w/2,32,w,22,1);r(33-w/2,32,w-2,18,2);r(36-w/2,33,w-8,6,3);const hx=side?32+facing*15:diagonal?32+facing*9:32;
   r(hx-8,37,16,15,2);r(hx-7,33,5,6,1);r(hx+3,33,5,6,1);r(hx-5,33,3,3,3);r(hx+4,33,3,3,3);if(!rear){r(hx-5,41,2,2,1);r(hx+3,41,2,2,1);r(hx-3,49,6,3,3);r(hx-1,51,2,2,4);}if(side||diagonal){const tail=facing>0?8:48;r(tail+3,49,8,3,2);r(tail,51,5,2,3);}else if(rear){r(30,51,4,8,2);r(32,57,5,2,3);}
  }else{
   r(23,41,18,12,1);r(24,40,16,11,2);r(26,40,12,4,3);
   if(kind.includes('moth')||kind.includes('firefly')){r(13,36,12,15,2);r(39,36,12,15,2);r(15,37,8,6,3);r(41,37,8,6,3);r(29,40,6,15,1);r(30,49,4,5,3);}
   else if(kind==='blind_fish'){r(14,41,10,11,2);r(11,39,4,15,3);r(36,39,8,12,3);}
   else {r(19,48,6,7,2);r(39,48,6,7,2);r(24,37,4,6,3);r(36,37,4,6,3);if(!rear){r(25,39,2,2,1);r(37,39,2,2,1);}}
  }
  out[kind+'_body_'+view]=s;
  if(view===0){const limb={...s,pixels:Array(4096).fill(0)};for(let y=10;y<58;y++)for(let x=29;x<34;x++)limb.pixels[y*64+x]=x<31?3:2;out[kind+'_limb']=limb;}
 }
 for(let view=0;view<8;view++)out['nutria_body_'+view]=makeNutriaSprite(view);
 for(let view=0;view<8;view++)out['olm_body_'+view]=makeOlmSprite(view);
 const olmLimb={width:64,height:64,palette:['transparent','#322936','#925f77','#d99eae','#f4cbd0','#fa5b91'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0)};
 for(let y=24;y<51;y++)for(let x=28;x<35;x++)olmLimb.pixels[y*64+x]=y<46?3:1;
 for(let y=45;y<52;y++)for(let x=25;x<39;x++)olmLimb.pixels[y*64+x]=(x<27||x>36)?1:4;
 for(const x of [24,29,34,39])for(let y=49;y<52;y++)olmLimb.pixels[y*64+x]=y===49?4:5;
 out.olm_limb=olmLimb;
 const nutriaLimb={width:64,height:64,palette:['transparent','#30231f','#52372b','#795039','#a97149','#d4b88c'],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0)};
 for(let y=25;y<53;y++)for(let x=29;x<35;x++)nutriaLimb.pixels[y*64+x]=y<47?2:1;
 for(let y=49;y<57;y++)for(let x=26;x<39;x++)nutriaLimb.pixels[y*64+x]=x<28||x>37?1:5;
 for(let y=50;y<54;y++)for(let x=29;x<36;x++)nutriaLimb.pixels[y*64+x]=3;
 out.nutria_limb=nutriaLimb;
 return out;
}
export const FAUNA_SPRITES=makeFaunaSprites();
const olmArtChecks=new WeakMap();
export function hasCustomOlmArt(library){
 if(!library||library===FAUNA_SPRITES)return false;
 return ['olm_limb',...Array.from({length:8},(_,i)=>'olm_body_'+i)].some(key=>{
  const sprite=library[key],base=FAUNA_SPRITES[key];if(!sprite||sprite===base)return false;
  const saved=olmArtChecks.get(sprite);if(saved&&saved.revision===sprite.revision)return saved.custom;
  const custom=sprite.width!==base.width||sprite.height!==base.height||JSON.stringify(sprite.palette)!==JSON.stringify(base.palette)||JSON.stringify(sprite.pixels)!==JSON.stringify(base.pixels);
  olmArtChecks.set(sprite,{revision:sprite.revision,custom});return custom;
 });
}
function habitat(g,kind,x,y){
 const ox=g.realmState?.originX||0,oy=g.realmState?.originY||0;
 if(x<ox+48||y<oy+48||x>ox+1552||y>oy+1552||realmVoidBlocked(g,x,y,8)||Math.hypot(x-800,y-800)<195)return false;
 const tile=realmTerrainAt(g,Math.floor(x/32),Math.floor(y/32));
 if(kind==='blind_fish'){if(tile!=='water')return false;}else if(tile==='water')return false;
 return !(g.scenery||[]).some(p=>{const b=realmFootprint(p);return b&&x>b.x-8&&x<b.x+b.w+8&&y>b.y-8&&y<b.y+b.h+8;});
}
export function seedRealmLife(g){
 const state=g.realmState;if(!state||!REALMS.includes(g.generatedEnvironment))return [];
 const needsUpgrade=state.faunaVersion!==2||!Array.isArray(state.animals);
 state.animals=Array.isArray(state.animals)?state.animals:[];
 // Upgrade already-saved shadow regions in place: preserve each hart's
 // position and identity, then seed only the newly introduced fairy dragons.
 if(g.generatedEnvironment==='shadow')for(const a of state.animals)if(a.kind==='pale_hart')a.kind='shadow_stag';
 if(needsUpgrade)for(const [k,kind]of REALM_FAUNA[g.generatedEnvironment].entries()){
  if(kind==='marsh_firefly')continue;
  const target=kind==='shadow_stag'?2:kind==='monarch_fairy_dragon'?4:6;
  let have=state.animals.filter(a=>a.kind===kind).length;
  for(let n=0;n<target&&have<target;n++){
   const ordinal=have;let added=false;
   for(let attempt=0;attempt<600;attempt++){
    const salt=k*941+ordinal*37+attempt*13,x=(state.originX||0)+80+realmHash(state.seed+salt,13)*1440,y=(state.originY||0)+80+realmHash(salt,state.seed+71)*1440;
    const gap=kind==='shadow_stag'?72:kind==='monarch_fairy_dragon'?26:32;
    if(!habitat(g,kind,x,y)||state.animals.some(a=>Math.hypot(a.x-x,a.y-y)<gap))continue;
    state.animals.push({id:'fauna:'+k+':'+ordinal,kind,x,y,homeX:x,homeY:y,phase:realmHash(salt,5)*6.28,faceX:1,faceY:0,neutral:true});have++;added=true;break;
   }
   if(!added)break;
  }
 }
 state.faunaVersion=2;
 seedMarshFireflies(g);
 return state.animals;
}
export function tickRealmLife(g,dt){for(const ctx of realmContexts(g))tickRegionLife(ctx,dt);}
function tickRegionLife(g,dt){
 if(!REALMS.includes(g.generatedEnvironment)||g.phase!=='play'||g.paused)return;
 for(const a of seedRealmLife(g)){
  if(a.kind==='marsh_firefly'){tickMarshFirefly(g,a,dt);continue;}
  const t=g.time+a.phase,threat=(g.players||[]).find(p=>!p.room&&p.hp>0&&Math.hypot(p.x-a.x,p.y-a.y)<75),large=['nutria','olm','pale_hart','shadow_stag'].includes(a.kind),dragon=a.kind==='monarch_fairy_dragon';
  if(dragon)a.fleeing=!!threat;
  let dx=a.homeX+Math.sin(t*.17)*60-a.x,dy=a.homeY+Math.cos(t*.23)*35-a.y;
  if(threat){dx=a.x-threat.x;dy=a.y-threat.y;}else if(large&&Math.sin(t*.24)>.2){a.moving=false;continue;}
  const length=Math.hypot(dx,dy)||1,step=Math.min(length,Math.min(dt,.1)*(threat?48:large?12:dragon?22:18));a.moving=false;
  for(const [mx,my]of [[dx/length*step,dy/length*step],[dx/length*step,0],[0,dy/length*step]])if(habitat(g,a.kind,a.x+mx,a.y+my)){a.x+=mx;a.y+=my;a.faceX=dx/length;a.faceY=dy/length;const travel=Math.hypot(mx,my);a.travelDistance=(a.travelDistance||0)+travel;a.moving=travel>.01;break;}
 }
}
export function drawRealmLife(c,g,layer='ground'){for(const ctx of realmContexts(g))drawRegionLife(c,ctx,layer);}
function drawRegionLife(c,g,layer){
 if(!g.realmState||g.phase==='won')return;
 const library=g.spriteLibrary||FAUNA_SPRITES;
 for(const a of g.realmState.animals||[]){
  if(a.kind==='marsh_firefly'&&!firefliesAwake(g))continue;
  const air=a.kind==='marsh_firefly'||a.kind==='dusk_moth'||a.kind==='monarch_fairy_dragon';if(air!==(layer==='air'))continue;
  if(g.mapMode!=='boundless'&&Number.isFinite(g.bloom)&&g.bloom<3&&Math.hypot(a.x-800,a.y-800)>g.bloom*430)continue;
  if(a.kind==='marsh_firefly'){drawMarshFirefly(c,a,g.time);continue;}
  const large=['nutria','olm','pale_hart','shadow_stag'].includes(a.kind),size=['pale_hart','shadow_stag'].includes(a.kind)?55:a.kind==='monarch_fairy_dragon'?42:a.kind==='olm'?48:large?42:23,view=(Math.round(Math.atan2(a.faceX,a.faceY)/(Math.PI/4))+8)%8;
  const bounce=air?6+Math.sin(g.time*5+a.phase)*2:a.moving?Math.sin(g.time*12+a.phase):0;
  c.save();c.fillStyle='#090e172f';c.beginPath();c.ellipse(a.x,a.y,size*.25,size*.07,0,0,Math.PI*2);c.fill();
  if(a.kind==='shadow_stag'){
   drawWildFauna(c,{...a,kind:'shadow_stag',id:a.id,step:g.time*9,state:'graze'},g.time,size);c.restore();continue;
  }
  if(a.kind==='monarch_fairy_dragon'){
   drawMonarchFairyDragon(c,{...a,state:a.fleeing?'flee':a.moving?'flutter':'idle'},g.time,size);c.restore();continue;
  }
  if(a.kind==='olm'&&!hasCustomOlmArt(library)){
   drawAxolotl(c,a,g.time,size);c.restore();continue;
  }
  if(large)for(const [i,dx]of [-.25,-.14,.14,.25].entries()){c.save();c.translate(a.x+dx*size,a.y-6+(i<2?-size*.08:0));c.rotate(a.moving?Math.sin(g.time*10+i*Math.PI)*.3:0);drawRealmSprite(c,a.kind+'_limb',0,6,a.kind==='nutria'?13:14,library);c.restore();}
  drawRealmSprite(c,a.kind+'_body_'+view,a.x,a.y-bounce,size,library);c.restore();
 }
}
export const REALM_EVENTS=[
 {name:'Lanterns in the reeds',type:'realm_expedition',kind:'marsh_lanterns',environment:'swamp',count:0,weight:10,verse:'Small lanterns drift where roots run deep.\nFollow the lights the marsh will keep.',tip:'Find the three golden firefly circles. Stand in each for two seconds to guide them home.',reward:'potion'},
 {name:'The nesting bank',kind:'crocodile',environment:'swamp',count:2,hp:95,speed:46,damage:10,weight:7,verse:'A ripple breaks the silent green.\nTwo ancient shapes slip in unseen.',tip:'Alligators guard the outer banks. Keep the boardwalk behind you and dodge their lunges.'},
 {name:'The singing geodes',type:'realm_expedition',kind:'singing_geodes',environment:'caverns',count:0,weight:10,verse:'Three buried voices hum in stone.\nWake each bright heart; return as one.',tip:'Find three cyan resonance circles and stand in each for two seconds. The surrounding crystals can be mined.',reward:'stone'},
 {name:'Wings in the echo hall',kind:'bat',environment:'caverns',count:6,hp:26,speed:72,damage:5,weight:8,verse:'A thousand echoes stir the air.\nSix waking shadows leave their lair.',tip:'Watch for bats in the open chambers. Dust and a growing floor shadow warn of falling stone.'},
 {name:'Keep the last lights',type:'realm_expedition',kind:'shadow_wards',environment:'shadow',count:0,weight:10,verse:'The roots remember stolen day.\nThree pale lights can hold the grey.',tip:'Stand in each of three violet ward circles for two seconds before their ninety-second glow fades.',reward:'potion',deadline:90},
 {name:'Hounds beyond the veil',kind:'murk_wolf',environment:'shadow',count:3,hp:65,speed:66,damage:8,weight:7,verse:'The silence walks on padded feet.\nStay in the light where shadows meet.',tip:'Three murk wolves stalk the clearings. Use the root arches to break up the pack.'},
];
export function startRealmEvent(g,event,{test=false,force=false}={}){
 if(event.type!=='realm_expedition')return false;
 g=realmEventContext(g);
 // The developer event board deliberately tests every card in the current map.
 // Give exploration cards local sites without replacing that map's terrain or ecology.
 if(!g.realmState&&(test||force)){
  const player=g.players?.find(p=>p.hp>0&&!p.room),ox=g.mapMode==='boundless'?Math.floor((player?.x||800)/1600)*1600:0,oy=g.mapMode==='boundless'?Math.floor((player?.y||800)/1600)*1600:0;
  g.realmState={env:event.environment,seed:g.seed,originX:ox,originY:oy,settings:{},animals:[],chambers:[[350,350],[800,300],[1250,350],[1250,800],[1250,1250],[800,1300],[350,1250]].map(([x,y])=>({x:x+ox,y:y+oy,r:120})),event:null};
 }
 if(!g.realmState||g.realmState.event&&!g.realmState.event.done&&!test&&!force)return false;
 const ox=g.realmState.originX||0,oy=g.realmState.originY||0;
 const sites=g.realmState.chambers.filter(p=>Math.hypot(p.x-ox-800,p.y-oy-800)>260);
 g.realmState.event={name:event.name,kind:event.kind,elapsed:0,deadline:event.deadline||180,reward:event.reward||'potion',nodes:[1,3,5].map(i=>{const site=sites[i%sites.length];let spot=site;for(let radius=0;radius<=160;radius+=16){let found=false;for(let a=0;a<8;a++){const x=site.x+Math.cos(a*Math.PI/4)*radius,y=site.y+Math.sin(a*Math.PI/4)*radius;if(!g.blocked?.(x,y,20,false,false,false,0)&&!g.blocked?.(x,y,20)){spot={x,y};found=true;break;}}if(found)break;}return {...spot,charge:0,done:false};}),done:false,rewardX:ox+800,rewardY:oy+1010};
 const first=g.realmState.event.nodes[0];if(first)g.reveal={x:first.x,y:first.y,life:3};
 g.message?.(event.name+' — '+event.tip);g.persist?.();return true;
}
export function tickRealmEvent(g,dt){for(const ctx of realmContexts(g))tickRegionEvent(ctx,dt);}
function tickRegionEvent(g,dt){
 const e=g.realmState?.event;if(!e||e.done||g.phase!=='play'||g.paused)return;
 if(g.mapMode==='boundless'&&!(g.players||[]).some(p=>p.hp>0&&!p.room&&Math.floor(p.x/1600)*1600===(g.realmState.originX||0)&&Math.floor(p.y/1600)*1600===(g.realmState.originY||0)))return;
 e.elapsed+=dt;
 if(e.elapsed>e.deadline){e.done=true;e.failed=true;g.message?.('The lights fade. Another expedition may wake them again.');g.persist?.();return;}
 for(const n of e.nodes){if(n.done)continue;if((g.players||[]).some(p=>p.hp>0&&!p.room&&Math.hypot(p.x-n.x,p.y-n.y)<42))n.charge=Math.min(2,n.charge+dt);else n.charge=Math.max(0,n.charge-dt*.5);if(n.charge>=2){n.done=true;g.onSound?.('harvest',n);g.message?.(`${e.name}: ${e.nodes.filter(a=>a.done).length}/3 awakened.`);g.persist?.();}}
 if(e.nodes.every(n=>n.done)){e.done=true;g.dropLoot?.(e.rewardX??800,e.rewardY??1010,e.reward,e.reward==='stone'?6:2,e.name);g.message?.(e.name+' complete. Your reward waits at this region’s southern clearing.');g.persist?.();}
}
export function drawRealmEvent(c,g){for(const ctx of realmContexts(g))drawRegionEvent(c,ctx);}
function drawRegionEvent(c,g){
 const e=g.realmState?.event;if(!e||e.done)return;
 for(const n of e.nodes){if(n.done)continue;const color=e.kind==='marsh_lanterns'?'#e0d885':e.kind==='singing_geodes'?'#9bdcd7':'#c5a6e2';c.save();c.strokeStyle=color;c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.ellipse(n.x,n.y,38,20,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle=color;for(let i=0;i<5;i++){const a=g.time+i*Math.PI*.4;c.fillRect(n.x+Math.cos(a)*18,n.y-18+Math.sin(a)*8,3,3);}c.fillRect(n.x-20,n.y+27,40*n.charge/2,3);c.restore();}
}
