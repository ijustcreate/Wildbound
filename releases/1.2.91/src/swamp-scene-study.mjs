// Opt-in native-art review fixture. Deliberately NOT imported by world generation.
// Reference: user's swamp-dock / reed scenes, not sampled reference pixels.
import {WorldLightRenderer, worldLightField} from './world-lighting.mjs';
import {drawMarshFirefly} from './swamp-fireflies.mjs';

export const SWAMP_SCENE_CONTRACT = Object.freeze({
  status:'draft-awaiting-user-review', revision:4, width:640, height:400,
  pixelSize:2, waterFrames:8, maxTrees:8,
  palette:{ink:'#152f31', leafShade:'#1d493b', leaf:'#346442', leafLight:'#608643',
    leafSun:'#9cac58', barkShade:'#303b35', bark:'#655c43', barkLight:'#9b8b58',
    mossShade:'#365b49', moss:'#719260', mossLight:'#a6ae75',
    deep:'#173d42', water:'#23575a', shallow:'#33756a', glint:'#86baa2',
    mud:'#696e4c', grass:'#668248', grassLight:'#94a354'},
});
const P=SWAMP_SCENE_CONTRACT.palette;
export const swampHash=(seed,n=0)=>{let v=Math.imul((seed|0)^Math.imul(n+71,374761393),668265263);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;};
const R=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
// Scanline polygons preserve a single logical pixel grid, including diagonal bark.
function poly(c,pts,color){
  c.fillStyle=color;
  for(let y=Math.floor(Math.min(...pts.map(p=>p[1])));y<Math.ceil(Math.max(...pts.map(p=>p[1])));y++){
    const cuts=[];
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){
      const a=pts[j],b=pts[i];if((a[1]>y+.5)!==(b[1]>y+.5))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2)c.fillRect(Math.ceil(cuts[i]),y,Math.max(1,Math.ceil(cuts[i+1])-Math.ceil(cuts[i])),1);
  }
}
function stroke(c,points,width,color){
  for(let k=1;k<points.length;k++){
    const [ax,ay]=points[k-1],[bx,by]=points[k],steps=Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay)));
    for(let i=0;i<=steps;i++){const t=steps?i/steps:0;R(c,ax+(bx-ax)*t-width/2,ay+(by-ay)*t-width/2,width,width,color);}
  }
}
function surface(w,h){const s=document.createElement('canvas');s.width=w;s.height=h;s.getContext('2d').imageSmoothingEnabled=false;return s;}
export function swampReviewBank(x,y){
  // A broad bend, an open foreground pool, and shallow pockets along its banks.
  const center=268+37*Math.sin(y/68)-y*.13;
  const width=42+21*Math.sin(y/93)+Math.max(0,y-235)*.22;
  return Math.abs(x-center)-width+5*Math.sin(x*.057+y*.042)+2*Math.sin(y*.19)+1.3*Math.sin(x*.47+y*.27);
}
export function swampReviewTreePlan(seed,form='cypress'){
  const wide=form==='mangrove',lean=(swampHash(seed,0)-.5)*31;
  const crown=wide?[[-16,-110,30,25],[-43,-88,28,25],[29,-98,34,27],[6,-69,34,24],[50,-62,26,22]]
    :[[-4,-153,22,23],[-21,-129,31,28],[25,-113,32,29],[-37,-95,29,26],[5,-77,31,27]];
  return {seed,form,lean,crowns:crown.map(([x,y,rx,ry],i)=>({x:x+lean*(-y/155)+(swampHash(seed,i+3)-.5)*10,y:y+(swampHash(seed,i+17)-.5)*12,rx:rx*(.88+swampHash(seed,i+25)*.22),ry})),
    roots:[[-36,4],[-21,8],[19,5],[34,-2]].map(([x,y],i)=>[x+(swampHash(seed,i+41)-.5)*9,y+(swampHash(seed,i+56)-.5)*7])};
}
// A directional leaf spray, not an outlined ellipse. Paired stepped lobes merge
// into a drooping branch; a few lit planes describe its upper surface.
const SPRAY=[[-1,-8],[3,-6],[7,-7],[7,-4],[12,-3],[10,0],[15,2],[11,5],[5,5],[2,8],[-3,6],[-8,7],[-8,3],[-13,2],[-10,-2],[-6,-3],[-7,-6]];
function spray(c,x,y,s,color,flip=1){poly(c,SPRAY.map(([a,b])=>[x+a*s*flip,y+b*s]),color);}
function crown(c,lobe,seed){
  const {x,y,rx,ry}=lobe;
  const outline=[[-1,-1],[-.6,-.96],[-.45,-1.14],[-.13,-.99],[.05,-1.13],[.4,-.93],[.65,-.96],[.7,-.65],[1,-.4],[.94,-.03],[1.1,.22],[.81,.49],[.74,.8],[.44,.74],[.2,1],[-.04,.84],[-.3,1],[-.55,.76],[-.84,.77],[-.78,.44],[-1.08,.26],[-.94,-.05],[-1.05,-.35],[-.88,-.53]];
  poly(c,outline.map(([a,b])=>[x+a*rx,y+b*ry]),P.ink);
  poly(c,outline.map(([a,b])=>[x+a*(rx-2),y-1+b*(ry-2)]),P.leafShade);
  // Interlocking planes curve around each crown instead of rows of leaf stamps.
  const groups=[[-.51,-.32,1.16],[-.13,-.56,1.18],[.32,-.37,1.02],[-.51,.12,.92],[-.12,.03,1.31],[.39,.14,.98],[-.16,.52,.8]];
  for(const [i,[u,v,scale]]of groups.entries()){
    const xx=x+u*rx+(swampHash(seed,i+4)-.5)*4,yy=y+v*ry+(swampHash(seed,i+14)-.5)*5;
    const size=scale*rx/24;
    spray(c,xx,yy,size,P.leaf,i%2?1:-1);
    if(i<5)spray(c,xx-2,yy-3,size*.68,P.leafLight,i%2?1:-1);
    if(i<2)spray(c,xx-3,yy-5,size*.29,P.leafSun);
    // Short paired leaf facets belong to the group, not random crown noise.
    if(i<5){R(c,xx-5,yy-4,3,2,P.leafSun);R(c,xx-3,yy-6,2,3,P.leafLight);}
  }
}
function trunk(c,plan){
  const l=plan.lean;
  const shell=[[-24,5],[-13,-9],[-9,-37],[-11,-59],[l-4,-91],[l-9,-119],[l-3,-132],[l+5,-124],[l+4,-98],[5,-66],[6,-36],[13,-11],[27,5],[13,2],[4,-9],[-3,4],[-8,-2],[-14,7]];
  poly(c,shell,P.ink);
  poly(c,[[-18,3],[-8,-12],[-5,-39],[-8,-60],[l,-94],[l-5,-121],[l-1,-127],[l+1,-98],[1,-64],[3,-36],[8,-10],[19,2],[9,-2],[1,-17],[-5,-6]],P.bark);
  poly(c,[[-14,2],[-6,-16],[-3,-40],[-6,-61],[l-1,-95],[l-4,-116],[l,-106],[l+2,-94],[-2,-59],[0,-37],[2,-23],[-3,-15],[-6,-3]],P.barkLight);
  stroke(c,[[2,-14],[-1,-31],[0,-52],[l+3,-80]],2,P.barkShade);
  stroke(c,[[-8,-3],[-4,-24],[-5,-39]],1,'#b4a169');
  for(const [i,[x,y]]of plan.roots.entries()){
    const pts=[[x*.15,-25],[x*.47,-11],[x*.8,y-3],[x,y]];
    poly(c,[[x*.1,-30],[x*.39,-16],[x*.82,y-5],[x,y],[x*.65,y+1],[x*.19,-8]],P.ink);
    poly(c,[[x*.12,-25],[x*.37,-15],[x*.84,y-3],[x*.93,y-1],[x*.55,y-3],[x*.15,-9]],i%2?P.bark:P.barkShade);
    stroke(c,pts.map(([a,b])=>[a-1,b-2]),1,P.barkLight);
  }
  for(const [i,b]of plan.crowns.entries()){
    const pts=[[0,-47-i*10],[b.x*.42,b.y+20],[b.x,b.y+7]];
    stroke(c,pts,8-i*.6,P.ink);stroke(c,pts.map(([a,b])=>[a-1,b-2]),5-i*.5,P.bark);stroke(c,pts.map(([a,b])=>[a-2,b-3]),2,P.barkLight);
  }
  // A second bent leader describes a fork, rather than a cylindrical pole.
  if(plan.form==='mangrove'){
    poly(c,[[0,-25],[-10,-47],[-28,-63],[-35,-86],[-30,-90],[-22,-67],[-5,-57],[9,-37],[8,-22]],P.ink);
    poly(c,[[0,-30],[-6,-49],[-25,-64],[-31,-84],[-29,-85],[-21,-65],[-3,-55],[5,-36]],P.bark);
    stroke(c,[[-2,-35],[-8,-51],[-25,-65],[-31,-82]],2,P.barkLight);
  }
  for(const [x,y]of [[-3,-21],[-5,-45],[plan.lean,-82]]){
    stroke(c,[[x-1,y-5],[x-3,y-1],[x,y+4],[x+2,y]],1,P.barkShade);
  }
  // Moss climbing the shaded fork, deliberately not a ground-shadow patch.
  poly(c,[[3,-38],[7,-49],[5,-57],[8,-66],[6,-74],[2,-61],[3,-54],[0,-45]],P.mossShade);
}
function mossRibbon(seed,length){
  const s=surface(17,length+3),c=s.getContext('2d');
  // Tapered irregular curtains with holes and multiple tips, never straight ropes.
  poly(c,[[2,0],[13,0],[12,5],[14,9],[11,13],[12,length*.64],[9,length],[7,length-6],[6,length*.65],[4,length-2],[3,length*.45],[1,8]],P.mossShade);
  poly(c,[[3,0],[11,0],[9,7],[10,13],[7,length-5],[6,length*.5],[4,length-4],[5,13],[3,8]],P.moss);
  stroke(c,[[4,1],[5,8],[4,length*.46],[5,length*.7]],1,P.mossLight);
  stroke(c,[[9,3],[8,10],[9,length*.5]],1,'#8fa477');
  for(let i=0;i<6;i++){const y=3+i*length/7;R(c,i%2?3:8,y,2,2,i%2?P.mossLight:P.moss);}
  c.clearRect(7,Math.floor(length*.4),2,4);return s;
}
function makeTree(p){
  const plan=swampReviewTreePlan(p.seed,p.form),body=surface(192,208),c=body.getContext('2d');c.translate(96,194);
  trunk(c,plan);for(const [i,b]of plan.crowns.entries())crown(c,b,p.seed+i*37);
  const moss=plan.crowns.filter((_,i)=>i!==0).flatMap((b,i)=>[-1,1].map((side,j)=>{
    const length=Math.round(16+swampHash(p.seed,71+i*2+j)*24);
    return {x:b.x+side*b.rx*.65-6,y:b.y+b.ry*.55,image:mossRibbon(p.seed+i,length),phase:swampHash(p.seed,i*2+j+85)*6.28};
  }));
  return {...p,kind:p.form==='mangrove'?'mangrove':'old_cypress',size:192*p.scale,rootY:p.y,body,moss,
    lightBounds:{x:p.x-99*p.scale,y:p.y-197*p.scale,width:198*p.scale,height:210*p.scale}};
}
function grassSprig(c,x,y,seed,bright=false){
  const color=bright?P.grassLight:'#4e763f';
  for(let j=0;j<3;j++){const h=3+swampHash(seed,j)*6,dx=(j-1)*3;poly(c,[[x+dx-1,y],[x+dx-2,y-h],[x+dx+1,y-h+3],[x+dx+2,y]],color);}
}
function lily(c,x,y,seed){
  poly(c,[[x-6,y],[x-3,y-3],[x+3,y-3],[x+6,y-1],[x+4,y+2],[x-4,y+2]],'#153e3b');
  poly(c,[[x-5,y-1],[x-2,y-3],[x+3,y-3],[x+5,y-1],[x+2,y+1],[x-4,y+1]],'#668b50');
  R(c,x-3,y-2,4,1,'#a3b56c');stroke(c,[[x,y],[x+2,y-2]],1,P.water);
  if(seed%4===0){R(c,x-1,y-5,3,2,'#d7cda2');R(c,x,y-6,1,2,'#f2e3b7');}
}
function reeds(c,x,y,seed){
  for(let j=0;j<5;j++){const dx=(j-2)*3,h=10+swampHash(seed,j)*15;
    stroke(c,[[x+dx,y],[x+dx+(j-2)*1.3,y-h]],1,j%2?'#78945a':'#426c48');
    if(j%2===0)R(c,x+dx+(j-2)*1.3-1,y-h-4,2,5,'#786746');
    poly(c,[[x+dx,y],[x+dx-6,y-h*.6],[x+dx-3,y-h*.35],[x+dx+1,y-2]],'#89a05d');
  }
}
export const SWAMP_REVIEW_PLANTS=Object.freeze(['duckweed','water_lily','arrowhead','sedge','rush','marsh_iris','fern']);
export function drawSwampReviewPlant(c,kind,x,y,seed=0){
  if(kind==='duckweed'){
    for(let i=0;i<18;i++){const a=swampHash(seed,i)*Math.PI*2,r=swampHash(seed,i+30)*14,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.4;
      R(c,px,py,2+(i%2),2,i%3?'#799b55':'#a5b96c');if(i%3===0)R(c,px+2,py,1,1,'#375e43');}
  }else if(kind==='water_lily'){
    for(let i=0;i<4;i++)lily(c,x+(i%2)*10-5,y+Math.floor(i/2)*5,seed+i);
    poly(c,[[x-4,y-3],[x-3,y-7],[x,y-5],[x+2,y-8],[x+4,y-4],[x+2,y-2]],'#c291ae');R(c,x-1,y-5,3,2,'#e5c8c3');R(c,x,y-4,1,1,'#ecdb9b');
  }else if(kind==='arrowhead'){
    for(let i=-1;i<2;i++){const tx=x+i*9,ty=y-13-(i===0?6:0);stroke(c,[[x,y],[tx,ty]],1,'#5f874c');
      poly(c,[[tx,ty-7],[tx+5,ty+4],[tx+1,ty+2],[tx-4,ty+5]],'#294f3d');
      poly(c,[[tx,ty-6],[tx+1,ty+2],[tx-3,ty+3]],'#8aaa63');}
  }else if(kind==='sedge'){
    for(let i=-3;i<=3;i++){const tx=x+i*4,ty=y-9-(3-Math.abs(i))*2;poly(c,[[x-2,y],[tx,ty],[tx-1,ty+6],[x+2,y]],i%2?'#739b53':'#9cae65');}
  }else if(kind==='rush'){
    for(let i=0;i<6;i++){const h=12+swampHash(seed,i)*13,xx=x+(i-3)*3;stroke(c,[[xx,y],[xx-1,y-h]],1,i%2?'#51764b':'#9aa765');R(c,xx-1,y-h+4,2,1,'#c1be85');}
  }else if(kind==='marsh_iris'){
    for(let i=-2;i<=2;i++)poly(c,[[x-1,y],[x+i*4,y-15+Math.abs(i)*3],[x+i*2,y-3],[x+1,y]],i%2?'#668c54':'#9aad67');
    stroke(c,[[x,y],[x+2,y-20]],1,'#7b985a');
    poly(c,[[x+2,y-23],[x+5,y-20],[x+8,y-22],[x+7,y-17],[x+3,y-16],[x-1,y-17],[x-3,y-21],[x,y-20]],'#9c8cad');R(c,x+1,y-19,3,2,'#dfc38c');
  }else if(kind==='fern')grassSprig(c,x,y,seed,true);
}
function paintTerrain(c){
  for(let y=0;y<400;y++)for(let x=0;x<640;x++){
    const d=swampReviewBank(x,y),wave=Math.sin(x*.016+y*.021)+Math.cos(x*.031-y*.014);
    const patch=Math.sin(x*.051+y*.017)+Math.sin(y*.073-x*.023)+.45*Math.sin(x*.19+y*.12);
    let color=d<-12?(wave>.5?P.water:P.deep):d<-2?P.shallow:d<2?'#427a63':d<6?'#3b5947':d<10?P.mud:patch>1?P.grass:'#557744';
    // An irregular mossy walking shelf; no dirt road straight through the swamp.
    if(d>17&&d<55&&Math.sin(y*.03+x*.009)>.3)color=patch>1.1?'#929b59':'#7f9254';
    R(c,x,y,1,1,color);
  }
  for(let i=0;i<3700;i++){
    const x=Math.floor(swampHash(i,11)*640),y=Math.floor(swampHash(i,12)*400),d=swampReviewBank(x,y);
    if(d>10){
      const patch=Math.sin(x*.046)+Math.cos(y*.063)+Math.sin((x+y)*.023);
      if(patch>.3&&i%2===0){grassSprig(c,x,y,i,patch>1.7);if(i%3===0)grassSprig(c,x+4,y+2,i+9,patch>1.7);}
      else if(i%8===0){R(c,x,y,3,1,'#a4a36c');R(c,x+2,y-1,2,1,'#8b9459');}
    }else if(d>2&&d<10&&i%3===0){R(c,x,y,3,1,'#929367');R(c,x+2,y+1,2,1,'#566d4c');}
  }
  for(let i=0;i<160;i++){
    const x=swampHash(i,18)*640,y=swampHash(i,19)*400,d=swampReviewBank(x,y);
    if(d>-15&&d<-3)lily(c,x,y,i);
    if(d>4&&d<15&&i%2===0)reeds(c,x,y,i);
  }
  for(const [x,y]of [[94,244],[129,330],[360,167],[417,284],[555,238]]){
    // Ferns have a clear central axis and paired leaves, not scatter noise.
    for(let j=-2;j<=2;j++){
      const top=[x+j*5,y-12+Math.abs(j)*2];stroke(c,[[x,y],top],1,P.leafLight);
      for(let k=1;k<5;k++){const t=k/5,bx=x+(top[0]-x)*t,by=y+(top[1]-y)*t;
        poly(c,[[bx,by+2],[bx-6*(1-t),by-3],[bx,by-1],[bx+6*(1-t),by-4]],k%2?P.leafLight:P.grassLight);}
    }
  }
  // Grass breaks the bank contour; clustered mud chips replace a uniform border.
  for(let i=0;i<920;i++){
    const x=swampHash(i,211)*640,y=swampHash(i,212)*400,d=swampReviewBank(x,y);
    if(d>0&&d<13){grassSprig(c,x,y,i,i%4===0);if(i%3===0)R(c,x-3,y+1,3,1,'#a29a6b');}
  }
  // Deliberately placed reed beds alternate with clear water along the bend.
  for(const [x,y]of [[221,31],[325,112],[333,147],[181,173],[178,198],[164,286],[313,318],[151,369]]){
    for(let j=0;j<4;j++)reeds(c,x+(j-1.5)*5,y+Math.abs(j-1)*3,Math.round(x)+j*19);
  }
  for(let i=0;i<25;i++){
    const x=350+swampHash(i,261)*112,y=255+swampHash(i,262)*65;
    if(swampReviewBank(x,y)>20){R(c,x,y-2,1,4,'#507849');R(c,x-1,y-3,3,1,'#c6c995');if(i%3===0)R(c,x,y-4,1,1,'#eee1b0');}
  }
  // Weathered, half-submerged stones give the landing a material/scale anchor.
  for(const [x,y,w,h]of [[354,186,13,9],[368,191,18,11],[376,202,11,7],[125,262,18,11],[134,271,12,7],[406,318,23,12]]){
    poly(c,[[x-w,y],[x-w+2,y-h],[x-3,y-h-3],[x+w-3,y-h],[x+w,y-1],[x+4,y+3]],'#2b4941');
    poly(c,[[x-w+2,y-h],[x-3,y-h-3],[x+w-3,y-h],[x+4,y-4],[x-3,y-2]],'#7c8b70');
    poly(c,[[x-3,y-2],[x+4,y-4],[x+w-3,y-h],[x+w,y-1],[x+4,y+3]],'#4c695b');
    stroke(c,[[x-w+4,y-h],[x-4,y-h-2],[x+3,y-h]],1,'#b0b38a');
    grassSprig(c,x-w+4,y+2,x,true);
  }
  // Distinct wet/dry plant silhouettes grouped by habitat, never scattered over
  // the clear walking shelf. Geometry is baked into the cached ground once.
  for(let i=0;i<150;i++){
    const x=swampHash(i,811)*640,y=swampHash(i,812)*400,d=swampReviewBank(x,y);
    if(d< -3&&d> -23&&i%2===0)drawSwampReviewPlant(c,i%4?'duckweed':'water_lily',x,y,i);
    else if(d>0&&d<17)drawSwampReviewPlant(c,['arrowhead','sedge','rush','marsh_iris'][i%4],x,y,i);
    else if(d>60&&i%3===0)drawSwampReviewPlant(c,i%2?'sedge':'arrowhead',x,y,i);
  }
  for(const [kind,x,y]of [['arrowhead',331,176],['sedge',340,183],['marsh_iris',329,319],['rush',162,261],['marsh_iris',162,273],['water_lily',255,170],['duckweed',264,177]])drawSwampReviewPlant(c,kind,x,y,Math.round(x));
}
function dock(c){
  // Short landing leads onto the bank rather than a repeated bridge motif.
  for(const x of [300,349]){R(c,x,233,5,24,P.ink);R(c,x+1,233,2,20,P.bark);}
  poly(c,[[292,226],[378,226],[378,238],[291,238]],'#293e35');
  for(let i=0;i<13;i++){
    const x=292+i*7,dy=i===2?2:i===8?-1:0;
    R(c,x,213+dy,6,20,'#6f704b');R(c,x,213+dy,5,16,'#b0a675');R(c,x+1,214+dy,3,6,'#c3b782');
    if(i%3===0)stroke(c,[[x+2,223],[x+3,228]],1,'#797f50');
    R(c,x+2,215+dy,1,1,'#4a5540');
  }
  for(const x of [290,378]){R(c,x,209,4,26,'#4d5640');R(c,x-1,208,6,3,'#b1a579');}
}
const TREE_FIXTURE=[
  {id:'review-tree-0',x:53,y:145,scale:.95,seed:31,form:'cypress'},
  {id:'review-tree-1',x:159,y:102,scale:.8,seed:43,form:'mangrove'},
  {id:'review-tree-2',x:422,y:118,scale:.95,seed:17,form:'cypress'},
  {id:'review-tree-3',x:573,y:166,scale:1.13,seed:91,form:'mangrove'},
  {id:'review-tree-4',x:48,y:313,scale:1.12,seed:66,form:'cypress'},
  {id:'review-tree-5',x:522,y:353,scale:1.12,seed:21,form:'cypress'},
  {id:'review-tree-6',x:155,y:437,scale:1.17,seed:8,form:'mangrove'},
];
export function createSwampSceneStudy(){
  const ground=surface(640,400);paintTerrain(ground.getContext('2d'));dock(ground.getContext('2d'));
  const trees=TREE_FIXTURE.map(makeTree),water=[];
  // Eight small cached surface phases. All geometry and shore tests happen once.
  for(let phase=0;phase<8;phase++){
    const frame=surface(640,400),c=frame.getContext('2d');
    for(let i=0;i<370;i++){
      const x=Math.floor(swampHash(i,130)*640),y=Math.floor(swampHash(i,131)*400),d=swampReviewBank(x,y);
      if(d>-4)continue;
      const shift=Math.round(Math.sin(phase*Math.PI/4+i)*2),length=3+Math.floor(swampHash(i,132)*14);
      R(c,x+shift,y,length,1,i%9===0?'#77aa92':i%3?'#316a65':'#43887b');
      if(i%9===0)R(c,x+shift+4,y+2,length*.4,1,'#3a7b6d');
    }
    // Broken vertical tree reflections are painted only where water exists.
    for(const tree of trees)for(let j=0;j<45;j++){
      const y=tree.y+7+j*2,x=tree.x+Math.sin(j*.6+phase*.785)*2;
      if(swampReviewBank(x,y)<-5){c.globalAlpha=.35*(1-j/50);R(c,x-4-j*.04,y,9+j*.08,1,P.ink);}
    }
    c.globalAlpha=1;water.push(frame);
  }
  const lighting=new WorldLightRenderer(),game={scenery:trees};
  const source={x:344,y:267,height:28,radius:210,intensity:.65,color:'#e7d78a',owner:'review-lantern'};
  const stats={groundBuilds:1,treeBuilds:trees.length,waterBuilds:water.length,frames:0};
  const paintTree=(c,p,time)=>{
    c.drawImage(p.body,p.x-96*p.scale,p.y-194*p.scale,192*p.scale,208*p.scale);
    for(const m of p.moss){
      // Pinned upper third; two trailing image bands sway, no pixels read back.
      for(let band=0;band<3;band++){
        const from=Math.floor(m.image.height*band/3),to=Math.floor(m.image.height*(band+1)/3);
        const sway=Math.round(Math.sin(time*Math.PI*2/3.2+m.phase)*band*1.2);
        c.drawImage(m.image,0,from,17,to-from,p.x+(m.x+sway)*p.scale,p.y+(m.y+from)*p.scale,17*p.scale,(to-from)*p.scale);
      }
    }
  };
  return {stats,trees,lighting,
    draw(c,{time=0,dynamicLighting=true,drawPlayer,night=false}={}){
      stats.frames++;c.imageSmoothingEnabled=false;c.drawImage(ground,0,0);c.drawImage(water[Math.floor(time*5)%8],0,0);
      const frame=dynamicLighting?{time,sources:[source],field:worldLightField(game,[source])}:null;
      // This is the production occlusion/tint/rim implementation, not a new
      // lighting system. Low sources pass beneath leaves, trunks block the light.
      if(frame)lighting.drawGround(c,frame);
      const ordered=trees.map(p=>({y:p.y,draw:()=>frame?lighting.drawProp(c,p,pen=>paintTree(pen,p,time),frame):paintTree(c,p,time)}));
      if(drawPlayer)ordered.push({y:281,draw:()=>drawPlayer(c,386,281,time)});
      ordered.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
      // An actual small lantern is the visible source of the warm local rim.
      R(c,342,260,5,8,'#3d4636');R(c,343,261,3,4,'#e3c57a');R(c,342,259,5,1,'#9c9a6b');
      if(night){
        c.fillStyle='#0c243a99';c.fillRect(0,0,640,400);
        // Same cached insect art as the game, shown at bank habitat sites.
        for(let i=0;i<18;i++){
          const y=28+i*20,x=268+37*Math.sin(y/68)-y*.13+(i%2?1:-1)*(42+21*Math.sin(y/93)+Math.max(0,y-235)*.22+5);
          drawMarshFirefly(c,{x:x+Math.sin(time+i)*3,y:y+Math.cos(time+i)*2,phase:i*1.7},time);
        }
      }
    },
  };
}
