// One restrained footprint per committed attack. No runes, nested rings,
// distance ticks or decorative ground particles.
export function enemyTelegraph(e){
 if(e.hp<=0||e.room||e.trainRide||e.combatRole)return null;
 const s=e.speciesCombat;
 if(e.kind==='dragon'&&e.fireAction&&e.fireActionTimer>0)return {shape:'cone',x:e.x,y:e.y,angle:Math.atan2(e.faceY,e.faceX)+(e.fireAction==='tail'?Math.PI:0),range:e.fireAction==='tail'?86:(e.flameRange||190),arc:e.fireAction==='tail'?Math.acos(-.8):Math.acos(.72)};
 if(s?.phase==='windup'&&s.style!=='ranged')return {shape:s.style==='rush'?'lane':'cone',x:e.x,y:e.y,angle:Math.atan2(s.dy,s.dx),range:s.reach||60,width:s.width||26,arc:s.arc,start:s.style==='rush'?-(s.width||26)/2:0};
 if(e.eldritchWindup>0&&e.eldritchAim){
  const a=e.eldritchAim,base={x:e.x,y:e.y,angle:Math.atan2(a.dy,a.dx)};
  if(e.kind==='tree_ent')return {...base,shape:'circle',x:a.x,y:a.y,range:53};
  if(e.kind==='spore')return {...base,shape:'circle',range:78};
  if(['arcane_eye','watcher','eye_tentacle','jade_tentacle'].includes(e.kind))return {...base,shape:'lane',range:a.range||210,width:(a.width||15)*2};
  if(e.kind==='butterfly_dragon')return {...base,shape:'cone',range:230,arc:.68};
  return null;
 }
 if(e.constructAI?.phase==='specialWindup'){
  const radius=({ogre:91,enchanted_broom:82,forest_golem:98,mindflayer:145})[e.kind];
  if(radius)return {shape:'circle',x:e.x,y:e.y,range:radius};
  if(e.kind==='voodoo_doll'&&e.constructAI.aim)return {shape:'circle',x:e.constructAI.aim.x,y:e.constructAI.aim.y,range:24};
 }
 if(e.kind==='golem'&&e.state==='windup')return {shape:'circle',x:e.x,y:e.y,range:95};
 if(e.kind==='vine'&&e.state==='windup')return {shape:'cone',x:e.x,y:e.y,range:120,angle:Math.atan2(e.dy??e.faceY,e.dx??e.faceX),arc:.86};
 return null;
}
// Contours use the same one-world-pixel density as the native 48px actors.
// Round AFTER rotation so diagonal tells keep a crisp, world-aligned staircase.
export function telegraphContour(a){
 let points=[];
 if(a.shape==='lane')points=[[a.start||0,-a.width/2],[a.range,-a.width/2],[a.range,a.width/2],[a.start||0,a.width/2]];
 else{
  const arc=a.shape==='circle'?Math.PI:a.arc??1.1,steps=Math.max(12,Math.ceil(arc*a.range/5));
  if(a.shape!=='circle')points.push([0,0]);
  for(let i=0;i<=steps;i++){const angle=-arc+2*arc*i/steps;points.push([Math.cos(angle)*a.range,Math.sin(angle)*a.range]);}
 }
 const cos=Math.cos(a.angle||0),sin=Math.sin(a.angle||0);
 return points.map(([x,y])=>[Math.round(a.x+x*cos-y*sin),Math.round(a.y+x*sin+y*cos)]);
}
function pixelContour(c,points,size){
 const inset=(size-1)/2;c.beginPath();
 for(let i=0;i<points.length;i++){
  let [x,y]=points[i];const [tx,ty]=points[(i+1)%points.length],dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let error=dx+dy;
  for(;;){c.rect(x-inset,y-inset,size,size);if(x===tx&&y===ty)break;const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}
 }
 c.fill();
}
export function drawEnemyTelegraph(c,e){
 const a=enemyTelegraph(e);if(a)drawAttackFootprint(c,a);
}
export function drawAttackFootprint(c,a){
 const points=telegraphContour(a);
 c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
 c.fillStyle='#d5ad7210';c.fill();
 // One muted bronze contour, backed by native teal ink. No smooth strokes,
 // glow, nested rings or extra floor symbols; retain the exact damage footprint.
 c.fillStyle='#173b408c';pixelContour(c,points,3);
 c.fillStyle='#d5ad72bf';pixelContour(c,points,1);c.restore();
}
