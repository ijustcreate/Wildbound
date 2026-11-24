import { drawCarverEyeParticles } from './bone-carver-art.mjs';
import { pixelLine, pixelPolygon } from './pixel-shapes.mjs';

const CROOKED_WOOD = { bark: '#a08a86', cyan: '#7ed7d4', amber: '#d8a14e', thread: '#183d41' };
const CARVED_BONE = { bone: '#c4ac8d', boneDark: '#81716e', boneLight: '#f0deba', mane: '#cbbfbb', maneDark: '#9c8b97', maneLight: '#efe5d0', stone: '#548d73', gemLight: '#a4cc9b' };
const FORGED_HORN = { horn: '#b7a582', hornLight: '#e1cf9c', hornDark: '#847775' };
const MOONLIGHT = { stone: '#c7d8ec', stoneDark: '#7a91b7', stoneLight: '#eff8ef', mount: '#5b4c77' };
const SUNLIGHT = { ember: '#b96b34', gold: '#e1ac56', goldLight: '#fbde8b' };
const IMP_BONE = { body: '#b39164', dark: '#815e49', light: '#e9d3a1', collar: '#8c493b' };
const SUCCUBUS_HORN = { body: '#963f59', dark: '#582b45', light: '#cf7181', collar: '#583344' };

const bands = [
  [[-6,-6],[-4,-5],[0,-4],[4,-5],[6,-6],[6,-4],[3,-3],[-3,-3],[-6,-4]],
  [[-6,-6],[-4,-5],[-1,-4],[3,-5],[5,-6],[6,-5],[4,-4],[-1,-3],[-5,-4]],
  [[-5,-5],[-2,-5],[2,-6],[5,-7],[5,-5],[1,-4],[-3,-3],[-5,-4]],
  [[-6,-5],[-2,-4],[3,-5],[5,-7],[6,-6],[5,-4],[-2,-3],[-6,-4]],
  [[-6,-5],[-4,-4],[0,-3],[4,-4],[6,-5],[6,-3],[3,-2],[-3,-2],[-6,-3]],
];

const faces = [
  [[-6,-4],[-7,-7],[-6,-10],[-4,-12],[3,-12],[6,-10],[7,-7],[6,-4]],
  [[-6,-4],[-7,-7],[-6,-10],[-3,-12],[3,-12],[6,-10],[7,-7],[6,-4]],
  [[-5,-4],[-6,-7],[-5,-10],[-2,-12],[3,-12],[6,-10],[6,-6],[5,-4]],
  [[-6,-4],[-7,-7],[-5,-11],[-2,-12],[4,-12],[6,-10],[7,-7],[6,-4]],
  [[-6,-4],[-7,-7],[-6,-10],[-3,-12],[3,-12],[6,-10],[7,-7],[6,-4]],
];

const templePairs = [
  [[-5,-5,-1,1],[5,-5,1,1]],
  [[4,-6,1,.78],[-5,-5,-1,1]],
  [[2,-7,1,.57],[-3,-5,-1,.89]],
  [[-4,-6,-1,.75],[5,-5,1,1]],
  [[-5,-5,-1,1],[5,-5,1,1]],
];

// Art features use skull-relative cells. Resolve five turns and mirror only
// symmetric construction. Highlights are clipped toward screen left separately.
function facing(direction) {
  const view=Math.min(direction,8-direction);
  return {view, mirror:direction>4 ? -1 : 1, rear:view>=3, profile:view===2, clasp:[0,-2,-4,-4,0][view]};
}

function pixelArt(draw,d,icon=false) {
  const look=facing(d), cells=new Map();
  const xform=x=>look.mirror*x;
  const put=(x,y,role)=>cells.set(y*64+x,role);
  const pen={
    fillStyle:null,
    fillRect(x,y,w,h) {
      for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)put(col,row,this.fillStyle);
    },
  };
  const poly=(points,role)=>pixelPolygon(pen,points.map(([x,y])=>({x:xform(x),y})),role);
  const shapeDot=(x,y,role)=>put(Math.round(xform(x)),Math.round(y),role);
  const path=(points,role,width=1)=>{
    const place=([x,y])=>({x:xform(x),y});
    for(let i=1;i<points.length;i++)pixelLine(pen,place(points[i-1]),place(points[i]),role,width);
  };
  const light=(points,role='light')=>{
    const previous=pen.fillRect;
    pen.fillRect=(x,y,w,h)=>{
      for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){
        if(col<=3 && cells.has(row*64+col))put(col,row,role);
      }
    };
    poly(points,role);
    pen.fillRect=previous;
  };
  draw({poly,dot:shapeDot,path,light},look,icon);
  const result=new Map();
  for(const [n]of cells){
    const y=Math.floor((n+32)/64);
    const x=n-y*64;
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
      const next=(y+dy)*64+x+dx;
      if(!cells.has(next))result.set(next,'ink');
    }
  }
  for(const [n,role]of cells)result.set(n,role);
  return [...result.entries()].sort(([a],[b])=>a-b).reduce((runs,[n,role])=>{
    const y=Math.floor((n+32)/64), x=n-y*64, previous=runs.at(-1);
    if(previous?.[1]===y && previous[0]+previous[2]===x && previous[3]===role)previous[2]++;
    else runs.push([x,y,1,role]);
    return runs;
  },[]);
}

function metalBand({poly,light},look,role='body') {
  poly(bands[look.view],role);
  light(bands[look.view].slice(0,5).map(([x,y])=>[x,y-.25]).concat(bands[look.view].slice(0,5).toReversed().map(([x,y])=>[x,y+.85])));
}

function crescent({poly,dot},x,y,profile) {
  if(profile){poly([[x-1,y-3],[x+1,y-2],[x,y],[x+1,y+1],[x-1,y+1],[x-2,y-1]],'stone');return;}
  poly([[x+2,y-3],[x-1,y-3],[x-3,y-1],[x-3,y+1],[x-1,y+2],[x+2,y+1],[x,y],[x-1,y-1],[x,y-2]],'stone');
  dot(x-2,y,'stoneLight');
}

function moonCirclet(p,look) {
  metalBand(p,look);
  if(look.rear)return;
  crescent(p,look.clasp,-6,look.profile);
}

function arcanistCirclet(p,look) {
  const {poly,dot}=p;
  metalBand(p,look,'mount');
  if(look.rear){dot(1,-4,'body');return;}
  const x=look.clasp;
  poly([[x-5,-5],[x-2,-5],[x,-6],[x+2,-5],[x+4,-5],[x+2,-4],[x,-3],[x-2,-4]],'body');
  const w=look.profile?1:2;
  poly([[x,-8],[x+w,-6],[x,-3],[x-w,-6]],'stoneDark');
  poly([[x,-8],[x+w-.4,-6],[x,-5],[x-1,-6]],'stone');
  dot(x,-6,'stoneLight');
}

function sunCrown(p,look) {
  const {poly,light,dot}=p;
  metalBand(p,look);
  if(look.rear){poly([[-4,-5],[-3,-7],[-2,-5],[2,-5],[4,-7],[5,-5]],'gold');return;}
  const x=look.clasp;
  const rays=[[-5,-5],[-6,-8],[-3,-7],[-2,-6],[0,-10],[2,-6],[3,-7],[5,-8],[4,-5],[2,-4],[-2,-4]];
  poly(rays.map(([dx,y])=>[x+dx*(look.profile?.62:1),y]),'body');
  poly([[x,-9],[x+2,-7],[x,-5],[x-2,-7]],'ember');
  if(!look.profile)light([[x-5,-7],[x-3,-7],[x-2,-5],[x-4,-5]],'goldLight');
  dot(x,-7,'goldLight');
}


const guardSides = [
  [[-7,-6],[-5,-5],[-4,-2],[-4,2],[-6,3],[-7,0]],
  [[-7,-6],[-5,-5],[-5,-2],[-4,2],[-6,3],[-7,0]],
  [[2,-6],[5,-6],[6,-3],[5,1],[3,3],[1,1]],
  [[-6,-6],[6,-6],[6,1],[3,4],[-3,4],[-6,1]],
  [[-6,-6],[6,-6],[6,1],[3,4],[-3,4],[-6,1]],
];

function roundDome(p,look,rim='trim') {
  const {poly,light,path}=p;
  poly(faces[look.view].map(([x,y])=>[x,y+1]),'body');
  const frontShift=look.profile?-.5:0;
  poly([[frontShift+1,-10],[4,-10],[6,-8],[6,-4],[3,-3],[1,-5]],'dark');
  light([[-6,-7],[-4,-10],[-1,-11],[2,-10],[0,-8],[-2,-7]]);
  path([[-5,-4],[-2,-4],[2,-4],[5,-5]],rim);
}

function ironCoif(p,look) {
  const {poly,dot,path}=p;
  roundDome(p,look,'mailShade');
  poly(guardSides[look.view],'dark');
  if(!look.rear && !look.profile){
    const near=look.view===1?5:6;
    poly([[near-1,-6],[near+1,-6],[near+1,0],[near-1,2],[near-2,0]],'dark');
  }
  const mail = look.rear ? [[-4,-1],[-2,0],[0,1],[2,0],[4,-1]] :
    look.profile ? [[2,-2],[4,-1],[3,1]] : [[-5,-2],[-6,0],[5,-1]];
  for(const [x,y]of mail){dot(x,y,'body');dot(x,y+1,'mailShade');}
  path(look.rear?[[-4,1],[-2,2],[2,2],[4,1]]:look.profile?[[4,-2],[3,1],[2,2]]:[[-6,-1],[-5,1]],'light');
}

function moonHelm(p,look) {
  const {poly,path,dot,light}=p;
  roundDome(p,look,'dark');
  if(look.rear){
    poly(guardSides[look.view],'body');
    poly([[2,-4],[6,-4],[5,1],[2,3],[0,2]],'dark');
    path([[-4,1],[-2,2],[2,2]],'silver');
    dot(0,-1,'steelRivet');
    return;
  }
  const cheek=look.profile ? [[2,-5],[5,-5],[5,-2],[4,1],[1,4],[-2,3],[-1,0]] :
    [[-6,-5],[-4,-4],[-5,-1],[-3,1],[0,0],[3,1],[4,-1],[4,-4],[6,-5],[6,1],[3,4],[-2,4],[-5,2],[-6,-1]];
  poly(cheek,'body');
  poly(look.profile?[[3,-4],[5,-3],[4,0],[1,3],[0,2]]:[[3,-1],[4,-3],[6,-3],[5,1],[2,4],[0,3]],'dark');
  const x=look.profile?-4:look.clasp;
  poly([[x-1,-5],[x+1,-5],[x+1,-1],[x,2],[x-1,1],[x-1,-2]],'silver');
  if(!look.profile)path([[x-2,-4],[x-3,-4],[x-4,-3]],'silver');
  light(look.profile?[[1,-3],[3,-3],[2,0],[0,2],[-1,2]]:[[-5,0],[-3,0],[-1,2],[-2,3],[-4,2]],'silver');
}

function nearHorn(points,x,y,sign,scale=1,minY=-15) {
  return points.map(([u,v])=>[x+sign*u*scale,Math.max(minY,y+v*scale)]);
}

function hornedHelm(p,look) {
  const {poly,path,dot}=p;
  roundDome(p,look);
  if(look.rear){
    poly(guardSides[look.view],'dark');
    path([[-3,-1],[0,0],[3,-1]],'body');
  }else{
    const guard=look.profile?[[1,-5],[5,-5],[5,-1],[2,2],[1,1]]:[[-6,-5],[-4,-4],[-5,1],[-6,2],[-7,0]];
    poly(guard,'dark');
    if(!look.profile)poly([[4,-5],[6,-5],[7,-1],[6,2],[5,1]],'dark');
    path([[-5,-4],[-2,-3],[2,-3],[5,-4]],'silver');
  }
  for(const [x,y,s,k]of templePairs[look.view]){
    const q=(points,role)=>poly(nearHorn(points,x,y-2,s,k),role);
    q([[-1.5,1],[-1.5,-1],[.5,-3],[2.5,-4],[5,-6],[5.5,-5],[4,-2],[2,0],[.5,1.5]],'hornDark');
    q([[-1,0],[.2,-1.2],[2,-3.3],[5,-5.5],[4.2,-3],[2.8,-1],[1,0]],'horn');
    q([[.7,-1.5],[2.1,-3.4],[4.9,-5.7],[4,-3.8],[2.5,-2.1]],'hornLight');
    dot(x,y-1,'steelRivet');
  }
}

function keeperCrown(p,look) {
  const {poly,path,dot}=p;
  metalBand(p,look,'thread');
  for(const [x,y,s,k]of templePairs[look.view]){
    const q=(points,role)=>poly(nearHorn(points,x,y-1,s,k,-12),role);
    q([[-1,1],[-1,-1],[1.2,-2.6],[1.9,-4],[2.2,-5.5],[3,-6],[4.5,-5.5],[3.5,-4.7],[3.4,-3],[2.5,-1],[1,1]],'body');
    q([[1,-2],[.5,-3.5],[-.4,-3.7],[-1,-5],[-.5,-5.7],[1.5,-4.5],[2.2,-3]],'body');
    q([[.25,-1.5],[1,-2.5],[2.3,-4.8],[2.9,-5.8],[3.2,-5.2],[2.65,-3.5],[1.4,-1]],'bark');
    path(nearHorn([[2.6,-2.1],[3.1,-.5]],x,y-1,s,k),'thread');
    dot(x+s*3*k,y+.1,s===-1?'cyan':'amber');
  }
}


function ramMane({poly,light},look) {
  if(look.rear){
    poly([[-6,-8],[3,-9],[6,-4],[7,5],[9,10],[5,9],[6,14],[0,11],[-3,14],[-7,11],[-6,7],[-8,9],[-7,2]],'mane');
    poly([[1,-7],[5,-5],[6,5],[8,9],[4,8],[4,12],[0,10],[-1,4]],'maneDark');
    light([[-5,-6],[-2,-7],[1,-4],[-1,4],[-2,9],[-5,12],[-5,5],[-6,7]],'maneLight');
    return;
  }
  const far=look.profile ? [[3,-8],[6,-5],[7,4],[8,8],[5,7],[6,12],[2,9],[3,5],[2,1]] :
    [[3,-7],[6,-5],[6,2],[8,8],[6,7],[5,12],[2,9],[3,5],[2,1]];
  poly(far,'maneDark');
  if(!look.profile){
    poly([[-6,-7],[-3,-6],[-3,-1],[-4,4],[-2,9],[-5,12],[-5,8],[-8,9],[-6,3],[-7,-1]],'mane');
    light([[-6,-6],[-4,-5],[-5,0],[-5,5],[-4,9],[-5,10],[-6,6]],'maneLight');
  }
}

function carverCrown(p,look,icon) {
  const {poly,dot}=p;
  if(!icon)ramMane(p,look);
  metalBand(p,look,'boneDark');
  for(const [x,y,s,k]of templePairs[look.view]){
    const scale=icon?k*.85:k, root=icon?x*.9:x;
    const q=(points,role)=>poly(nearHorn(points,root,y-1,s,scale),role);
    q([[-1.5,1],[-1,-1],[-.4,-3.9],[1.5,-5.6],[3.8,-6],[5.8,-4.5],[6.7,-2.3],[6,0],[4.2,1.8],[2.2,1.6],[1.2,.1],[2,-1.65],[3.6,-2.2],[4.5,-1.5],[3.8,-.4],[3.1,-.3],[3.1,.3],[4.2,.25],[5,-1],[4.7,-2.8],[3.4,-4],[1.8,-3.1],[1.2,-.6],[.5,1]],'boneDark');
    q([[-.8,.3],[-.3,-2.7],[1.7,-5.2],[3.7,-5.6],[5.5,-4.2],[4.6,-3.3],[3.4,-4],[1.9,-3.05],[1,-.55]],'bone');
    q([[.6,-3],[1.8,-5.2],[3.6,-5.65],[4.6,-4.85],[3.25,-4.3],[1.55,-4]],'boneLight');
  }
  if(look.rear)return;
  const x=look.clasp;
  poly([[x-4,-6],[x-1,-7],[x,-8],[x+1,-7],[x+4,-6],[x+2,-4],[x,-3],[x-2,-4]],'bone');
  poly([[x,-7],[x+1,-6],[x,-4],[x-1,-5]],'stone');
  dot(x,-6,'gemLight');
}

function hairlineHorns(look) {
  const roots=templePairs[look.view];
  return look.view===4 ? roots.map(([x,y,sign,scale])=>[x,y+1,sign,scale]) : roots;
}

function impHorns(p,look) {
  const {poly}=p;
  for(const [x,y,s,k]of hairlineHorns(look)){
    const q=(points,role)=>poly(nearHorn(points,x,y,s,k,-10),role);
    q([[-1.5,1],[-1.5,-1],[-.75,-2.6],[1.1,-4],[3.9,-4.75],[3.5,-3],[2,-1],[1.7,1]],'dark');
    q([[-.8,0],[-.4,-2],[1.4,-3.8],[3.7,-4.55],[2.25,-2.45],[1.1,-1],[.9,.4]],'body');
    q([[-.25,-1.8],[1.3,-3.8],[3.7,-4.55],[2.2,-3.1],[.9,-2]],'light');
    q([[-1,.45],[1.1,-.3],[1.45,.6],[-.9,1]],'collar');
  }
}

function succubusHorns(p,look) {
  const {poly}=p;
  for(const [x,y,s,k]of hairlineHorns(look)){
    const q=(points,role)=>poly(nearHorn(points,x,y,s,k,-10),role);
    q([[-1.5,1.5],[-1.4,-.3],[-.2,-2.1],[1.2,-3.4],[3.2,-3.8],[4.7,-5],[4.7,-3.2],[3.8,-1.25],[2.6,-.3],[1.6,1.5]],'dark');
    q([[-.8,.3],[.15,-1.8],[1.45,-3],[3.3,-3.55],[4.55,-4.7],[4.1,-3],[3.25,-1.7],[1.7,-.65],[1,1]],'body');
    q([[.05,-1.7],[1.5,-3.05],[3.4,-3.65],[4.35,-4.25],[3.55,-2.8],[1.7,-2.15]],'light');
    q([[-.7,1],[1.2,.4],[1.5,1.4],[-.8,1.5]],'collar');
  }
}

const art = {
  bone_carver_crown:{draw:carverCrown, accents:CARVED_BONE},
  keeper_crown:{draw:keeperCrown, accents:CROOKED_WOOD},
  moon_circlet:{draw:moonCirclet, accents:MOONLIGHT},
  horned_helm:{draw:hornedHelm, accents:FORGED_HORN},
  iron_coif:{draw:ironCoif},
  moon_helm:{draw:moonHelm},
  sun_crown:{draw:sunCrown, accents:SUNLIGHT},
  arcanist_circlet:{draw:arcanistCirclet, accents:MOONLIGHT},
  imp_horns:{draw:impHorns, accents:IMP_BONE},
  succubus_horns:{draw:succubusHorns, accents:SUCCUBUS_HORN},
};

const defaultMetal = {ink:'#302b2b', dark:'#54484c', base:'#9a8f8b', light:'#d0c6b1', trim:'#8e715a'};
const artworks = Object.fromEntries(Object.entries(art).map(([id,{draw,accents}])=>{
  const iconRuns=pixelArt(draw,1,true);
  const left=Math.min(...iconRuns.map(([x])=>x));
  const right=Math.max(...iconRuns.map(([x,,w])=>x+w));
  const top=Math.min(...iconRuns.map(([,y])=>y));
  const bottom=Math.max(...iconRuns.map(([,y])=>y))+1;
  return [id,{
    accents,
    views:Array.from({length:8},(_,d)=>pixelArt(draw,d)),
    iconRuns,
    iconX:12-Math.floor((left+right)/2),
    iconY:12-Math.floor((top+bottom)/2),
  }];
}));

function paint(c,runs,x,y,p,accents){
  const palette={...p,body:p.base,silver:'#bcc7d9',steelRivet:'#e1d8b9',mailShade:'#424447',...accents};
  for(const [dx,dy,w,role]of runs){
    c.fillStyle=palette[role];
    c.fillRect(x+dx,y+dy,w,1);
  }
}

export function drawCrownHeadwear(c,h,d,id,p=defaultMetal,time=0) {
  if(!Object.hasOwn(artworks,id))return false;
  const {views,accents}=artworks[id];
  paint(c,views[d],Math.round(h.x),Math.round(h.y),p,accents);
  if(id==='bone_carver_crown'&&(d<3||d>5)){
    const profile=d===2||d===6, sign=d<4?-1:1;
    drawCarverEyeParticles(c,{x:h.x+(profile?sign*3:d===0?0:sign),y:h.y},d,time);
  }
  return true;
}

export function drawCrownHeadwearIcon(c,id,p=defaultMetal) {
  if(!Object.hasOwn(artworks,id))return false;
  const {iconRuns,iconX,iconY,accents}=artworks[id];
  paint(c,iconRuns,iconX,iconY,p,accents);
  return true;
}
