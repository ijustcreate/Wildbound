import {drawFriendshipHeart} from './friendship-hearts.mjs';
export const magicBoltGlow=def=>def?.friendship ? .04 : ({common:.055,rare:.11,unique:.16,legendary:.21,gm:.12}[def?.rarity]??.055);
export const MAGIC_TRAIL_LIMIT=48;
export const MAGIC_TRAIL_SECONDS=.42;
const RATE=72;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function hash(n){n=Math.imul(n^0x9e3779b9,0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return (n^(n>>>16))>>>0;}
function tint(color,amount){const n=parseInt(color.slice(1),16);if(!Number.isFinite(n))return color;return '#'+[n>>>16,(n>>>8)&255,n&255].map(v=>Math.round(v+(amount>0?(255-v)*amount:v*amount)).toString(16).padStart(2,'0')).join('');}
const palettes=new Map();
function palette(color){if(!palettes.has(color)){if(palettes.size>=32)palettes.delete(palettes.keys().next().value);palettes.set(color,{base:color,dark:tint(color,-.48),light:tint(color,.28)});}return palettes.get(color);}
// Reconstruct a bounded emission history from age + velocity. The particles
// have stable birth positions, disperse and shrink as they age, and require no
// persistent particle actors, allocations per mote, or frame-dependent RNG.
export function visitMagicTrail(bolt,visit){
 const age=Math.max(0,bolt.age??1),speed=Math.hypot(bolt.vx||0,bolt.vy||0),nx=speed?-(bolt.vy||0)/speed:0,ny=speed?(bolt.vx||0)/speed:1;
 const seed=bolt.visualSeed??((bolt.owner||0)*977+(bolt.slot==='hand2'?479:0)),last=Math.floor(age*RATE);let count=0;
 for(let i=0;i<Math.ceil(MAGIC_TRAIL_SECONDS*RATE)&&count<MAGIC_TRAIL_LIMIT;i++){
  const birth=(last-i)/RATE,elapsed=age-birth;if(birth<0||elapsed<=0||elapsed>MAGIC_TRAIL_SECONDS)continue;
  const random=hash((last-i)+seed),f=elapsed/MAGIC_TRAIL_SECONDS,spread=(bolt.friendship?3:6)*f;
  const drift=((random&255)/127.5-1)*spread,x=bolt.x-(bolt.vx||0)*elapsed+nx*drift,y=bolt.y-16-(bolt.vy||0)*elapsed+ny*drift;
  visit(x,y,f,random,false);count++;
  if((random&3)===0&&count<MAGIC_TRAIL_LIMIT){const extra=((random>>>8&255)/127.5-1)*(4+f*12);visit(x+nx*extra,y+ny*extra,f,random,true);count++;}
 }
 return count;
}
function pixel(c,x,y,size=2){const s=Math.max(1,Math.round(size));c.fillRect(Math.round(x/s)*s,Math.round(y/s)*s,s,s);}
// All shape edges are whole square pixels. No bloom texture, gradients,
// antialiased ellipses or additive blending can wash away the spell colour.
export function drawMagicBolt(ctx,bolt){
 const size=clamp(bolt.size||6,2,18),color=bolt.color||'#90baff',age=Math.max(0,bolt.age??1);
 const alpha=Math.min(1,Math.max(0,bolt.remaining??40)/40,Math.max(0,bolt.life??1)/.15);
 if(!alpha)return;
 const pal=palette(color),vx=bolt.vx||0,vy=bolt.vy||0,speed=Math.hypot(vx,vy)||1,dx=vx/speed,dy=vy/speed,x=bolt.x,y=bolt.y-16,unit=size>=12?3:2;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='source-over';
 const base=ctx.globalAlpha;
 visitMagicTrail(bolt,(px,py,f,random,extra)=>{
  ctx.globalAlpha=base*(1-f)**1.3*(extra?.7:.92);
  if(bolt.friendship&&!extra&&(random&7)===0){drawFriendshipHeart(ctx,px,py-f*5,Math.max(5,9-f*4));return;}
  ctx.fillStyle=extra?pal.light:(random&1)?pal.base:pal.dark;
  const scale=f>.7?1:unit;pixel(ctx,px,py,scale);
  if(!extra&&f<.5){pixel(ctx,px-dx*unit,py-dy*unit,scale);}
 });
 ctx.globalAlpha=base;
 if(bolt.friendship)drawFriendshipHeart(ctx,x,y,Math.max(11,Math.round(size*1.15)));
 else{
  const px=speed===1&&vx===0&&vy===0?1:dx,py=speed===1&&vx===0&&vy===0?0:dy;
  // Tapered coloured dart; ice uses a wider faceted crystal, fire a jagged tail.
  for(let row=-2;row<=2;row++)for(let col=-3;col<=2;col++){
   const width=bolt.ice?2:col===2?0:col===1?1:col===-3?0:2;
   if(Math.abs(row)>width)continue;
   ctx.fillStyle=Math.abs(row)===width&&col<1?pal.dark:row<0&&col===0?pal.light:pal.base;
   pixel(ctx,x+(px*col-py*row)*unit,y+(py*col+px*row)*unit,unit);
  }
  if(bolt.fire&&age>.02){ctx.fillStyle=pal.light;pixel(ctx,x-px*unit*4-py*unit,y-py*unit*4+px*unit,unit);}
  ctx.fillStyle=pal.base;pixel(ctx,x+px*unit*2,y+py*unit*2,unit);
 }
 ctx.restore();
}
