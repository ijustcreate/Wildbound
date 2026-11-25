import {MERLOCK_CAMPS,merlockCampGround} from './wild-merlock-camps.mjs';
import {wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';

const defaultRadius=80,minRadius=42,maxRadius=240;
const editedCamps=new WeakMap();
let targets;
function byId(id){
 if(!targets){
  targets=new Map();
  for(const camp of MERLOCK_CAMPS){
   const label=camp.key.slice('merlock-camp:'.length).split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
   targets.set(camp.key,{camp,label:label+' · Merlock camp'});
   for(const [index,member] of camp.members.entries()){
    targets.set(member.key,{camp,member,label:label+' · spawn post '+(index+1)});
   }
  }
 }
 return targets.get(id);
}

function wildSurface(game){
 const train=game?.trainTest;
 return train?.design?.wildLands&&!train.design.activeRoom?train:null;
}

function describe(target,position){
 return {id:(target.member||target.camp).key,label:target.label,x:position.x,y:position.y,
  category:'spawns',...(!target.member?{radius:position.radius??defaultRadius}:{})};
}

function resolvedCamp(camp,edits){
 const layout=edits.get(camp.key);
 if(!layout&&!camp.members.some(member=>edits.has(member.key)))return camp;
 const {x,y,radius=defaultRadius}=layout??camp,scale=radius/defaultRadius;
 const members=camp.members.map(member=>{
  const at=edits.get(member.key)??{
   x:Math.round(x+(member.x-camp.x)*scale),
   y:Math.round(y+(member.y-camp.y)*scale),
  };
  if(at.x===member.x&&at.y===member.y)return member;
  return {...member,x:at.x,y:at.y,layout:at.x+','+at.y};
 });
 return {...camp,x,y,radius,members};
}

export function effectiveMerlockCamps(game){
 const train=wildSurface(game);
 return train?(editedCamps.get(train)?.camps??MERLOCK_CAMPS):[];
}

export function spawnTargets(game,point){
 const train=wildSurface(game);
 if(!train||train.wildLandsOverview||point&&(!Number.isFinite(point.x)||!Number.isFinite(point.y)))return [];
 const nearby=[];
 for(const camp of effectiveMerlockCamps(game)){
  if(!point||Math.hypot(point.x-camp.x,point.y-camp.y)<=Math.max(110,camp.radius??defaultRadius)){
   nearby.push(describe(byId(camp.key),camp));
  }
  for(const member of camp.members)if(!point||Math.hypot(point.x-member.x,point.y-member.y)<=58){
   nearby.push(describe(byId(member.key),member));
  }
 }
 return point?nearby.sort((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y)):nearby;
}

export function getSpawn(game,id){
 const train=wildSurface(game),target=byId(id);
 if(!train||!target)return null;
 const camp=effectiveMerlockCamps(game).find(entry=>entry.key===target.camp.key);
 const position=target.member?camp.members.find(member=>member.key===id):camp;
 return describe(target,position);
}

function validPost(design,{x,y}){
 return x>=18&&y>=18&&x<=design.width-18&&y<=design.height-18&&
  wildLandsGround(design,x,y)==='beach'&&wildLandsSurfaceAt(design,x,y)==='grass'&&!wildLandsPathAt(x,y);
}

export function applySpawn(game,id,position){
 const train=wildSurface(game),target=byId(id);
 if(!train||!target)return false;
 const edits=new Map(editedCamps.get(train)?.edits);
 if(position===null)edits.delete(id);
 else{
  if(!Number.isFinite(position?.x)||!Number.isFinite(position?.y))return false;
  const x=Math.round(position.x),y=Math.round(position.y);
  const slot=getSpawn(game,id);
  if(target.member)edits.set(id,{x,y});
  else{
   const radius=Math.round(position.radius??slot.radius);
   if(!Number.isFinite(radius)||radius<minRadius||radius>maxRadius)return false;
   edits.set(id,{x,y,radius});
  }
 }
 const camp=resolvedCamp(target.camp,edits);
 if(camp!==target.camp&&(!merlockCampGround(train.design,camp)||
    !camp.members.every(member=>validPost(train.design,member)&&Math.hypot(member.x-camp.x,member.y-camp.y)<320)))return false;
 const camps=MERLOCK_CAMPS.map(base=>base.key===camp.key?camp:resolvedCamp(base,edits));
 editedCamps.set(train,{edits,camps});
 return true;
}
