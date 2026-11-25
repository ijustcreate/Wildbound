import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {HOGSMEADE_PROPS,HOGSMEADE_SHACK,inHogsmeadeBuilding} from './hogsmeade-layout.mjs';

const wardrobe=HOGSMEADE_PROPS.find(prop=>prop.id==='clawed-wardrobe');
export const BOGGART_CABINET={x:wardrobe.building.x+wardrobe.x,y:wardrobe.building.y+wardrobe.y};
export const SHACK_TRAPDOOR={x:8818,y:4114,w:36,h:23};
export const SHACK_TRAPDOOR_MESSAGE='Seems this passage is locked for now.';
export const BOGGART_COOLDOWN=45;
export const BOGGART_LOOT='Shrieking Shack Boggart';
const bunnyLifetime=7;
const cabinetReset='The cabinet is quiet for now.';
const coldAppearance={...DEFAULT_APPEARANCE,skin:'#26394e',shirt:'#252d3c',pants:'#17222e',shoes:'#111b2d',hair:'none',eyeColor:'#b8efff',build:'slim'};

export const BOGGART_FORMS=[
 {id:'spider',label:'a giant spider',kind:'spider',hp:115,damage:14,speed:58,size:61},
 {id:'dementor',label:'a Dementor',kind:'ghost',hp:124,damage:17,speed:55,size:53,happinessDevourer:true,
  appearance:coldAppearance,equipment:{head:'reaper_hood',chest:'warlock_robe',pants:'reaper_skirt',cape:'deaths_shroud'}},
 {id:'werewolf',label:'a werewolf',kind:'werewolf',hp:135,damage:18,speed:78,size:52},
 {id:'death-eater',label:'a Death Eater',kind:'skeleton_wizard',sprite:'player',hp:106,damage:19,speed:62,size:44,
  appearance:{...DEFAULT_APPEARANCE,hair:'none',skin:'#9e7965',shirt:'#292434',pants:'#282831'},
  equipment:{head:'death_eater_iron_mask',chest:'warlock_robe',cape:'warlock_cape',feet:'warlock_boots',hand1:'alley_ashwood_wand'}},
 {id:'bunny',label:'a little bunny'},
];

const surface=g=>g.trainTest?.design?.wildLands&&!g.trainTest.design.activeRoom;
const inside=point=>inHogsmeadeBuilding(HOGSMEADE_SHACK,point.x,point.y,-7);
const groundPlayer=p=>p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.broomMount&&!p.wingHover&&!p.swimming&&
 (p.jumpHeight||0)+(p.groundHeight||0)<12;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const shackBoggartState=g=>g.trainTest?.hogsmeade?.boggartCabinet;
const activeBoggart=(g,status)=>status?.activeId===undefined?null:g.enemies.find(e=>e.id===status.activeId&&e.shackBoggart);
const ready=(g,status)=>!status||!(status.readyAt>g.trainTest.time);

function eligible(g,p){
 if(!surface(g)||!groundPlayer(p)||p.ui||!inside(p))return false;
 const door=g.trainTest.hogsmeade?.[HOGSMEADE_SHACK.id];
 return !!(door?.unboarded||door?.broken);
}

function fixtureNear(g,p){
 if(!eligible(g,p))return '';
 const a=BOGGART_CABINET;
 if(p.y>a.y+7&&p.y<a.y+43&&Math.abs(p.x-a.x)<30)return 'cabinet';
 return distance(p,SHACK_TRAPDOOR)<=30?'trapdoor':'';
}

function say(g,text){
 const t=g.trainTest;
 t.notice=text;t.noticeUntil=t.time+4;g.message?.(text);
}

export function shackFixturePrompt(g,p){
 const fixture=fixtureNear(g,p);
 if(fixture==='trapdoor')return 'CHECK THE TRAPDOOR';
 if(fixture!=='cabinet')return '';
 const status=shackBoggartState(g);
 if(activeBoggart(g,status)?.hp>0||status?.bunnyUntil>g.trainTest.time)return 'BOGGART CABINET · OCCUPIED';
 return ready(g,status)?'OPEN THE BOGGART CABINET':'BOGGART CABINET · QUIET';
}

function useTrapdoor(g,p){
 p.consumeInput=true;
 say(g,SHACK_TRAPDOOR_MESSAGE);
 return true;
}

export function shackTrapdoorClick(g,p,world){
 if(!p||fixtureNear(g,p)!=='trapdoor')return false;
 const hatch=SHACK_TRAPDOOR;
 return Math.abs(world.x-hatch.x)<=hatch.w/2&&Math.abs(world.y-hatch.y)<=hatch.h/2;
}

function releasePoint(g,p){
 const {x,y}=BOGGART_CABINET;
 return [[0,35],[-21,31],[21,31],[0,48]].map(([dx,dy])=>({x:x+dx,y:y+dy})).find(point=>
  distance(p,point)>18&&!g.blocked(point.x,point.y,13)&&
  !g.players.some(player=>player!==p&&player.hp>0&&!player.room&&distance(player,point)<18)&&
  !g.enemies.some(enemy=>enemy.hp>0&&distance(enemy,point)<25));
}

export function interactShackFixture(g,p){
 const fixture=fixtureNear(g,p);
 if(fixture==='trapdoor')return useTrapdoor(g,p);
 if(fixture!=='cabinet')return false;
 p.consumeInput=true;
 const t=g.trainTest,status=(t.hogsmeade.boggartCabinet??={});
 if(activeBoggart(g,status)?.hp>0||status.bunnyUntil>t.time){say(g,'The Boggart is still loose.');return true;}
 if(!ready(g,status)){say(g,cabinetReset);return true;}
 const point=releasePoint(g,p);
 if(!point){say(g,'Step back and give the cabinet some room.');return true;}
 const form=BOGGART_FORMS[Math.min(BOGGART_FORMS.length-1,Math.floor(g.random()*BOGGART_FORMS.length))];
 status.openedAt=t.time;
 if(form.id==='bunny'){
  status.bunnyUntil=t.time+bunnyLifetime;
  status.readyAt=status.bunnyUntil+BOGGART_COOLDOWN;
 }else{
  const {id:shackBoggart,label,size:boggartSize,...body}=form,id=g.nextId++;
  const range=distance(point,p)||1;
  const actor={...structuredClone(body),...point,id,shackBoggart,boggartSize,name:'Boggart',group:id,
   homeX:point.x,homeY:point.y,maxHp:form.hp,faction:'enemy',state:'hunt',aggro:true,
   faceX:(p.x-point.x)/range,faceY:(p.y-point.y)/range,attack:0,step:0,flash:0,cooldown:1.1,timer:0,tacticTime:0,
   orbit:1,temperament:'patient'};
  status.activeId=id;
  g.enemies.push(actor);
 }
 say(g,`The Boggart takes the shape of ${form.label}.`);
 g.onSound?.('magic',BOGGART_CABINET);g.persist?.();
 return true;
}

export function shackBoggartTargets(targets){
 return targets.filter(target=>inside(target));
}

export function finishShackBoggart(g,enemy){
 if(!enemy.shackBoggart)return false;
 const status=shackBoggartState(g);
 enemy.defeated=true;enemy.deathTimer=0;
 enemy.state=enemy.animationAction='death';
 if(!surface(g)||status?.activeId!==enemy.id)return true;
 delete status.activeId;
 status.readyAt=g.trainTest.time+BOGGART_COOLDOWN;
 g.dropLoot(enemy.x,enemy.y+10,'dark_essence',3,BOGGART_LOOT,true);
 say(g,'The Boggart unravels into Dark Essence.');
 g.persist?.();
 return true;
}

export function tickShackBoggart(g){
 if(!surface(g))return;
 const status=shackBoggartState(g);
 if(status?.activeId===undefined)return;
 const enemy=activeBoggart(g,status);
 if(!enemy){
  delete status.activeId;
  status.readyAt=g.trainTest.time+BOGGART_COOLDOWN;
  g.persist?.();
 }else if(enemy.hp>0&&!inside(enemy)){
  Object.assign(enemy,{x:enemy.homeX,y:enemy.homeY,moving:false});
 }
}
