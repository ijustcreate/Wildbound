import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {drawTreeBranches,drawTreeTrunk,paintTreeFoliage,treeStructure} from './forest-tree-art.mjs';
import {MOUNTAIN_ASCENT,MOUNTAIN_CAVE_TRAIL,MOUNTAIN_UPPER_HEIGHT,mountainLand,mountainTrail} from './wild-mountain-layout.mjs';

const summit=MOUNTAIN_ASCENT.at(-1);
const summitCairn={x:summit[0]+116,y:summit[1]-72,z:summit[2]};
const summitCamp={x:summit[0]-105,y:summit[1]+34,z:summit[2]};
const trailDetails=[
 {x:15920,y:7092,stones:2},{x:16973,y:7514,stones:3},
 {x:16982,y:6964,stones:1},{x:16798,y:6422,stones:3},
 {x:16335,y:7354,stones:2},{x:17467,y:6400,stones:2},
].map(p=>({...p,z:mountainTrail(p.x,p.y).height}));
const slopeStands=[
 [16105,6576,'scree'],[16387,6410,'scree'],
 [16460,6218,'snow'],[16972,5860,'snow'],[17445,5874,'snow'],[17876,5927,'snow'],[18238,6185,'snow'],
 [18215,6562,'scree'],[18435,6865,'scree'],[17970,7552,'scree'],[16607,7851,'scree'],[15395,7123,'scree'],
];
// Roots on rock outside the walkable shelves. The lift is the projected rock
// ledge where the grove sits, not a new floor or a route onto the mountainside.
const pineBeds=[
 [15634,6890,0],[15895,6732,0],[15910,7018,10],[15932,7338,22],[16070,7356,41],[16190,7050,30],
 [16442,7664,0],[16404,7475,38],[16900,7611,65],[17250,7545,139],
 [16943,7721,45],[17572,7712,22],[18160,7339,14],
 [17440,7140,188],[17855,7275,216],[17785,6915,223],[17736,6838,226],[17130,6704,261],
 [16512,6878,270],[16960,6350,415],[17140,6360,397],[17310,6410,414],
];
const pineOffsets=[[-42,-11,77],[-17,20,61],[16,-24,89],[40,8,66]];
const projectedTrails=[MOUNTAIN_ASCENT,MOUNTAIN_CAVE_TRAIL].map(trail=>
 trail.map(([x,y,z,width])=>[x,y-z,width]));

function besideProjectedTrail(x,y){
 for(const trail of projectedTrails)for(let i=1;i<trail.length;i++){
  const [ax,ay,aw]=trail[i-1],[bx,by,bw]=trail[i],dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(x-ax-dx*t,y-ay-dy*t)<aw+(bw-aw)*t+17)return false;
 }
 return true;
}

export const mountainPines=pineBeds.flatMap(([x,y,z],bed)=>pineOffsets.flatMap(([dx,dy,baseSize],index)=>{
 const px=x+dx,py=y+dy,screenY=py-z;
 if(!mountainLand(px,py)||!mountainLand(px,screenY)||mountainTrail(px,py,-12)||!besideProjectedTrail(px,screenY))return [];
 const winter=z>=295,size=Math.round((baseSize+(bed+index)%4*4)*(winter?.8:1));
 return [{kind:winter?'snow_tree':'tree',treeType:'pine',season:winter?'winter':'summer',
  x:px,worldY:py,y:screenY,rootY:screenY,z,size,bed,seed:501+37*bed+17*index,procedural:true}];
})).sort((a,b)=>a.rootY-b.rootY);
const harborDetails=[{x:7900,y:5510,cargo:true},{x:7460,y:5110,cargo:false},{x:8560,y:5530,cargo:true}];

function painter(ctx,x,y){
 const point=([px,py])=>({x:Math.round(x+px),y:Math.round(y+py)});
 return {
  poly:(color,...points)=>pixelPolygon(ctx,points.map(point),color),
  line:(color,width,a,b)=>pixelLine(ctx,point(a),point(b),color,width),
 };
}

function shadow(p,w){
 p.poly('#192d2b72',[-w,0],[-w*.57,-6],[w*.67,-4],[w,2],[w*.42,6],[-w*.56,7]);
}

function rock(p,x,y,w,h,wet=false){
 const a=[x-w*.54,y],b=[x-w*.64,y-h*.47],c=[x-w*.29,y-h*.92],d=[x+w*.31,y-h],e=[x+w*.54,y-h*.64],f=[x+w*.58,y-h*.16];
 p.poly(wet?'#213b40':'#314139',a,b,c,d,e,f);
 p.poly(wet?'#436361':'#687367',b,c,d,[x+w*.30,y-h*.65],[x-w*.14,y-h*.51]);
 p.poly(wet?'#36524e':'#4d5b51',a,b,[x-w*.14,y-h*.51],[x+w*.30,y-h*.65],e,f);
 p.line(wet?'#597b70':'#a5a48b',2,[x-w*.25,y-h*.84],[x+w*.20,y-h*.9]);
}

function cairn(p,n,large=false){
 shadow(p,large?34:17);
 for(let i=0;i<n;i++){
  const width=large?48-i*8:26-i*5,height=large?15-i*.7:10-i*.5;
  rock(p,(i%2?1:-1)*(i+1),1-i*(large?11:8),width,height);
 }
}

function tuft(p,x,y,wet=false){
 const dark=wet?'#244f49':'#374f42',middle=wet?'#488168':'#5e7051',light=wet?'#76a885':'#898e64';
 p.poly('#20372e74',[x-13,y],[x-7,y-4],[x+12,y-5],[x+16,y], [x+7,y+3]);
 for(const [dx,h] of [[-12,12],[-8,22],[-3,25],[3,17],[8,20],[13,10]]){
  p.line(dark,4,[x,y],[x+dx,y-h]);
  p.line(middle,2,[x+dx*.21,y-h*.20],[x+dx,y-h]);
  p.line(light,1,[x+dx*.66,y-h*.77],[x+dx,y-h]);
 }
}

function crate(p,x,y,w,wet=false){
 const h=w*.65,d=w*.38,body=wet?'#5d5747':'#836647',top=wet?'#817153':'#b28e60',edge=wet?'#aaa17b':'#c9a476';
 p.poly('#332f2b',[x-w/2,y-h],[x+w/2,y-h+1],[x+w/2,y],[x-w/2,y]);
 p.poly(body,[x-w/2+2,y-h+2],[x+w/2-2,y-h+2],[x+w/2-2,y-2],[x-w/2+2,y-2]);
 p.poly('#423f35',[x+w/2,y-h],[x+w*.69,y-h-d*.44],[x+w*.69,y-d*.42],[x+w/2,y]);
 p.poly(top,[x-w/2,y-h],[x-w*.32,y-h-d*.49],[x+w*.69,y-h-d*.49],[x+w/2,y-h]);
 p.line(edge,2,[x-w/2+3,y-h],[x+w/2-3,y-h]);
 p.line(top,2,[x-w/2+4,y-4],[x+w/2-4,y-h+5]);
 p.line('#39382d',2,[x-3,y-h*.48],[x+3,y-h*.48]);
}

export function paintMountainSlopeDetails(ctx){
 for(const [x,y,kind] of slopeStands){
  const p=painter(ctx,x,y);
  if(kind==='snow'){
   p.poly('#677f85',[-63,-6],[-44,-22],[-16,-24],[13,-40],[51,-35],[67,-19],[44,-1],[61,15],[19,20],[-18,17],[-35,6]);
   p.poly('#9aabb0',[-56,-7],[-42,-20],[-14,-22],[12,-37],[45,-32],[60,-19],[39,-5],[50,11],[15,15],[-18,12]);
   p.poly('#c1cdcc',[-36,-15],[-15,-18],[11,-30],[34,-28],[48,-19],[26,-11],[-11,-8]);
   p.line('#d9e4df',3,[-32,-15],[6,-24]);rock(p,38,9,44,20,true);rock(p,-30,10,28,16,true);
  }else{
   shadow(p,58);rock(p,-22,5,51,32,true);rock(p,10,9,35,22);rock(p,39,16,22,17,true);
   tuft(p,-42,15);tuft(p,22,18);
  }
 }
}

function pineLedge(ctx,trees){
 const left=Math.min(...trees.map(tree=>tree.x))-25,right=Math.max(...trees.map(tree=>tree.x))+24;
 const top=Math.min(...trees.map(tree=>tree.rootY)),bottom=Math.max(...trees.map(tree=>tree.rootY));
 const p=painter(ctx,left,top),w=right-left,h=bottom-top,icy=trees[0].season==='winter';
 const a=[0,9],b=[15,-4],d=[w*.41,-12],e=[w*.72,-4],f=[w-6,8],g=[w,h-3],k=[w-23,h+13],
  l=[w*.43,h+9],m=[w*.18,h+4];
 p.poly('#283a3d91',a,b,d,e,f,g,[w-6,h+22],[w*.57,h+41],[w*.28,h+35],[8,h+26]);
 p.poly(icy?'#405760':'#3c4f49',a,g,k,[w*.64,h+32],[w*.36,h+27],[10,h+19]);
 p.poly(icy?'#526d74':'#506457',a,b,d,e,f,g,k,l,m);
 p.line(icy?'#93acaf':'#778373',3,b,d);
 p.line(icy?'#789298':'#677a69',2,[w*.49,-8],f);
 p.line('#354a4a',3,[w*.46,h+19],[w*.73,h+24]);
}

export function paintMountainPines(ctx,upper){
 const trees=mountainPines.filter(tree=>(tree.z>=MOUNTAIN_UPPER_HEIGHT)===upper),ledges=new Map();
 for(const tree of trees){
  if(tree.z<95)continue;
  const bed=ledges.get(tree.bed);
  if(bed)bed.push(tree);else ledges.set(tree.bed,[tree]);
 }
 for(const trees of ledges.values())pineLedge(ctx,trees);
 for(const tree of trees){
  const winter=tree.season==='winter',p=painter(ctx,tree.x,tree.rootY);
  const width=tree.size*.37;
  p.poly(winter?'#718a8c':'#4b5f4c',[-width,1],[-width*.63,-10],[width*.52,-13],
   [width,-5],[width*.82,8],[width*.38,12],[-width*.65,10]);
  if(winter)p.line('#9cb6ba',2,[-width*.63,-10],[width*.39,-12]);
  shadow(p,width*.73);
  ctx.save();
  ctx.translate(tree.x,tree.rootY);
  const scale=tree.size/64,shape=treeStructure(tree);
  ctx.scale(scale,scale);
  ctx.transform(shape.width,0,shape.lean,shape.height,0,0);
  // Bake native wood and needle pixels into the mountain's existing raster.
  drawTreeTrunk(ctx,tree);
  drawTreeBranches(ctx,tree);
  paintTreeFoliage(ctx,tree,0);
  ctx.restore();
 }
}

function marker(p,flagged){
 shadow(p,18);
 p.poly('#443c31',[-5,3],[-4,-28],[5,-30],[6,2]);
 p.poly('#a38359',[-3,-25],[3,-27],[3,1],[-3,2]);
 p.line('#dfbd84',2,[-3,-22],[-3,-2]);
 p.poly('#dbc090',[-10,-23],[4,-25],[12,-20],[4,-16],[-10,-16]);
 p.line('#6a604b',2,[-6,-21],[5,-21]);
 if(flagged){
  p.poly('#75494b',[4,-42],[17,-40],[13,-33],[4,-35]);
  p.line('#d78969',2,[6,-40],[15,-39]);
 }
}

export function paintMountainTrailVerges(ctx,trail,high){
 for(let i=1;i<trail.length;i++){
  const [ax,ay,az,aw]=trail[i-1],[bx,by,bz,bw]=trail[i],dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  const nx=dy/length,ny=-dx/length;
  const groups=Math.max(1,Math.floor(length/163));
  for(let j=1;j<=groups;j++){
   const t=j/(groups+1),side=(i+j)%2?1:-1,w=aw+(bw-aw)*t,offset=side*w*.83;
   const height=az+(bz-az)*t;
   const x=ax+dx*t+nx*offset,y=ay+dy*t-height+ny*offset;
   const p=painter(ctx,x,y),variation=(i*13+j*7)%6;
   if(height<125&&variation%3!==1){
    const root=side*(9+variation*2);
    p.poly('#635643',[-root-8,11],[-root-3,5],[-1,-1],[root,-4],[root+3,-1],[3,3],[-root+2,9]);
    p.line('#9b8160',2,[-root-4,8],[-1,0]);
    p.line('#514b3e',3,[0,2],[root*.5,8]);
    p.line('#7c684f',2,[-root*.6,4],[-root*.32,-3]);
   }
   if(height>310&&variation<(height-295)/24){
    p.poly('#8eaaab',[-16,8],[-15,1],[-5,3],[5,-1],[16,2],[20,8],[11,12],[-8,12]);
    p.poly('#bac9c8',[-15,6],[-11,2],[-4,4],[6,0],[14,3],[17,7],[7,8]);
    p.line('#d6ded7',2,[-5,5],[8,3]);
   }
   rock(p,-3,4,14+variation*2,7+variation,high&&height>310);
   rock(p,11,8,6+variation,4+variation*.6,variation%2===0);
   if(height>=125&&height<335){
    rock(p,-14,12,5+variation,4,true);rock(p,18,14,7+variation,5,true);
   }
   if(variation%3===0&&height<350)tuft(p,-12,7,high&&height>310);
   else if(variation%3===1)p.line('#c5ae83',2,[-12,9],[5,11]);
  }
 }
}

export function paintMountainTrailDetails(ctx,upper){
 for(const [i,detail] of trailDetails.entries()){
  if((detail.z>=MOUNTAIN_UPPER_HEIGHT)!==upper)continue;
  const p=painter(ctx,detail.x,detail.y-detail.z);
  if(i%3===2)marker(p,i===2);
  else cairn(p,detail.stones);
  tuft(p,i%2?19:-19,3);
  if(i===2||i===5)tuft(p,16,2);
 }
 if(!upper)return;
 cairn(painter(ctx,summitCairn.x,summitCairn.y-summitCairn.z),5,true);
 const p=painter(ctx,summitCamp.x,summitCamp.y-summitCamp.z);
 shadow(p,36);
 p.poly('#413c32',[-32,0],[-24,-17],[9,-22],[17,-6],[4,4]);
 p.poly('#969277',[-29,-2],[-21,-16],[7,-20],[13,-7],[3,1]);
 p.line('#555744',3,[-16,-16],[-11,-2]);
 p.line('#c1aa83',2,[-25,-9],[-15,-9]);
 crate(p,19,7,27);
 crate(p,35,-5,16);
}

export function drawMountainPennant(ctx,bounds,time){
 const {x,y,z}=summitCairn,root=y-z;
 if(x+60<bounds.left||x-5>bounds.right||root-112>bounds.bottom||root-40<bounds.top)return;
 const p=painter(ctx,x,root),sway=[0,3,6,3][Math.floor(time*7)%4];
 p.line('#3a3d33',5,[4,-47],[6,-106]);
 p.line('#c1ae84',2,[4,-49],[6,-106]);
 p.poly('#442f39',[7,-104],[25,-105-sway],[51,-95-sway],[27,-91],[8,-90]);
 p.poly('#b06450',[8,-102],[25,-103-sway],[48,-95-sway],[26,-93],[8,-92]);
 p.line('#f0bb85',2,[9,-100],[24,-101-sway]);
 p.line('#dd9a73',2,[10,-94],[24,-95]);
}

export function paintHollowPathDetails(ctx){
 for(const {x,y,cargo} of harborDetails){
  const p=painter(ctx,x,y);
  shadow(p,38);
  rock(p,-24,0,25,15,true);
  tuft(p,-13,5,true);
  tuft(p,26,-6,true);
  if(cargo){
   crate(p,6,0,27,true);
   crate(p,25,6,19,true);
   p.line('#998467',2,[0,6],[12,9]);
  }else{
   rock(p,10,4,32,21,true);
   tuft(p,18,4,true);
  }
 }
}
