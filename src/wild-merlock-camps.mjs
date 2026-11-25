import {wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';

const ring=[[-49,-29],[49,-25],[-45,36],[45,37],[0,-55]];
const scenery=[[-73,0],[73,0],[-26,65],[28,61]];
const roles=['melee','spear','healer','melee','spear'];
const oldEastFlotsam={x:15082,y:4980};

// Hand-picked stretches of dry beach with open ground between the camp and the shore.
export const MERLOCK_CAMPS=[
 ['north-flotsam',6998,674,2],
 ['west-foam',764,2846,2],
 ['stranded-kelp',1156,5094,3],
 ['silt-spit',1384,7264,4],
 ['emberbank',3998,8534,5],
 ['river-shell',7048,8652,3],
 ['sunfish-bank',10328,8734,4],
 ['last-drift',12198,8610,3],
 ['ray-shore',14298,7484,5],
 ['east-flotsam',15330,4120,2]
].map(([id,x,y,count],i)=>{
 const key='merlock-camp:'+id;
 const members=ring.slice(0,count).map(([dx,dy],index)=>{
  const post={key:key+':'+index,kind:'shore_goblin',role:roles[index],index,x:x+dx,y:y+dy};
  // This stamp sends hibernated guards from the old default posts to the coast.
  if(id==='east-flotsam')post.layout=`${post.x},${post.y}`;
  return post;
 });
 return {key,biome:'beach',x,y,members,seed:43+i*79,variant:i%3};
});
const byCamp=new Map(MERLOCK_CAMPS.map(camp=>[camp.key,camp]));
export const merlockCampOf=enemy=>enemy.merlockCampCenter??byCamp.get(enemy.merlockCamp);
export const MERLOCK_CAMP_WAKE=760;
export const MERLOCK_CAMP_AGGRO=204;

export function restoreEastFlotsam(g){
 const t=g.trainTest,camp=byCamp.get('merlock-camp:east-flotsam');
 for(const layer of [g,t.alleyActors,t.hollowSurfaceActors,t.wildBiomeRoomActors?.surface]){
  for(const enemy of layer?.enemies??[]){
   if(enemy.merlockCamp!==camp.key||enemy.faction!=='enemy'||enemy.hp<=0||enemy.wildSpawnLayout!=null)continue;
   const post=camp.members[enemy.merlockPost];
   if(!post||enemy.wildSpawnKey!==post.key)continue;
   const [dx,dy]=ring[post.index],center=enemy.merlockCampCenter;
   if(enemy.homeX!==oldEastFlotsam.x+dx||enemy.homeY!==oldEastFlotsam.y+dy||
      center&&(center.x!==oldEastFlotsam.x||center.y!==oldEastFlotsam.y))continue;
   Object.assign(enemy,{x:post.x,y:post.y,homeX:post.x,homeY:post.y,
    merlockCampCenter:{x:camp.x,y:camp.y},wildSpawnLayout:post.layout});
  }
 }
}

export function merlockCampGround(design,camp){
 return [[0,0],...ring,...scenery].every(([dx,dy])=>{
  const x=camp.x+dx,y=camp.y+dy;
  return wildLandsGround(design,x,y)==='beach'&&wildLandsSurfaceAt(design,x,y)==='grass'&&!wildLandsPathAt(x,y);
 });
}

export function strollMerlockCamp(g,enemy,dt){
 // Brief staggered loops move only one or two guards at a time, within their own station.
 const time=g.trainTest.time+enemy.merlockPost*2.13;
 const phase=time%8;
 if(phase>2.7){enemy.moving=false;enemy.animationAction='idle';return;}
 const x=enemy.homeX+Math.sin(phase*1.1)*11;
 const y=enemy.homeY-Math.sin(phase*.96)*8;
 const dx=x-enemy.x,dy=y-enemy.y,distance=Math.hypot(dx,dy);
 if(distance<1){enemy.moving=false;enemy.animationAction='idle';return;}
 const step=Math.min(distance,enemy.speed*.29*dt)/distance;
 enemy.faceX=dx/distance;enemy.faceY=dy/distance;
 const moved=g.moveActor(enemy,dx*step,dy*step);
 enemy.step+=moved*.12;enemy.moving=moved>0;
 enemy.animationAction=enemy.moving?'walk':'idle';
}
