import {block as b,shape as p,line as l} from './diagon-shop-brush.mjs';
import {drawClosedFrontage,drawClosedFrontageGround} from './diagon-alley-street-art.mjs';

const palettes={
 diagon:{yard:'#45463e',stone:['#494a42','#505046','#4c4b42','#42443d'],seam:'#3c4039',curb:['#646255','#777363','#8b8572'],
  iron:['#393d3b','#555b54','#77796c'],wood:['#463a35','#695243','#8e6e51'],leaves:['#384732','#4b5d43','#657756'],glass:'#b49564'},
 service:{seam:'#343c39',curb:['#56594f','#656658','#767662'],
  iron:['#333a3a','#4c5753','#65716b'],wood:['#403834','#604a3f','#796151'],leaves:['#384639','#465b49','#62765c'],glass:'#9d9166'},
 nocturne:{seam:'#2b3039',curb:['#4b4e59','#5c5d67','#6c6a72'],
  iron:['#2a2d37','#444956','#626573'],wood:['#353039','#534751','#71616b'],leaves:['#343e3c','#42554d','#617162'],glass:'#819c82'},
};

// These are back buildings and service yards. The foreground alley and its
// existing buildings are painted over them, using the unchanged walkable map.
const frontages=[
 // The garden's west and north walls and the buildings beyond Gringotts.
 [6680,3715,83,72,'garden-spindle'],[6850,3682,76,61,'garden-glazier'],[7024,3558,94,66,'clockmaker'],
 [7230,3517,94,60,'garden-spindle'],[7440,3506,105,73,'garden-glazier'],[7670,3494,102,65,'stationery'],
 [7846,3650,83,73,'pottery'],[8040,3605,96,60,'clockmaker'],[8268,3722,89,70,'weaver'],
 [8480,3666,101,72,'pottery'],[8703,3687,106,68,'stationery'],[8925,3735,100,79,'clockmaker'],
 [8420,3983,90,70,'garden-spindle'],[8630,3950,106,79,'weaver'],[8840,4054,102,65,'pottery'],
 [6705,3980,90,77,'clockmaker'],[6840,3957,67,63,'garden-glazier'],[6767,4307,103,73,'pottery'],
 [6970,4550,98,70,'garden-spindle'],[7180,4598,79,66,'stationery'],[7049,4790,114,83,'weaver'],
 [7214,4827,82,64,'clockmaker'],[6978,5050,99,78,'garden-glazier'],[7212,5097,104,80,'pottery'],
 [7184,5345,92,63,'weaver'],[7306,5558,94,70,'clockmaker'],[7068,5607,120,80,'stationery'],
 [7342,5790,96,76,'pottery'],[7585,6015,105,72,'garden-spindle'],[7810,6098,104,78,'stationery'],
 [8060,6084,104,77,'clockmaker'],[8290,6047,99,71,'weaver'],[8516,5907,108,81,'pottery'],
 // Narrow workyards between Diagon's shop backs and the Nocturne connector.
 [8790,4334,101,79,'weaver'],[8996,4298,82,65,'undertaker'],[9190,4250,93,68,'tallow-workshop'],
 [8641,4669,89,70,'garden-glazier'],[8628,4893,75,60,'clockmaker'],[8768,4825,74,68,'night-weaver'],
 [8730,5048,65,58,'tallow-workshop'],[8375,5405,83,73,'weaver'],[8535,5487,76,65,'garden-spindle'],
 [8800,5436,75,69,'undertaker'],[8675,5669,91,69,'clockmaker'],[8810,5818,91,78,'night-weaver'],
 // Nocturne's north end, the court's rear yards, and the cemetery surrounds.
 [9388,4231,92,69,'night-weaver'],[9604,4359,98,78,'tallow-workshop'],[9827,4430,95,64,'undertaker'],
 [9902,4639,91,67,'night-weaver'],[10064,4834,102,68,'undertaker'],[9941,5082,97,79,'tallow-workshop'],
 [10075,5263,109,85,'night-weaver'],[9996,5540,91,69,'undertaker'],[9772,5730,94,72,'tallow-workshop'],
 [9570,5758,96,78,'night-weaver'],[9356,5752,93,77,'undertaker'],[9132,5769,99,80,'tallow-workshop'],
 [9030,5930,89,68,'night-weaver'],[9260,5978,101,77,'undertaker'],[9658,5946,101,80,'tallow-workshop'],
].map(([x,y,halfWidth,halfDepth,theme])=>({x,y,halfWidth,halfDepth,theme}));

const yards=[
 [6755,3914,'cargo'],[6915,4052,'planter'],[6978,4261,'planter'],[7064,4451,'cargo'],[7180,4695,'planter'],
 [7292,4926,'cargo'],[7123,5225,'planter'],[7320,5330,'cargo'],[7247,5704,'planter'],[7772,5795,'cargo'],
 [8429,5743,'planter'],[7748,3786,'planter'],[7895,3739,'cargo'],[8168,3777,'planter'],[8412,4082,'cargo'],
 [8680,4076,'planter'],[8743,4485,'cargo'],[8600,4754,'planter'],[8712,5129,'cargo'],[8815,5144,'lantern'],
 [8355,5324,'planter'],[8470,5517,'cargo'],[8759,5555,'planter'],[8860,5378,'lantern'],[8844,5635,'cargo'],
 [8927,4461,'lantern'],[9135,4328,'cargo'],[9355,4558,'cargo'],[9510,4814,'lantern'],[9699,5018,'cargo'],
 [9518,5059,'planter'],[9550,5187,'cargo'],[9637,5383,'lantern'],[9499,5385,'cargo'],[9710,5573,'planter'],
 [9471,5636,'lantern'],[9295,5689,'cargo'],[9064,5660,'planter'],[9820,5645,'cargo'],[9895,5333,'planter'],
].map(([x,y,kind])=>({x,y,kind}));

function district(x,y){
 if(x>=8940||x>=8710&&y>=5140)return 'nocturne';
 return x>=8540&&y>=4100?'service':'diagon';
}

const tileSize=168;
const groundRasters=new Map();
function groundRaster(variant){
 let canvas=groundRasters.get(variant);
 if(canvas)return canvas;
 const {yard,stone,seam}=palettes.diagon;
 canvas=document.createElement('canvas');canvas.width=canvas.height=tileSize;
 const c=canvas.getContext('2d');
 b(c,0,0,tileSize,tileSize,yard);
 for(let row=0;row<9;row++)for(let col=0;col<10;col++){
  const seed=(row*19+col*23+row*col*3+variant*11)%29;
  const x=col*19-(row%2)*9,y=row*19+(col*5+row+variant)%4-2;
  if(seed<9)continue;
  p(c,stone[seed%4],[[x+2,y+4],[x+5,y+2],[x+15,y+2],[x+18,y+6],[x+17,y+14],[x+4,y+15]]);
  if(seed%5===0)b(c,x+5,y+14,10,1,seam);
  if(seed%7===0)b(c,x+9,y+7,2,1,stone[1]);
 }
 groundRasters.set(variant,canvas);
 return canvas;
}

function paintGround(c,bounds){
 for(let y=Math.floor(bounds.top/tileSize);y*tileSize<bounds.bottom;y++){
  for(let x=Math.floor(bounds.left/tileSize);x*tileSize<bounds.right;x++){
   const variant=((x*7+y*11+x*y)%4+4)%4;
   c.drawImage(groundRaster(variant),x*tileSize,y*tileSize);
  }
 }
 const wash=c.createLinearGradient(8380,4790,9110,5190);
 wash.addColorStop(0,'#26364a00');wash.addColorStop(.4,'#26364a28');wash.addColorStop(1,'#26364aa6');
 c.fillStyle=wash;c.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
}

function drawCurb(c,bounds,{x,y,w,h}){
 const {curb,seam}=palettes[district(x+w/2,y+h/2)];
 for(const edge of [x-8,x+w]){
  if(edge>bounds.right||edge+8<bounds.left)continue;
  const top=Math.max(y,Math.floor(bounds.top/18)*18),bottom=Math.min(y+h,bounds.bottom);
  if(top>=bottom)continue;
  b(c,edge,top,8,bottom-top,seam);
  for(let start=y+Math.floor((top-y)/18)*18;start<bottom;start+=18){
   const size=Math.min(17,y+h-start);
   if(size<=0)continue;
   b(c,edge+1,start,6,size,curb[0]);b(c,edge+2,start,2,size,curb[1]);
   b(c,edge+2,start,4,1,curb[2]);
  }
 }
 for(const edge of [y-8,y+h]){
  if(edge>bounds.bottom||edge+8<bounds.top)continue;
  const left=Math.max(x,Math.floor(bounds.left/24)*24),right=Math.min(x+w,bounds.right);
  if(left>=right)continue;
  b(c,left,edge,right-left,8,seam);
  for(let start=x+Math.floor((left-x)/24)*24;start<right;start+=24){
   const size=Math.min(23,x+w-start);
   if(size<=0)continue;
   b(c,start,edge+1,size,6,curb[0]);b(c,start,edge+2,size,2,curb[1]);
   b(c,start,edge+2,1,4,curb[2]);
  }
 }
}

function crate(c,x,y,w,h,wood,iron){
 p(c,wood[2],[[x,y-h],[x+5,y-h-5],[x+w+5,y-h-5],[x+w,y-h]]);
 p(c,wood[0],[[x+w,y-h],[x+w+5,y-h-5],[x+w+5,y-5],[x+w,y]]);
 b(c,x,y-h,w,h,wood[1]);
 for(let seam=3;seam<h;seam+=5)b(c,x+1,y-h+seam,w-2,1,wood[0]);
 l(c,wood[2],x+2,y-1,x+w-3,y-h+1,2);
 b(c,x,y-h,2,h,wood[0]);b(c,x+w-2,y-h,2,h,wood[0]);
 b(c,x+3,y-h+1,2,2,iron[2]);b(c,x+w-5,y-3,2,2,iron[2]);
}

function paintProp(c,{x,y,kind}){
 const {iron,wood,leaves,glass}=palettes[district(x,y)];
 c.save();c.translate(x,y);
 p(c,'#20272870',[[-24,0],[-15,-9],[19,-8],[26,-1],[18,5],[-15,6]]);
 if(kind==='cargo'){
  crate(c,-19,-2,22,14,wood,iron);crate(c,3,0,18,12,wood,iron);
  crate(c,-13,-16,14,11,wood,iron);
 }else if(kind==='planter'){
  p(c,iron[0],[[-24,-11],[20,-11],[17,0],[-21,0]]);
  b(c,-23,-12,44,4,iron[1]);b(c,-21,-12,38,1,iron[2]);
  for(let i=0;i<6;i++){
   const u=-17+i*7,v=-17-(i*7+x)%9;
   p(c,leaves[0],[[u-6,-11],[u-7,v],[u-3,v-4],[u+4,v-3],[u+6,-11]]);
   p(c,leaves[1],[[u-5,v],[u-1,v-4],[u+4,v-3],[u+2,v+3],[u-4,v+4]]);
   b(c,u-2,v-2,3,2,i%3===0?glass:leaves[2]);
  }
 }else{
  b(c,-8,-3,16,4,iron[0]);b(c,-4,-33,8,32,iron[1]);b(c,-3,-31,2,27,iron[2]);
  b(c,-8,-43,16,12,iron[0]);b(c,-6,-42,12,10,glass);b(c,-1,-42,2,10,iron[1]);
  p(c,iron[0],[[-10,-43],[-6,-48],[6,-48],[10,-43]]);b(c,-4,-47,8,1,iron[2]);
  b(c,-6,-34,5,1,iron[2]);
 }
 c.restore();
}

const scenery=[...frontages.map(frontage=>({depth:frontage.y+frontage.halfDepth,frontage})),
 ...yards.map(prop=>({depth:prop.y,prop}))].sort((a,b)=>a.depth-b.depth);

export function drawAlleyPerimeter(c,bounds,visible,paths){
 c.save();c.imageSmoothingEnabled=false;
 paintGround(c,bounds);
 for(const area of paths)drawCurb(c,bounds,area);
 for(const {frontage,prop} of scenery){
  if(frontage&&visible(frontage.x,frontage.y,frontage.halfWidth+22,frontage.halfDepth+136)){
   drawClosedFrontageGround(c,frontage);
   drawClosedFrontage(c,frontage);
  }
  if(prop&&visible(prop.x,prop.y,28,50))paintProp(c,prop);
 }
 c.restore();
}
