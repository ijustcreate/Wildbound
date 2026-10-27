import {vegetationBlocked} from './house-surfaces.mjs';
import {forestHash,forestNoise,routeDistance,clearingDistance} from './forest-landscape.mjs';
import {nearbyScenery} from './performance.mjs';
import {spawnParticleEffect} from './particles.mjs';
export function grassRootBurned(p,x,y){return (p.grassBurnMarks||[]).some(m=>Math.hypot(x-m.x,y-m.y)<m.radius);}
export function drawGrassBurnMarks(c,p){
 for(const m of p.grassBurnMarks||[])for(let i=0;i<12;i++){
  const angle=forestHash(i,m.x+m.y)*Math.PI*2,r=Math.sqrt(forestHash(m.y,i))*m.radius;
  c.fillStyle=i%3?'#393b2bee':'#17251eaa';c.fillRect(Math.round(m.x+Math.cos(angle)*r),Math.round(m.y+Math.sin(angle)*r*.7),2+i%2,1+i%2);
 }
}

const grassKinds=new Set(['tall_grass','short_grass']);
const palettes={
 forest:['#304b32','#426443','#63804a','#91a857'],
 house:['#36543a','#4f7242','#78934d','#a8b36c'],
 temple:['#264b36','#39734a','#5b9454','#9daf5a'],
 autumn:['#4b4930','#72633b','#a17a42','#c29a52'],
};
const hexRgb=value=>{
 const match=/^#?([\da-f]{6})$/i.exec(String(value||''));
 return match?match[1].match(/../g).map(x=>parseInt(x,16)):null;
};
const rgbHex=rgb=>'#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const tint=(base,over,amount)=>rgbHex(base.map((v,i)=>v*(1-amount)+over[i]*amount));
const shade=(base,mult)=>rgbHex(base.map(v=>v*mult));

export function grassPalette(prop={},environment='forest'){
 const palette=palettes[prop.grassPalette]||palettes[environment]||palettes.forest;
 const override=hexRgb(prop.grassTint),amount=override?.[0]===undefined?0:.26;
 const light=Math.max(.55,Math.min(1.35,Number(prop.grassShade)||1));
 return palette.map((color,i)=>{
  const c=hexRgb(color),mixed=override?hexRgb(tint(c,override,amount)):c;
  return shade(mixed,light*(i===0?.86:1));
 });
}

const grassProp=(id,x,y,size,kind,extra={})=>({
 id,kind,x,y:y-size*.4,rootY:y,size,procedural:true,grassShade:.9+forestHash(x,y)*.22,
 grassTint:extra.grassTint||null,grassPalette:extra.grassPalette||'forest',...extra,
});

export function createForestTallGrass(seed,terrain,plan,scenery=[]){
 const result=[];
 // Overlapping field patches, not isolated lawn tufts. The renderer already
 // culls each patch against the camera, so a denser forest does not draw the
 // distant world every frame.
 for(let gy=42;gy<1550;gy+=48)for(let gx=42;gx<1550;gx+=48){
  const x=gx+(forestHash(gx+seed,gy)-.5)*24,y=gy+(forestHash(gy+seed,gx)-.5)*24;
  const tx=Math.floor(x/32),ty=Math.floor(y/32),r=forestHash(gx+seed*3,gy+7);
  if(terrain[ty*50+tx]!=='grass'||routeDistance(plan,x,y)<68||clearingDistance(x,y,seed)<1.02)continue;
  if(scenery.some(p=>p.kind==='forest_ruin'&&Math.abs(x-p.x)<p.width*.5+22&&Math.abs(y-p.y)<p.depth+18))continue;
  const density=forestNoise(x/145,y/145,seed+71);
  if(r>.30+density*.24)continue;
  result.push(grassProp(`tallgrass:${gx}:${gy}`,x,y,72+forestHash(gy,gx+seed)*20,'tall_grass',{
   grassShade:.72+density*.44,grassPalette:density>.7?'temple':density<.25?'autumn':'forest',
   tuftSeed:Math.floor(forestHash(gx,gy+seed)*0x7fffffff),
  }));
 }
 return result;
}

export function createHouseShortGrass(seed,terrain,house){
 const result=[];
 for(let y=48;y<1552;y+=64)for(let x=48;x<1552;x+=64){
  const px=x+(forestHash(x+seed,y)-.5)*26,py=y+(forestHash(y+seed,x)-.5)*26;
  const tx=Math.floor(px/32),ty=Math.floor(py/32),tile=terrain[ty*50+tx];
  if(tile!=='grass'||vegetationBlocked({house},px,py,14)||house.floors.some(r=>px>=r.x-14&&px<r.x+r.w+14&&py>=r.y-14&&py<r.y+r.h+14)||
     house.paths.some(r=>px>=r.x-8&&px<r.x+r.w+8&&py>=r.y-8&&py<r.y+r.h+8)||
     house.pools.some(r=>px>=r.x-8&&px<r.x+r.w+8&&py>=r.y-8&&py<r.y+r.h+8)||
     house.trees.some(t=>Math.hypot(px-t.x,py-t.y)<t.size*.48))continue;
  const roll=forestHash(x+seed*5,y+seed*3);if(roll>.48)continue;
  result.push(grassProp(`yardgrass:${x}:${y}`,px,py,26+roll*10,'short_grass',{
   grassPalette:'house',grassShade:.84+forestHash(y,x+seed)*.28,
  }));
 }
 return result;
}

function playerBend(p,game){
 let x=0,y=0;
 for(const a of game?.players||[]){
  if(a.hp<=0||a.room||a.swimming||a.jumpHeight>8)continue;
  const dx=p.x-a.x,dy=(p.rootY??p.y+p.size*.4)-(a.y+1),d=Math.hypot(dx,dy);
  if(d>104||d<1)continue;
  const amount=(1-d/104)**2*(a.moving?1.25:.75);
  x+=dx/d*amount;y+=dy/d*amount;
 }
 return{x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};
}

function drawGrassTuft(c,p,time,short,palette,game){
 if(p.cut&&!p.charred)return;
 drawGrassBurnMarks(c,p);
 const seed=Number.isFinite(p.tuftSeed)?p.tuftSeed:Math.floor(forestHash(p.x,p.y)*0x7fffffff);
 const root=p.rootY??p.y+p.size*.4,scale=p.size/(short?32:80);
 const tick=Math.floor(time*8),phase=forestHash(seed,19)*Math.PI*2;
 const wind=(Math.sin(tick*.16+p.x*.009+p.y*.004+phase)+Math.sin(tick*.095-p.x*.003+p.y*.008+phase*1.618))*.5;
 const bend=playerBend(p,game);
 c.save();c.translate(Math.round(p.x),Math.round(root));c.scale(scale,scale);
 if(p.charred){
  c.fillStyle='#433d32';
  for(let i=0;i<24;i++){const ox=Math.floor(forestHash(seed,i)*72)-36;c.fillRect(ox,Math.floor(forestHash(i,seed)*7),2+Math.floor(forestHash(i+1,seed)*5),1+Math.floor(forestHash(seed+3,i)*2));}
  if(p.grassSizzle>0){for(let i=0;i<3;i++){const rise=(1-p.grassSizzle/.72)*9+i*2;c.fillStyle=i%2?'#ffab45':'#ffe08b';c.fillRect(-5+i*5+Math.floor(Math.sin(time*27+i+seed)*2),-rise,2,2);}}
  c.restore();return;
 }
 if(!short){
  // A chunky dark-green root mass joins individual blades into the dense
  // Wigg-inspired carpet, while preserving the original game's pixel edges.
  c.fillStyle=palette[0];
  for(let i=0;i<15;i++){const x=Math.floor(forestHash(seed+41,i)*70)-35,y=Math.floor(forestHash(i+7,seed)*5);c.fillRect(x,y,4+Math.floor(forestHash(seed,i+17)*8),3);}
 }
 const blades=short?7:76;
 for(let i=0;i<blades;i++){
  const u=forestHash(seed,i),center=Math.round((u-.5)*(short?27:72));
  if(grassRootBurned(p,p.x+center*scale,root))continue;
  const h=short?4+Math.floor(forestHash(i,seed)*5):16+Math.floor(forestHash(seed,i+91)*25);
  const width=short?1+Math.floor(forestHash(seed+4,i)*2):2+Math.floor(forestHash(i+9,seed)*3);
  const sway=short?0:Math.round(wind*(1.4+u*3)+bend.x*4),shadeIndex=Math.min(3,Math.floor(forestHash(Math.floor(i/5),seed+31)*4));
  const top=palette[Math.min(3,shadeIndex+(u>.52?1:0))],middle=palette[Math.min(3,shadeIndex+1)];
  c.fillStyle=palette[shadeIndex];
  if(short){c.fillRect(center,0,width,Math.max(2,Math.floor(h*.65)));c.fillRect(center+sway,-Math.ceil(h*.38),width,h-Math.floor(h*.65));if(i%3===0){c.fillStyle=palette[3];c.fillRect(center+sway,-h,width,2);}}
  else{
   // Short horizontal pixel steps make broad tapered blades, like chunky
   // low-poly grass translated into the game's native 2D pixel language.
   const steps=Math.ceil(h/3),lean=Math.round(bend.y*1.5);
   for(let s=0;s<steps;s++){
    const t=s/steps,px=Math.round(center+(sway+lean)*t),py=-s*3;
    c.fillStyle=t>.62?top:t>.28?middle:palette[shadeIndex];
    c.fillRect(px,py,Math.max(1,width+(s<2?1:0)-(s>steps-2?1:0)),3);
   }
   c.fillStyle=palette[0];c.fillRect(center-1,0,width+2,2);
   if(i%4===0){c.fillStyle=top;c.fillRect(center+sway,-h-1,Math.max(1,width-1),2);}
  }
 }
 c.restore();
}

export function drawGrassProp(c,p,time,environment,game){
 if(!grassKinds.has(p.kind))return false;
 if(p.kind==='short_grass'||p.charred){
  drawGrassTuft(c,p,time,p.kind==='short_grass',grassPalette(p,environment),game);return true;
 }
 if(p.cut){drawGrassTuft(c,{...p,cut:false,rootY:p.rootY??p.y+p.size*.4,size:p.size*.45},time,true,grassPalette(p,environment),game);return true;}
 drawGrassBurnMarks(c,p);
 if(typeof document==='undefined'){
  c.save();c.translate(p.x,p.rootY??p.y+p.size*.4);c.scale(p.size/80,p.size/80);
  paintGrassPatch(c,p,grassPalette(p,environment));c.restore();return true;
 }
 const signature=[p.grassPalette,p.grassTint,p.grassShade,p.tuftSeed,environment,p.grassBurnRevision||0].join('|');
 let entry=grassSprites.get(p);
 if(!entry||entry.signature!==signature){
  const sprite=document.createElement('canvas');sprite.width=88;sprite.height=48;
  const pen=sprite.getContext('2d');pen.translate(44,40);
  paintGrassPatch(pen,p,grassPalette(p,environment));
  entry={sprite,signature};grassSprites.set(p,entry);
 }
 const root=p.rootY??p.y+p.size*.4,scale=p.size/80,bend=playerBend(p,game);
 const wind=Math.sin(Math.floor(time*8)*.18+p.x*.009+p.y*.004)*.025;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(p.x),Math.round(root));
 c.transform(scale,0,(wind+bend.x*.12)*scale,scale*(1-Math.abs(bend.y)*.12),0,0);
 c.drawImage(entry.sprite,-44,-40);c.restore();return true;
}

// One small raster per living prop, released with its world. Wind deforms the
// cached silhouette instead of regenerating hundreds of blade steps per frame.
const grassSprites=new WeakMap();
function paintGrassPatch(c,p,palette){
 const seed=p.tuftSeed??Math.floor(forestHash(p.x,p.y)*10000);
 // Broad curved leaves share an uneven root line. Tips turn outward and down,
 // giving a low meadow silhouette instead of a row of pointed reed spikes.
 for(let row=0;row<2;row++)for(let blade=0;blade<13;blade++){
  const n=row*13+blade,root=-30+blade*4.8+Math.floor(forestHash(seed,n)*3);
  const base=-3+row*6+Math.floor(forestHash(n,seed+9)*3);
  const scale=p.size/80;
  if(grassRootBurned(p,p.x+root*scale,(p.rootY??p.y+p.size*.4)+base*scale))continue;
  const height=8+Math.floor(forestHash(seed+4,n)*12);
  const lean=(blade%2?-1:1)*(5+forestHash(seed+13,n)*6);
  for(let step=0;step<16;step++){
   const t=step/15,x=Math.round(root+lean*t*t),y=Math.round(base-height*Math.sin(t*1.72));
   const width=step>12?1:step>7?2:3;
   c.fillStyle=palette[row===0?1:2];c.fillRect(x,y,width,2);
   if(row&&step>6&&step<11&&blade%3===0){c.fillStyle=palette[3];c.fillRect(x,y,1,2);}
  }
 }
}

export function burnTallGrass(p,time=.6,depth=0){
 if(!p||p.kind!=='tall_grass'||p.cut&&p.charred)return false;
 p.cut=true;p.charred=true;p.grassFire=Math.max(p.grassFire||0,time);p.grassSizzle=.72;
 p.grassSpreadIn=.14;p.grassSpreadDepth=Math.max(p.grassSpreadDepth||0,depth);p.grassSpreadDone=false;
 return true;
}

export function igniteTallGrassAt(g,x,y,{trail=false}={}){
 if(trail){
  let changed=false;
  for(const p of nearbyScenery(g.scenery||[],x,y,64)){
   if(p.kind!=='tall_grass'||p.charred)continue;
   const root=p.rootY??p.y+p.size*.4,s=p.size/80;
   if(((x-p.x)/Math.max(10,40*s))**2+((y-root)/Math.max(8,13*s))**2>1.25)continue;
   const marks=p.grassBurnMarks||=[];
   if(marks.some(m=>Math.hypot(m.x-x,m.y-y)<6)||marks.length>=16)continue;
   marks.push({x,y,radius:9});p.grassBurnRevision=(p.grassBurnRevision||0)+1;changed=true;
  }
  if(changed){spawnParticleEffect(g,'cinder-trail',x,y,Math.floor(x+y));g.grassBurnDirty=true;}
  return changed;
 }
 const target=nearbyScenery(g.scenery||[],x,y,64).filter(p=>p.kind==='tall_grass'&&!p.charred&&Math.hypot(p.x-x,(p.rootY??p.y+p.size*.4)-y)<Math.max(18,p.size*.55))
  .sort((a,b)=>Math.hypot(a.x-x,(a.rootY??a.y+a.size*.4)-y)-Math.hypot(b.x-x,(b.rootY??b.y+b.size*.4)-y))[0];
 const burned=burnTallGrass(target);if(burned)g.persist?.();return burned;
}

export function strikeTallGrass(g,p,range,{blade=false,fire=false}={}){
 const length=Math.hypot(p.faceX||0,p.faceY||0)||1,fx=(p.faceX||1)/length,fy=(p.faceY||0)/length;
 const target=nearbyScenery(g.scenery||[],p.x+fx*range*.5,p.y+fy*range*.5,range).filter(s=>s.kind==='tall_grass'&&!s.cut).map(s=>({s,y:s.rootY??s.y+s.size*.4}))
  .filter(({s,y})=>{const dx=s.x-p.x,dy=y-(p.y+14),d=Math.hypot(dx,dy);return d<range+14&&d>0&&(dx*fx+dy*fy)/(d)>=Math.cos(Math.PI/4);})
  .sort((a,b)=>Math.hypot(a.s.x-p.x,a.y-p.y)-Math.hypot(b.s.x-p.x,b.y-p.y))[0]?.s;
 if(!target)return false;
 if(fire){burnTallGrass(target);return true;}
 if(!blade)return false;
 target.cut=true;target.grassCutAt=g.time;
 g.environmentParticles||=[];
 for(let i=0;i<4;i++)g.environmentParticles.push({x:target.x+(forestHash(target.x+i,target.y)-.5)*14,y:(target.rootY??target.y)+forestHash(target.y,i)*5,life:.28,kind:'tall_grass'});
 return true;
}

export function tickTallGrass(g,dt){
 if(g.grassBurnDirty){g.grassBurnSaveIn=(g.grassBurnSaveIn||0)+dt;if(g.grassBurnSaveIn>=.3){g.grassBurnDirty=false;g.grassBurnSaveIn=0;g.persist?.();}}
 const patches=(g.scenery||[]).filter(p=>p.kind==='tall_grass'),active=patches.filter(p=>p.grassFire>0);let spread=false;
 for(const p of active){
  p.grassFire=Math.max(0,p.grassFire-dt);p.grassSizzle=Math.max(0,(p.grassSizzle||0)-dt);
  if(p.grassSpreadDone||p.grassSpreadDepth>=2)continue;
  p.grassSpreadIn=(p.grassSpreadIn??.14)-dt;if(p.grassSpreadIn>0)continue;
  p.grassSpreadDone=true;
  if(patches.filter(q=>q.grassFire>0).length>=12)continue;
  const root=p.rootY??p.y+p.size*.4;
  const next=nearbyScenery(g.scenery||[],p.x,root,70).filter(q=>q!==p&&q.kind==='tall_grass'&&!q.cut&&Math.hypot(q.x-p.x,(q.rootY??q.y+q.size*.4)-root)<64)
   .sort((a,b)=>forestHash(p.tuftSeed||p.x,a.x+a.y)-forestHash(p.tuftSeed||p.x,b.x+b.y))[0];
  if(next)spread=burnTallGrass(next,.5,(p.grassSpreadDepth||0)+1)||spread;
 }
 if(spread)g.persist?.();
}
