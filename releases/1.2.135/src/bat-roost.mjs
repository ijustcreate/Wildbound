// Ground coordinates and an explicit perch height keep flight/collision separate
// from the upside-down pose drawn against the branch.
export function nearbyRoost(g,anchor,radius=150){
 let best=null,distance=radius;
 for(const tree of g.scenery||[]){
  if(tree.fallen||tree.depleted||!['tree','snow_tree','palm','forest_tree'].includes(tree.kind))continue;
  const base=tree.rootY??tree.y+(tree.size||64)*.35,d=Math.hypot(tree.x-anchor.x,base-anchor.y);
  if(d<distance){distance=d;best={x:tree.x+9,y:base,height:Math.max(25,(tree.size||64)*.5)};}
 }
 return best;
}
export function moveBatToRoost(g,bat,roost,dt){
 const dx=roost.x-bat.x,dy=roost.y-bat.y,d=Math.hypot(dx,dy);
 bat.roostHeight=roost.height;
 if(d>3){bat.animationAction=null;bat.state='hunt';bat.faceX=dx/d;bat.faceY=dy/d;g.moveActor(bat,dx/d*Math.min(d,bat.speed*dt),dy/d*Math.min(d,bat.speed*dt),true);return;}
 bat.x=roost.x;bat.y=roost.y;bat.moving=false;bat.animationAction='hang';bat.state='roost';
}
export function tickWildBatRoost(g,bat,dt,players){
 if(bat.kind!=='bat'||bat.hp<=0)return false;
 const range=bat.aggroRange||bat.vision||180;
 if(players.some(p=>p.hp>0&&!p.room&&Math.hypot(p.x-bat.x,p.y-bat.y)<=range)||bat.flash>0||bat.hit>0||bat.frozen>0||bat.state==='snared'){
  if(bat.state==='roost')bat.state='hunt';
  if(bat.animationAction==='hang')bat.animationAction=null;
  bat.roostHeight=0;return false;
 }
 // Scan only twice a second, not once per bat per frame.
 bat.roostScan=(bat.roostScan||0)-dt;
 if(bat.roostScan<=0){bat.roostPoint=nearbyRoost(g,bat);bat.roostScan=.5;}
 if(!bat.roostPoint){bat.roostHeight=0;if(bat.animationAction==='hang')bat.animationAction=null;return false;}
 moveBatToRoost(g,bat,bat.roostPoint,dt);return true;
}
