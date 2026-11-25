// Basalt and worn ash, sampled in world space on the 2-unit ground raster.
const CELL=56, STRETCH=1.55;
const clamp=value=>Math.min(1,Math.max(0,value));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

function hash(x,y,seed){
  let h=Math.imul(x,0x1f123bb5)^Math.imul(y,0x29490d79)^Math.imul(seed,0x6b36ff61);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

function field(x,y,seed){
  const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);
  return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),
    mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v);
}

function segment(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  return {x:a.x,y:a.y,dx,dy,length:length||1};
}

function segmentDistanceSquared(x,y,line){
  const dx=x-line.x,dy=y-line.y,t=clamp((dx*line.dx+dy*line.dy)/line.length);
  return (dx-t*line.dx)**2+(dy-t*line.dy)**2;
}

const layouts=new WeakMap();
let nextLayout=0;
const reaches=(x,y,ox,oy,width,pad)=>x>=ox-pad&&x<=ox+width+pad&&y>=oy-pad&&y<=oy+width+pad;
function layoutRevision(state){
  const {originX,originY,links,chambers,enchantedPaths,enchantedExit}=state;
  const x=enchantedExit?.x,y=enchantedExit?.y,cached=layouts.get(state);
  if(cached&&cached.originX===originX&&cached.originY===originY&&cached.links===links&&
    cached.chambers===chambers&&cached.enchantedPaths===enchantedPaths&&cached.x===x&&cached.y===y)return cached.id;
  const id=++nextLayout;
  layouts.set(state,{id,originX,originY,links,chambers,enchantedPaths,x,y});
  return id;
}

function shallowBasin(at,x,y){return at(Math.floor((x+1240)/32),Math.floor((y+440)/32))==='shallow';}

// Streamed maps can call for a single tile repeatedly. Cache hits check
// layout references and the nearby live-water source without rebuilding paths.
export function shadowFloorContextKey(states,ox,oy,width,at){
  let key='';
  for(const state of states){
    const x=state.originX||0,y=state.originY||0;
    if(!reaches(x+800,y+800,ox,oy,width,990))continue;
    key+=layoutRevision(state)+';';
    if(reaches(x+1240,y+452,ox,oy,width,206)){
      key+=shallowBasin(at,x,y)?'wet;':'dry;';
    }
  }
  return key;
}

// Only geometry close to the cache chunk can affect its material.
export function shadowFloorContext(states,ox,oy,width,at){
  const near=(x,y,pad)=>reaches(x,y,ox,oy,width,pad);
  const paths=[],landmarks=[];
  for(const state of states){
    const x=state.originX||0,y=state.originY||0;
    if(!near(x+800,y+800,990))continue;
    const pathsFromLayout=(state.links||[]).map(([a,b])=>[state.chambers?.[a],state.chambers?.[b]]);
    for(const [a,b] of [...pathsFromLayout,...(state.enchantedPaths||[])]){
      if(!a||!b||Math.max(a.x,b.x)<ox-72||Math.min(a.x,b.x)>ox+width+72||
        Math.max(a.y,b.y)<oy-72||Math.min(a.y,b.y)>oy+width+72)continue;
      paths.push(segment(a,b));
    }
    if(near(x+800,y+816,202))landmarks.push({type:'court',x:x+800,y:y+816,rx:198,ry:156});
    if(near(x+1240,y+452,206)&&shallowBasin(at,x,y)){
      landmarks.push({type:'basin',x:x+1240,y:y+452,rx:204,ry:170});
    }
    const exit=state.enchantedExit;
    if(exit&&near(exit.x,exit.y,74))landmarks.push({type:'exit',x:exit.x,y:exit.y,rx:72,ry:58});
  }
  return {paths,landmarks};
}

function exposure(x,y,{paths,landmarks}){
  let distance=72**2;
  for(const line of paths)distance=Math.min(distance,segmentDistanceSquared(x,y,line));
  const wear=1-smooth((Math.sqrt(distance)-17)/41);
  let court=0,basin=0,exit=0;
  for(const light of landmarks){
    const r=((x-light.x)/light.rx)**2+((y-light.y)/light.ry)**2;
    if(light.type==='court')court=Math.max(court,1-smooth((r-.32)/.68));
    else if(light.type==='basin')basin=Math.max(basin,1-smooth(r));
    else exit=Math.max(exit,1-smooth(r));
  }
  return {wear,court,basin,exit};
}

function rockCells(ox,oy,widthInWorld,heightInWorld,seed){
  const x0=Math.floor((ox-12)/CELL)-1,y0=Math.floor((oy*STRETCH-12)/CELL)-1;
  const x1=Math.floor((ox+widthInWorld+12)/CELL)+1,y1=Math.floor(((oy+heightInWorld)*STRETCH+12)/CELL)+1;
  const width=x1-x0+1,cells=[];
  for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){
    cells.push({
      x:(i+.5+(hash(i,j,seed)-.5)*.54)*CELL,
      y:(j+.5+(hash(i,j,seed+29)-.5)*.64)*CELL,
      tint:hash(i,j,seed+51)-.5,
      cut:hash(i,j,seed+123),
      slip:hash(i,j,seed+173),
    });
  }
  return {x0,y0,width,cells};
}

function stone(x,y,seed,{x0,y0,width,cells}){
  const px=x+(field(x/44,y/34,seed+20)-.5)*24;
  const py=y*STRETCH+(field(x/51,y/43,seed+40)-.5)*24;
  const i=Math.floor(px/CELL)-x0,j=Math.floor(py/CELL)-y0;
  let nearest,next,d1=Infinity,d2=Infinity;
  for(let row=j-1;row<=j+1;row++)for(let col=i-1;col<=i+1;col++){
    const s=cells[row*width+col],d=(px-s.x)**2+(py-s.y)**2;
    if(d<d1){next=nearest;d2=d1;nearest=s;d1=d;}
    else if(d<d2){next=s;d2=d;}
  }
  const dx=next.x-nearest.x,dy=next.y-nearest.y;
  const joint=(d2-d1)/(2*Math.sqrt(dx*dx+dy*dy));
  const sx=px-nearest.x,sy=py-nearest.y;
  // Neighbor normals distinguish a shallow top lip from the shaded side.
  return {joint,upper:dx*.35+dy*.8<0,sx,sy,tint:nearest.tint,cut:nearest.cut,slip:nearest.slip};
}

function stoneShade(s,x,y,open,patina){
  const {joint,upper,sx,sy,cut,slip}=s;
  const bevel=2.5+cut*3.5;
  const bed=sy+sx*(slip-.5)*.9;
  let value=s.tint*16;
  if(joint<1.7+cut*1.25)value-=13;
  else if(joint<bevel)value+=upper?10:-5;
  else if(bed<-8&&cut>.23)value+=6;
  else if(sy-sx*.24>15&&cut<.65)value-=5;
  // Short split planes and groups of chips stay close to a fault.
  if(cut>.48&&sy>4&&sy<23&&joint<17){
    const offset=sx+sy*(slip-.45)*1.8-10-(sy>14?4:0);
    if(Math.abs(offset)<1.7)value-=11;
    else if(offset>1.7&&offset<4.2&&sy<18)value+=5;
  }
  if(joint>5&&joint<16&&slip>.59&&patina>.47){
    const chip=(x+Math.floor(y*.125)*5)&15;
    if((y&7)===2&&chip>=2&&chip<=6)value+=6;
    else if((y&7)===4&&chip>=4&&chip<=8)value-=4;
  }
  return value*open;
}

function paving(x,y,seed,patina){
  // Sett remnants along the board clearing, distorted by wear and settled ash.
  const row=Math.floor(y/16),localY=y-row*16;
  const shiftedX=x+(row%2)*14+Math.floor(hash(row,9,seed+147)*8),cell=Math.floor(shiftedX/28);
  const shape=hash(cell,row,seed+57);
  if(shape<.28||patina<.33)return 0;
  const left=2+Math.floor(shape*4),right=26-Math.floor(shape*5);
  const localX=shiftedX-cell*28;
  if(localX<left+Math.max(0,4-localY)||localX>=right-Math.max(0,localY-10)||
    localY<2||localY>=14)return 0;
  if(localY===2)return 12;
  if(localY===12||localX>=right-2)return -9;
  return 2+(shape-.35)*10;
}

export function paintShadowFloor(image,ox,oy,at,seed,context,materialX=0,materialY=0){
  const {data,width,height}=image;
  const grid=rockCells(ox+materialX,oy+materialY,width*2,height*2,seed);
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const lx=ox+px*2,ly=oy+py*2;
    if(at(Math.floor(lx/32),Math.floor(ly/32))!=='shadow_soil')continue;
    const {wear,court,basin,exit}=exposure(lx,ly,context);
    const x=lx+materialX,y=ly+materialY;
    const wash=field(x/236,y/190,seed+97)-.5;
    const patina=field(x/28,y/24,seed+133);
    const band=field((x+y*.25)/98,y/62,seed+80);
    const open=(.52+.48*smooth((band-.29)/.43))*(1-wear*.72)*(1-exit*.79)*(1-court*.74);
    const stoneFace=stone(x,y,seed,grid);
    const rock=stoneShade(stoneFace,x,y,open,patina);
    const sett=court>.04?paving(x,y,seed,patina)*court:0;
    const dust=Math.round((patina-.5)*3)*2;
    const value=Math.round(rock+sett+dust+wash*15+(band-.5)*7);
    const mineral=Math.round(stoneFace.tint*9*open);
    const offset=(py*width+px)*4;
    data[offset]=51+value-mineral*.5+wear*8+court*6+exit*6+basin*4;
    data[offset+1]=57+value-mineral+wear*7+court*8+exit*2+basin*15;
    data[offset+2]=73+value+mineral+wear*8+court*9+exit*11+basin*25;
    data[offset+3]=255;
  }
}
