// Additive scene dressing. Coordinates already authored by the player are never moved.
import {SHADOW_FOREST_PROPS,dressShadowForest} from './shadow-forest-layout.mjs';
export const UNDERWORLD_DETAILS={underworld_columns:{size:150},underworld_bones:{size:45},underworld_urn:{size:44},underworld_rubble:{size:56},underworld_buttress:{size:260},soul_candles:{size:42},...SHADOW_FOREST_PROPS};
export const UNDERWORLD_DRESSING_VERSION=3;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function dressUnderworld(g,terrainAt=null){
 const state=g.realmState;if(!state||state.env!=='shadow'||state.underworldAuthored)return 0;
 if(state.underworldDressingVersion>=UNDERWORLD_DRESSING_VERSION){
  if(!g.scenery.some(p=>p.underworldDressing)&&!state.enchantedForestVersion)return 0;
  return dressShadowForest(g,terrainAt);
 }
 const ox=state.originX||0,oy=state.originY||0,seed=state.seed??g.seed??0,props=g.scenery,local=props.filter(p=>p.x>=ox&&p.x<ox+1600&&(p.rootY??p.y)>=oy&&(p.rootY??p.y)<oy+1600),start=props.length;
 const cap=Math.min(178,(state.settings?.propDensity||100)+58);
 const tile=(x,y)=>terrainAt?terrainAt(Math.floor(x/32),Math.floor(y/32)):g.terrain?.[Math.floor((y-oy)/32)*50+Math.floor((x-ox)/32)];
 const add=(kind,x,y,size,extra={})=>{
  x+=ox;y+=oy;if(local.length>=cap||x<ox+24||x>ox+1576||y<oy+24||y>oy+1576||tile(x,y)!==(kind==='underworld_buttress'?'shadow_void':'shadow_soil'))return null;
  if(local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<(kind==='soul_candles'?16:kind==='underworld_buttress'?100:25)))return null;
  const p={id:`underworld:${ox}:${oy}:${local.length}`,kind,x,y:y-size*.19,rootY:y,size,procedural:true,realm:true,underworldDressing:true,...extra};props.push(p);local.push(p);return p;
 };
 // Migrate older running expeditions additively; new authored layouts opt out.
 for(const [kind,x,y,size]of [['underworld_gate',820,415,320],['underworld_ribs',800,640,190],['underworld_ribs',800,1080,190]])if(!local.some(p=>p.kind===kind&&Math.hypot(p.x-ox-x,(p.rootY??p.y)-oy-y)<80))add(kind,x,y,size);
 for(const [i,p]of [[635,665],[965,665],[635,955],[965,955],[765,560],[865,1040],[740,455],[915,450],[345,480],[1250,1180],[300,1180],[1290,430]].entries())add('soul_candles',p[0],p[1],38+i%3*4,{candleHue:i%2?'purple':'pink'});
 // Each outer chamber receives a composed ruin group rather than uniform scatter.
 for(let i=1;i<(state.chambers||[]).length&&local.length<cap-8;i++){
  const room=state.chambers[i];let anchor=null;
  for(let n=0;n<20;n++){const a=n*2.39996+i*.8,x=room.x-ox+Math.cos(a)*room.r*.52,y=room.y-oy+Math.sin(a)*room.r*.45;
   if(tile(x+ox,y+oy)==='shadow_soil'&&local.every(p=>Math.hypot(p.x-ox-x,(p.rootY??p.y)-oy-y)>62)){anchor={x,y};break;}}
  if(!anchor)continue;const {x,y}=anchor;
  add('underworld_columns',x,y,132+Math.round(hash(seed,i)*28));
  add('soul_candles',x-37,y+24,40,{candleHue:i%2?'pink':'purple'});
  add(i%2?'underworld_bones':'underworld_urn',x+37,y+18,i%2?45:44);
  add('underworld_rubble',x+12,y+44,48);
 }
 // Tall, dim background masses are rooted in the inaccessible outer chasm.
 for(const [x,y]of [[48,310],[1450,170],[48,970],[1530,910],[180,1510],[1380,1510]])add('underworld_buttress',x,y,235+Math.round(hash(x+seed,y)*45),{distant:true});
 state.underworldDressingVersion=UNDERWORLD_DRESSING_VERSION;dressShadowForest(g,terrainAt);return props.length-start;
}
