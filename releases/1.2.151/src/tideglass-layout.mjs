// The eastern reach is authored in world units, alongside Greywake and the Wild Lands sketch.
export const TIDEGLASS_BOUNDS={left:14800,top:750,right:19200,bottom:5990};
export const TIDEGLASS_BEACON={x:17040,y:1600};
export const TIDEGLASS_CAMP={x:15640,y:4820};
export const TIDEGLASS_VAULT={x:17118,y:1735};
export const TIDEGLASS_SIGNALS=[
 {id:'stack',name:'The Singing Stacks',x:18255,y:4225,color:'#7fcaca',inscription:'The southern stone holds the sound of every wave that strikes the stacks.'},
 {id:'orrery',name:'The Drowned Orrery',x:17048,y:3165,color:'#a8b8ff',inscription:'The flooded model still turns to follow the moon.'},
 {id:'wind',name:'Windward Arch',x:16328,y:2154,color:'#f0c47e',inscription:'The arch is worn smooth where sailors used to brush its inner stone for luck.'},
];
export const TIDEGLASS_LABELS=[
 {name:'Tideglass Reach',x:16020,y:5020},
 {name:'Stormwatch Beacon',x:17040,y:1420},
 ...TIDEGLASS_SIGNALS,
];
const mainland=[
 [14915,4660],[15040,4460],[15460,4420],[15570,4100],[15425,3750],[15395,3230],[15525,3030],
 [15785,2920],[15890,2630],[15765,2350],[15780,1910],[16008,1608],[16378,1310],[16722,1152],
 [17100,903],[17450,858],[17935,1034],[18265,1260],[18560,1640],[18670,2020],[18498,2340],
 [18275,2540],[17970,2712],[17955,2910],[18110,3160],[18435,3350],[18680,3730],[18770,4020],
 [18820,4330],[18675,4675],[18415,4938],[18148,5145],[17860,5230],[17510,5050],[17055,5150],
 [16790,5484],[16570,5720],[16285,5830],[15965,5730],[15670,5475],[15495,5280],[15105,5140],[14920,4915],
];
const outliers=[
 [[18740,2490],[18915,2465],[19005,2560],[18955,2690],[18775,2714],[18685,2610]],
 [[18830,4610],[19000,4540],[19110,4625],[19080,4740],[18890,4780],[18805,4720]],
 [[17815,5480],[17960,5410],[18050,5472],[18024,5596],[17860,5635],[17780,5565]],
];
export const TIDEGLASS_COASTLINES=[mainland,...outliers];
const lagoon=[
 [16600,3590],[16715,3440],[16925,3380],[17130,3390],[17255,3320],[17402,3380],
 [17510,3515],[17544,3710],[17422,3855],[17250,3930],[17005,3908],[16805,3980],
 [16670,3900],[16610,3780],
];
export const TIDEGLASS_PATHS=[
 [[15020,4795],[15520,4928],[15960,4800],[16365,4485],[16615,4165],[16500,3820],[16560,3510],
  [16785,3250],[17048,3220],[17050,2910],[16770,2670],[16690,2355],[16840,2030],[17020,1790]],
 [[16615,4165],[17010,4130],[17350,4170],[17670,4350],[18035,4345],[18255,4275]],
 [[16690,2355],[16445,2280],[16328,2190]],
 [[16365,4485],[16350,4850],[16470,5205],[16505,5460],[16390,5590]],
];

const limit=(n,min,max)=>Math.max(min,Math.min(max,n));
const step=(x,y,a,b)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],u=limit(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);
 return (x-a[0]-dx*u)**2+(y-a[1]-dy*u)**2;
};
function shape(x,y,points){
 let inside=false,distance=Infinity;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  distance=Math.min(distance,step(x,y,a,b));
 }
 return Math.sqrt(distance)*(inside?1:-1);
}
const edgeOffset=(x,y)=>Math.sin(x*.049+y*.021)*6+Math.sin(x*.101-y*.067)*3;
export function tideglassIntersects(left,top,right,bottom){
 return left<TIDEGLASS_BOUNDS.right&&right>TIDEGLASS_BOUNDS.left&&top<TIDEGLASS_BOUNDS.bottom&&bottom>TIDEGLASS_BOUNDS.top;
}
export function tideglassEdge(x,y){
 if(!tideglassIntersects(x-1,y-1,x+1,y+1))return -Infinity;
 let margin=shape(x,y,mainland);
 if(x>17620&&margin<110)for(const points of outliers)margin=Math.max(margin,shape(x,y,points));
 if(x>16480&&x<17660&&y>3200&&y<4100)margin=Math.min(margin,-shape(x,y,lagoon));
 return margin+edgeOffset(x,y);
}
export function tideglassSurface(x,y){
 const edge=tideglassEdge(x,y);
 if(edge>=0)return 'grass';
 if(edge> -90-Math.sin(x*.031-y*.029)*16)return 'shallow';
 return null;
}
export function tideglassOcean(x,y){
 return tideglassEdge(x,y)<0&&!(x>16530&&x<17630&&y>3250&&y<4040&&shape(x,y,lagoon)>0);
}
export function tideglassPathDistance(x,y){
 let best=Infinity;
 for(const path of TIDEGLASS_PATHS)for(let i=1;i<path.length;i++)best=Math.min(best,step(x,y,path[i-1],path[i]));
 return Math.sqrt(best);
}
export function tideglassGround(x,y){
 const edge=tideglassEdge(x,y);
 if(edge<0)return null;
 return edge<138&&y>2350?'beach':'tideglass';
}
export function tideglassSafePoint(x,y){
 return [TIDEGLASS_BEACON,TIDEGLASS_CAMP,TIDEGLASS_VAULT,...TIDEGLASS_SIGNALS].some(a=>(x-a.x)**2+(y-a.y)**2<190**2)||
  tideglassPathDistance(x,y)<78;
}
export const TIDEGLASS_BLOCKERS=[
 {x:TIDEGLASS_BEACON.x,y:TIDEGLASS_BEACON.y-28,rx:77,ry:35},
 {x:TIDEGLASS_CAMP.x,y:TIDEGLASS_CAMP.y-19,rx:65,ry:21},
];
