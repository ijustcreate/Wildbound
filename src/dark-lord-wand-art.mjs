// A 24px icon and native hand sprite share a bone-white taper, shadowed underside,
// and curved knuckle at the heel. The normal wand joint and casting tip drive both hands.
const PALE_BONE={outline:'#343631',shadow:'#848779',base:'#cecbb5',light:'#eee8ce',edge:'#fffaea'};

export function paintDarkLordWand(c,grip,tip,side='R'){
 const dx=tip.x-grip.x,dy=tip.y-grip.y,length=Math.max(1,Math.hypot(dx,dy));
 const flip=side==='L'?-1:1;
 const point=(along,across)=>({
  x:grip.x+dx*along-dy/length*across*flip,
  y:grip.y+dy*along+dx/length*across*flip,
 });
 const stroke=(from,to,width,color)=>{
  const vx=to.x-from.x,vy=to.y-from.y,steps=Math.max(1,Math.ceil(Math.hypot(vx,vy)*1.5));
  const offset=(width-1)/2;
  c.fillStyle=color;
  for(let i=0;i<=steps;i++)c.fillRect(Math.round(from.x+vx*i/steps-offset),Math.round(from.y+vy*i/steps-offset),width,width);
 };
 const heel=point(-.25,-1.75),knuckle=point(-.06,.75),throat=point(.24,.1),ridge=point(.67,-.5);
 stroke(heel,knuckle,4,PALE_BONE.outline);
 stroke(knuckle,throat,4,PALE_BONE.outline);
 stroke(throat,ridge,3,PALE_BONE.outline);
 stroke(ridge,tip,2,PALE_BONE.outline);
 stroke(heel,knuckle,2,PALE_BONE.shadow);
 stroke(knuckle,throat,2,PALE_BONE.base);
 stroke(throat,ridge,2,PALE_BONE.light);
 stroke(ridge,tip,1,PALE_BONE.light);
 stroke(point(.29,0),point(.8,-.4),1,PALE_BONE.edge);
 stroke(point(-.25,-1.9),point(-.16,-1.25),1,PALE_BONE.light);
}
