import {DIAGON_STREET_INSET} from './alley-street-layout.mjs';

export const GARDEN_LAWN={x:7110,y:3780,w:500,h:514};
export const GARDEN_SHOP_APPROACH={x:6948,y:4000,w:254,h:44};
export const GARDEN_STREET_APPROACH={x:7542,y:3976,w:270+DIAGON_STREET_INSET,h:88};
export const MAGE_GARDEN_AREAS=[GARDEN_LAWN,GARDEN_STREET_APPROACH,GARDEN_SHOP_APPROACH];
export const GARDEN_PERIMETER_FRONTAGES=[
 {x:6970,y:3735,theme:'garden-glazier',halfWidth:88,halfDepth:69},
 {x:6998,y:4150,theme:'garden-spindle',halfWidth:91,halfDepth:75},
 {x:7040,y:4382,theme:'garden-glazier',halfWidth:92,halfDepth:75},
 {x:7242,y:4382,theme:'pottery',halfWidth:89,halfDepth:77},
 {x:7698,y:3877,theme:'garden-spindle',halfWidth:74,halfDepth:57},
];
export const GARDEN_POOL={x:7401,y:4070,rx:69,ry:44};
export const GARDEN_POOL_WATER={rx:GARDEN_POOL.rx-11,ry:GARDEN_POOL.ry-9};
export const GARDEN_PATHS=[
 {width:54,points:[[7814+DIAGON_STREET_INSET,4020],[7624,4020],[7538,4020],[7484,4010]]},
 {width:44,points:[[7484,4010],[7417,3979],[7346,3984],[7293,4017],[7266,4072],[7280,4134],[7336,4171],[7426,4181],[7471,4150],[7481,4108],[7492,4053],[7484,4010]]},
 {width:38,points:[[7417,3979],[7395,3920],[7367,3872],[7311,3858],[7257,3891]]},
 {width:34,points:[[7293,4017],[7243,3977],[7196,3982]]},
 {width:36,points:[[7336,4171],[7284,4212],[7213,4210]]},
 {width:36,points:[[7257,3891],[7238,3851],[7238,3777]]},
 {width:38,points:[[7395,3920],[7424,3880],[7452,3836],[7490,3810],[7490,3777]]},
 {width:34,points:[[7196,3982],[7180,4021],[6984,4021]]},
];
export const GARDEN_BENCHES=[
 {id:'west-lawn',x:7209,y:4050,w:29},
 {id:'north-court',x:7337,y:3932,w:30},
 {id:'south-lawn',x:7375,y:4231,w:31},
 {id:'east-court',x:7474,y:3948,w:30},
];
export const gardenBenchSeatPoint=(bench,seat)=>({x:bench.x+seat*14,y:bench.y+18});
export const GARDEN_TREES=[
 {x:7202,y:3921,size:108,kind:'cedar'},
 {x:7272,y:3945,size:101,kind:'lilac'},
 {x:7439,y:3885,size:117,kind:'cedar'},
 {x:7397,y:4019,size:105,kind:'lilac'},
 {x:7195,y:4155,size:103,kind:'cedar'},
 {x:7220,y:4266,size:107,kind:'laurel'},
 {x:7474,y:4252,size:114,kind:'lilac'},
];
export const GARDEN_LAMPS=[{x:7571,y:3989},{x:7438,y:3953},{x:7244,y:4020},{x:7460,y:4197},{x:7290,y:3897}];

export const insideMageGarden=(x,y)=>MAGE_GARDEN_AREAS.some(a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h);

export function gardenSegmentDistance(x,y,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}

export function gardenPathAt(x,y,inset=0){
 for(const {width,points} of GARDEN_PATHS)for(let i=1;i<points.length;i++){
  if(gardenSegmentDistance(x,y,points[i-1],points[i])<width/2-inset)return true;
 }
 return false;
}

export function mageGardenFootstep(x,y){
 if(!insideMageGarden(x,y))return null;
 return gardenPathAt(x,y)?'stone':'grass';
}

const pondRadius=(x,y,rx,ry)=>((x-GARDEN_POOL.x)/rx)**2+((y-GARDEN_POOL.y)/ry)**2;
export const gardenPondContains=(x,y)=>pondRadius(x,y,GARDEN_POOL_WATER.rx,GARDEN_POOL_WATER.ry)<1;

function gardenPondRimBlocked(x,y,r,from,height){
 const rx=GARDEN_POOL.rx,ry=GARDEN_POOL.ry+4;
 const next=pondRadius(x,y,rx+r,ry+r);
 if(next>=1)return false;
 if(!from)return true;
 if(height>=8||pondRadius(from.x,from.y,rx,ry)<1)return false;
 const prior=pondRadius(from.x,from.y,rx+r,ry+r);
 return !(prior<1&&next>=prior);
}

export function mageGardenBlocked(x,y,r=0,from=null,height=0){
 return gardenPondRimBlocked(x,y,r,from,height)||
  GARDEN_TREES.some(tree=>Math.hypot(x-tree.x,y-tree.y)<12+r)||
  GARDEN_BENCHES.some(seat=>Math.abs(x-seat.x)<seat.w+r&&Math.abs(y-seat.y)<8+r)||
  GARDEN_LAMPS.some(lamp=>Math.hypot(x-lamp.x,y-lamp.y)<5+r);
}
