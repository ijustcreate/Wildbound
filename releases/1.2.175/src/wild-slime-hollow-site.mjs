export const WILD_SLIME_HOLLOW=Object.freeze({
 id:'mossbell-hollow',name:'Mossbell Hollow',kind:'slime-encounter',x:12640,y:4632,radius:252,
 entrance:Object.freeze({x:12616,y:4880}),
 checkpoint:Object.freeze({x:12653,y:4910}),
 checkpointApproach:Object.freeze({x:12624,y:4922}),
 approach:Object.freeze({x:12592,y:5056}),
});

const {id,x,y,radius,entrance,checkpoint,checkpointApproach,approach}=WILD_SLIME_HOLLOW;
export const MOSSBELL_TRAIL=Object.freeze([
 approach,{x:12614,y:5008},{x:12630,y:4972},{x:12636,y:4940},checkpointApproach,
 entrance,{x:12614,y:4848},{x:12620,y:4808},{x:12628,y:4752},{x:12637,y:4704},
 {x:12643,y:4664},{x:12649,y:4618},{x:12640,y:4572},
].map(Object.freeze));

const trees=[
 [-315,-196,106,'pine'],[-249,-264,128,'oak'],[-159,-309,104,'birch'],[-53,-325,126,'oak'],
 [57,-326,112,'pine'],[164,-317,124,'oak'],[258,-262,114,'birch'],[327,-184,125,'oak'],
 [-337,-70,126,'oak'],[339,-62,107,'pine'],[-345,53,108,'birch'],[349,58,127,'oak'],
 [-314,170,123,'oak'],[332,183,114,'birch'],[-270,246,103,'pine'],[281,264,112,'pine'],
 [-209,326,105,'birch'],[305,333,119,'oak'],
];
const shrubs=[
 [-268,-124,52],[-238,-191,43],[-194,-233,57],[-126,-258,49],[-50,-273,54],
 [28,-277,51],[104,-269,58],[174,-242,43],[228,-199,56],[270,-136,52],
 [-286,-54,50],[284,-62,48],[-291,21,51],[291,24,56],[-278,91,46],[282,96,51],
 [-251,162,52],[249,160,48],[-207,209,62],[203,215,57],[-144,257,47],[143,256,52],
 [-89,267,53],[82,269,50],[-86,318,43],[80,320,42],[-102,365,49],[80,362,45],
];
const understory=[
 [-228,-119,37,'forest_woodland_daisy'],[-124,-193,35,'forest_meadow_tuft'],
 [127,-197,35,'forest_woodland_daisy'],[221,-108,34,'forest_meadow_tuft'],
 [-229,48,33,'forest_moss_rock_scatter'],[233,57,35,'forest_woodland_daisy'],
 [-179,180,37,'forest_meadow_tuft'],[174,179,34,'forest_moss_rock_scatter'],
 [-77,293,37,'forest_woodland_daisy'],[57,304,34,'forest_meadow_tuft'],
];

export function mossbellScenery(){
 const prop=(kind,dx,dy,size,index)=>({
  id:`${id}:${kind}:${index}`,kind,size,x:x+dx,y:y+dy-size*(kind==='tree'?.35:.19),rootY:y+dy,
  _biome:'forest',nativeSource:'forest',procedural:true,
 });
 return [
  ...trees.map(([dx,dy,size,treeType],i)=>({...prop('tree',dx,dy,size,i),treeType,seed:(i+1)*173})),
  ...shrubs.map(([dx,dy,size],i)=>prop('bush',dx,dy,size,i)),
  ...understory.map(([dx,dy,size,forestAsset],i)=>({...prop('forest_understory',dx,dy,size,i),forestAsset})),
  {
   id:`${id}:checkpoint`,kind:'mossbell_checkpoint',size:48,x:checkpoint.x,y:checkpoint.y-12,
   rootY:checkpoint.y,_biome:'forest',nativeSource:'forest',procedural:true,lightBlocker:false,
  },
 ];
}

export function mossbellClearsScenery(prop){
 const dx=prop.x-x,dy=(prop.rootY??prop.y)-y;
 const tree=prop.kind.includes('tree'),padding=tree?45:20;
 return (Math.abs(dx)<radius+padding&&Math.abs(dy)<radius+padding&&Math.hypot(dx,dy)<radius+padding)||
  (dy>=220&&dy<444&&Math.abs(dx+20)<104)||
  (tree&&dy>=275&&dy<480&&dx>-136&&dx<230);
}

export function mossbellSafePoint(px,py){
 return Math.abs(px-x)<360&&Math.abs(py-y)<458&&
  (Math.hypot(px-x,py-y)<360||Math.hypot(px-approach.x,py-approach.y)<105);
}

// The small stone body owns the same ground footprint as the painted plinth.
export function mossbellCheckpointBlocked(px,py,radius){
 const dx=Math.max(0,Math.abs(px-checkpoint.x)-10);
 const dy=Math.max(0,checkpoint.y-8-py,py-checkpoint.y);
 return dx*dx+dy*dy<radius*radius;
}

export function drawMossbellCheckpoint(c,prop,time){
 const x=Math.round(prop.x),y=Math.round(prop.rootY??prop.y);
 const pixel=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(x+dx,y+dy,w,h);};
 const flicker=Math.sin(time*4.1)+Math.sin(time*7.3)*.35;
 pixel(-14,-5,30,6,'#253e2c');
 pixel(-12,-8,24,8,'#414c3f');
 pixel(-10,-10,20,5,'#8e9171');
 pixel(-8,-20,16,14,'#566153');
 pixel(-7,-19,4,11,'#78806b');
 pixel(4,-18,3,11,'#3a4740');
 pixel(-10,-22,20,5,'#a1a27b');
 pixel(-8,-24,16,4,'#696d58');
 pixel(-11,-6,5,2,'#62683d');
 pixel(5,-6,4,2,'#7c8146');
 pixel(-6,-35,12,13,'#a57143');
 pixel(-4,-40,8,17,'#cb9554');
 pixel(-4,-33,8,10,'#efbc67');
 pixel(-2,-38-Math.round(flicker),4,13,'#ffe197');
 pixel(-2,-35,3,7,'#fff2bd');
}
