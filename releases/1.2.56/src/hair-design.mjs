// Native hair contract v1. Coordinates are skull-local world pixels, rendered
// on a half-pixel grid. No generated wigs, per-strand noise, or baked actors.
export const HAIR_DESIGN_REVISION=2;
import {drawNativeHair as drawApprovedHair} from './hero-approved-art.mjs';
// Hood openings rise above the ordinary hat band in side/diagonal views.
// Keep hair behind that opening; equipment is drawn afterward over the crown.
import {hoodOpening} from './resolved-headwear.mjs';
export function coveredHairOpening(def={},direction=0){
 return ['hood','warlock','ghost','reaper','banshee'].includes(def.style)?hoodOpening(direction):[];
}
export const FACIAL_HAIR_STYLES={none:'Clean shaven',stubble:'Stubble',moustache:'Moustache',goatee:'Goatee',shortbeard:'Short beard',fullbeard:'Full beard',sideburns:'Sideburns'};
// Every style uses the same crown / fringe / temples / nape / accessory grammar.
export const HAIR_RECIPES={
 crop:{fringe:'swept',length:1,volume:0},bob:{fringe:'blunt',length:5,volume:0},
 long:{fringe:'swept',length:10,volume:0},ponytail:{fringe:'swept',length:1,tail:'single',volume:0},
 mohawk:{fringe:'open',length:0,crest:true,volume:-1},curls:{fringe:'curled',length:3,volume:1},
 sidepart:{fringe:'swept',length:1,volume:.25,partLine:true},undercut:{fringe:'swept',length:0,volume:-1},
 pixie:{fringe:'short',length:1,volume:-.5},waves:{fringe:'swept',length:8,volume:.5},
 afro:{fringe:'curled',length:3,volume:2},braids:{fringe:'open',length:1,tail:'braid',volume:0},
 locs:{fringe:'locks',length:7,volume:.5},topknot:{fringe:'open',length:0,tail:'bun',volume:0},
 twinbraids:{fringe:'short',length:1,tail:'twins',volume:0},sideponytail:{fringe:'swept',length:1,tail:'side',volume:0},
 shag:{fringe:'locks',length:4,volume:.5},spikes:{fringe:'short',length:1,crest:true,volume:.5},
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function hairPalette(color='#593923'){
 const rgb=/^#[\da-f]{6}$/i.test(color)?color.slice(1).match(/../g).map(n=>parseInt(n,16)):[89,57,35];
 const hex=v=>'#'+v.map(n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0')).join('');
 return {ink:hex(rgb.map((n,i)=>n*.38+[12,6,7][i])),shade:hex(rgb.map(n=>n*.68)),base:hex(rgb),light:hex(rgb.map((n,i)=>n*.85+[44,33,23][i]))};
}
export function resolveHairDesign(look={}){
 const recipe=HAIR_RECIPES[look?.hair];if(!recipe)return null;
 const edit=look.hairDesign||{};
 return {...recipe,volume:clamp(Number.isFinite(edit.volume)?edit.volume:recipe.volume,-1,2),
  length:clamp(Number.isFinite(edit.length)?edit.length:recipe.length,0,12),
  fringe:['swept','blunt','open','short','curled','locks'].includes(edit.fringe)?edit.fringe:recipe.fringe,
  part:edit.part==='right'?1:-1};
}
// Stable part IDs are also available to the sprite editor via renderLayers.
export const HAIR_PARTS=['nape','accessory','crown','temples','fringe'];
export function hairShapes(look,d,frame=0,action='idle',layer='all'){
 const r=resolveHairDesign(look);if(!r)return [];
 const back=d>=3&&d<=5,profile=d===2||d===6,diagonal=[1,3,5,7].includes(d),turn=d===0||d===4?0:d<4?-1:1;
 const width=5.7+r.volume*.55,top=-7.4-r.volume*.4;
 const pieces=[];
 const add=(id,points,tone)=>pieces.push({id,points,tone});
 const poly=(id,p,tone='base')=>add(id,p,tone);
 const sweep=['idle','sleep','death'].includes(action)?0:Math.round(Math.sin(frame*.7)*2)/2;
 const rearX=profile?-turn*4:diagonal?-turn*2:0;
 if(layer!=='front'){
  if(r.length>1){
   poly('nape',[[-width+.5,-3],[width-.5,-3],[width+.5,r.length-1],[width-1,r.length+1],[1,r.length],[-width+.5,r.length+1]],'ink');
   poly('nape',[[-width+1,-3],[width-1,-3],[width-.5,r.length-1],[width-1.5,r.length],[0,r.length-.5],[-width+1,r.length]],'shade');
   poly('nape',[[-width+1,-3],[-1,-3],[-1+sweep*.3,r.length-1],[-width+1.5,r.length-.5]],'base');
  }
  const tail=(x,braid=false)=>{
   poly('accessory',[[x-1.5,-5],[x+2,-4],[x+3+sweep,2],[x+1+sweep,10],[x-1+sweep,11],[x-1,4],[x-2,-1]],'ink');
   poly('accessory',[[x-1,-4],[x+1.5,-3],[x+2+sweep,2],[x+.5+sweep,9],[x-.5+sweep,10],[x-.5,3]],'base');
   poly('accessory',[[x-.5,-2],[x+.5,0],[x+1+sweep,5],[x+sweep,8],[x-.5,4]],'light');
   if(braid)for(let y=1;y<9;y+=2)poly('accessory',[[x-1+sweep*.5,y],[x+2+sweep*.5,y+1],[x+1+sweep*.5,y+1.5],[x-1+sweep*.5,y+.5]],'shade');
  };
  if(['single','braid','side'].includes(r.tail))tail(rearX+(r.tail==='side'?r.part*5:profile?0:back?0:4),r.tail==='braid');
  if(r.tail==='twins'){tail(rearX-4,true);tail(rearX+4,true);}
  if(r.tail==='bun'){
   poly('accessory',[[rearX-2,-7],[rearX-2,-10],[rearX-1,-11],[rearX+2,-11],[rearX+3,-9],[rearX+2,-7]],'ink');
   poly('accessory',[[rearX-1.5,-7.5],[rearX-1.5,-10],[rearX+1,-10.5],[rearX+2,-9],[rearX+1.5,-7.5]],'base');
  }
 }
 if(layer==='rear')return pieces;
 const w=profile?width*.92:width;
 // A stepped dome follows the cranium; the temples tuck in instead of
 // carrying a square helmet edge down to the cheek.
 const crown=[[-w+1,-1],[-w,-2],[-w,-4],[-w+1,-5],[-w+1.5,-6],[-w+3,top+.7],[-2,top+.2],[-.7,top-.4],[1,top],[w-2.5,top+.6],[w-1,-5.5],[w-.6,-4.5],[w,-3.2],[w-.7,-2],[w-1.2,-.5],[w-2,-1.8],[1,-2.4],[-1,-2],[-3,-1.2]];
 poly('crown',crown,'ink');
 poly('crown',[[-w+.5,-4],[-w+1.5,-5.2],[-w+3,top+1],[0,top+.7],[w-2.5,top+1],[w-1,-4.5],[w-1.8,-2.4],[1,-2.8],[-2,-2.3],[-w+.5,-2]],'base');
 // Two broad planes describe light and shadow without stripe-like bands.
 poly('crown',[[-w+1,-4.7],[-w+2.5,top+1],[-1,top+.8],[.2,-4.8],[-2,-4.4],[-3.5,-3.4],[-w+1,-3.4]],'light');
 if(r.crest){
  const offset=look.hair==='mohawk'?0:-2;
  poly('crown',[[offset-2,-6],[offset-2,-9],[offset-.5,-9],[offset,-11],[offset+1,-8],[offset+3,-9],[offset+2,-6]],'ink');
  poly('crown',[[offset-1.5,-6],[offset-1.5,-8.5],[offset,-8.5],[offset,-9],[offset+.5,-7],[offset+2,-8],[offset+1.5,-6]],'base');
 }
 if(back){
  // Rear diagonals retain a visible temple on the near side, not a mirrored front.
  const bottom=Math.max(1,r.length),shift=diagonal?-turn:0;
  poly('nape',[[-w+.5,-3],[w-.5,-3],[w-.5,bottom-2],[w-1.5,bottom],[w-2.5,bottom-.5],[1.5,bottom+.5],[shift,bottom-.5],[-1,bottom+.5],[-3,bottom-1],[-w+1,bottom]],'base');
  poly('nape',[[-w+1,-3],[-2,-4],[-1,-2],[-2,Math.min(3,bottom-2)],[-3,Math.min(4,bottom-1)],[-w+1.5,Math.min(2,bottom-1.5)]],'light');
  poly('nape',[[1,-3],[w-1,-3],[w-1,bottom-2],[2,bottom-1],[2.5,0]],'shade');
 }else{
  const side=profile?-turn:1;
  if(profile&&r.length<=1){
   // Short profile cuts stop above the ear instead of forming a square flap.
   poly('temples',[[side*(w-1.8),-3],[side*w,-3],[side*(w-.7),-.7],[side*(w-1.1),.5],[side*(w-2),.8],[side*(w-1.6),-.5]],'shade');
  }else{
   const end=Math.min(4,r.length+1);
   poly('temples',[[side*(w-1.5),-3],[side*w,-3],[side*w,end],[side*(w-1),end+1.5],[side*(w-1.5),0]],'shade');
  }
  if(!profile)poly('temples',[[-w,-3],[-w+1.5,-3],[-w+1.5,0],[-w+1,2],[-w,1]],'base');
  if(r.fringe!=='open'){
   const s=r.part*(d>=4?-1:1),mirror=p=>p.map(([x,y])=>[x*s,y]);
   const end=r.fringe==='short'?-3.7:r.fringe==='blunt'?-2.9:-2;
   poly('fringe',mirror([[-w+.5,-4.7],[-1,-5.4],[w-2,-4.3],[w-2,-3.2],[1.6,-3.2],[-.2,-2.7],[-2,end],[-4,end+.6],[-4,-1.8],[-w+.5,-2.5]]),'ink');
   // One broad swept plane gives the bangs direction without parallel bands.
   poly('fringe',mirror([[-w+1,-4.1],[-1,-4.9],[w-2.5,-4.1],[w-2,-3.4],[1.2,-3.4],[-.4,-2.9],[-2.2,end-.5],[-3.4,end],[-3.5,-2.3],[-w+1,-3]]),'base');
  }
 }
 if(r.fringe==='curled'||r.fringe==='locks'){
  // Three large clusters, never a field of individual bright strands.
  for(const x of [-w+.5,-1,w-2]){
   const y=back?-3:-5;
   poly('crown',[[x,y],[x+1,y-1],[x+2.5,y-.5],[x+3,y+1],[x+2,y+2],[x+.5,y+1.5]],'shade');
   poly('crown',[[x+.5,y],[x+1.5,y-.5],[x+2.5,y],[x+2,y+.5],[x+.5,y+.5]],'base');
  }
 }
 return pieces;
}
function polygon(c,h,points,color,scale=1){
 const p=points.map(([x,y])=>[Math.round(x*scale*2),Math.round(y*scale*2)]);
 const minY=Math.min(...p.map(v=>v[1])),maxY=Math.max(...p.map(v=>v[1]));c.fillStyle=color;
 for(let y=minY;y<maxY;y++){
  const xs=[];
  for(let i=0,j=p.length-1;i<p.length;j=i++){
   const a=p[j],b=p[i],scan=y+.5;if((a[1]>scan)!==(b[1]>scan))xs.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2)c.fillRect(Math.round(h.x*2)/2+Math.ceil(xs[i])*.5,Math.round(h.y*2)/2+y*.5,Math.max(.5,(Math.ceil(xs[i+1])-Math.ceil(xs[i]))*.5),.5);
 }
}
export function drawNativeHair(c,h,look,d,frame=0,action='idle',layer='all',scale=1){
 if(c.drawImage&&typeof document!=='undefined'&&!c.__legacyHumanoid&&!Object.keys(look?.hairDesign||{}).length){
  c.save();c.translate(h.x,h.y);c.scale(scale,scale);c.translate(-h.x,-h.y);
  try{
   if(layer==='all')drawApprovedHair(c,h,look,d,frame,action,'rear');
   return drawApprovedHair(c,h,look,d,frame,action,layer==='rear'?'rear':'front');
  }finally{c.restore();}
 }
 const p=hairPalette(look?.hairColor);for(const shape of hairShapes(look,d,frame,action,layer))polygon(c,h,shape.points,p[shape.tone],scale);
 return true;
}
export function facialHairStyle(look={}){
 if(Object.hasOwn(FACIAL_HAIR_STYLES,look.facialHair))return look.facialHair;
 return {beard:'fullbeard',alan:'fullbeard',goatee:'goatee',stubble:'stubble'}[look.face]||'none';
}
export function drawFacialHair(c,h,look,d,scale=1){
 const style=facialHairStyle(look);if(style==='none'||d>=3&&d<=5)return;
 const p=hairPalette(look.facialHairColor||look.hairColor),profile=d===2||d===6,turn=d<4?-1:1;
 const shape=(pts,tone='base')=>polygon(c,h,pts.map(([x,y])=>[x+(profile?turn*.7:0),y]),p[tone],scale);
 if(['moustache','goatee','shortbeard','fullbeard'].includes(style)){
  shape([[-2.5,1.6],[-.5,1.2],[0,1.7],[.5,1.2],[2.5,1.6],[3,2.7],[1,2.5],[0,2],[-1,2.5],[-3,2.7]],'shade');
 }
 if(style==='sideburns'||style==='shortbeard'||style==='fullbeard')for(const s of [-1,1])shape([[s*4.5,-.2],[s*3.5,.2],[s*3.5,3.5],[s*4.5,3]],'shade');
 if(['shortbeard','fullbeard','goatee'].includes(style)){
  const w=style==='goatee'?1.6:3.8,b=style==='fullbeard'?7:5;
  shape([[-w,2.6],[-1,3],[0,3.6],[1,3],[w,2.6],[w-.5,4.5],[1,b],[-1,b],[-w+.5,4.5]],'ink');
  shape([[-w+.5,3],[-1,3.6],[1,3.6],[w-.5,3],[w-1,4.5],[.5,b-.5],[-.5,b-.5],[-w+1,4.5]],'base');
  shape([[-w+.7,3.5],[-1,4],[-.5,b-1],[-1,b-1],[-w+1,4.5]],'light');
 }
 if(style==='stubble')for(const [x,y]of [[-3,2],[-2,3],[-1,4],[1,4],[2,3],[3,2]])shape([[x,y],[x+.5,y],[x+.5,y+.5],[x,y+.5]],'shade');
}
