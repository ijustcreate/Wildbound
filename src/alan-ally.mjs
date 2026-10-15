import {damageEnemy} from './enemy-damage.mjs';
import {clearShot,navigateEnemy} from './navigation.mjs';
import {ALAN_EQUIPMENT} from './items.mjs';
import {creatures} from './definitions.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const alanActor=g=>(g.enemies||[]).find(e=>e.kind==='alan'&&e.hp>0&&!e.defeated);

// Roll count belongs to the destination, not to a particular player. It is
// captured with the world when the party travels away and returns.
export function alanRollResolved(g){
  if(!g.houseWorldsEnabled||!['forest','temple'].includes(g.generatedEnvironment)||g.alanArrived||g.houseWorlds?.alanEncountered)return false;
  g.alanZoneRolls=(g.alanZoneRolls||0)+1;
  if(g.alanZoneRolls!==2)return false;
  const board={x:800,y:800};
  const spots=[{x:570,y:745},{x:1030,y:745},{x:570,y:1030},{x:1030,y:1030}];
  const landing=spots.find(s=>!g.blocked(s.x,s.y,12,false,false,false,0))||g.players.find(p=>p.hp>0)||board;
  const e={id:g.nextId++,kind:'alan',skin:'alan',sprite:'alan',name:'Alan',...landing,
    hp:180,maxHp:180,speed:86,damage:18,faction:'ally',allyMode:'patrol',patrolX:board.x,patrolY:board.y,
    state:'jump',timer:.6,cooldown:0,flash:0,step:0,faceX:0,faceY:1,dx:0,dy:0,moving:false,
    jumpHeight:32,jumpVelocity:90,attack:0,equipment:{...ALAN_EQUIPMENT},
    appearance:{skin:'#c78956',shirt:'#b79357',pants:'#9c7140',shoes:'#493523',hair:'long',hairColor:'#49301e',face:'alan',build:'broad'}};
  g.configureCreature?.(e,false);e.faction='ally';e.equipment={...ALAN_EQUIPMENT};
  g.enemies.push(e);g.alanArrived=true;(g.houseWorlds??={version:2,worlds:{}}).alanEncountered=true;
  g.reveal={x:e.x,y:e.y,life:5};
  g.message('The jungle rustles! Alan leaps from Wildbound and joins the fight. Approach and interact to speak with him.');
  g.effects?.push({x:e.x,y:e.y-55,text:'ALAN JOINS THE FIGHT!',color:'#d8e994',life:2.5});
  g.persist?.();return e;
}

export function tickAlan(g,e,dt){
  e.moving=false;e.flash=Math.max(0,(e.flash||0)-dt);e.hit=Math.max(0,(e.hit||0)-dt);
  e.attack=Math.max(0,(e.attack||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);
  e.frozen=Math.max(0,(e.frozen||0)-dt);
  if(e.frozen>0)return;
  const talk=g.players.find(p=>p.ui?.shop==='npc-dialogue'&&p.ui.npcId==='alan'&&distance(p,e)<110);
  if(talk){const d=distance(e,talk)||1;e.faceX=(talk.x-e.x)/d;e.faceY=(talk.y-e.y)/d;e.animationAction='idle';return;}
  const owner=e.allyMode==='follow'?g.players.find(p=>p.id===e.allyOwner&&p.hp>0&&!p.room):null;
  if(e.allyMode==='follow'&&!owner){e.allyMode='patrol';e.allyOwner=null;}
  let target=null,nearest=Infinity;
  for(const q of g.enemies){
    if(q===e||q.hp<=0||q.defeated||q.practiceTarget||['ally','neutral'].includes(q.faction)||['ally','neutral'].includes(creatures[q.kind]?.faction))continue;
    if(owner&&distance(owner,q)>260)continue;
    const d=distance(e,q);if(d<nearest&&d<350){target=q;nearest=d;}
  }
  const anchor=owner||{x:e.patrolX??800,y:e.patrolY??800};
  const goal=target||anchor,d=distance(e,goal),stop=target?43:owner?56:110;
  if(d>stop){const oldX=e.x,oldY=e.y;
    if(g.house)navigateEnemy(g,e,goal,dt);else {const step=Math.min(d-stop,e.speed*dt);g.moveActor(e,(goal.x-e.x)/d*step,(goal.y-e.y)/d*step);}
    const moved=Math.hypot(e.x-oldX,e.y-oldY);e.moving=moved>.2;
    if(e.moving){e.faceX=(e.x-oldX)/moved;e.faceY=(e.y-oldY)/moved;}
  }
  if(target&&distance(e,target)<61&&e.cooldown<=0&&clearShot(g,e,target)){
    const reach=distance(e,target)||1;e.faceX=(target.x-e.x)/reach;e.faceY=(target.y-e.y)/reach;
    damageEnemy(target,e.damage);target.killedBy=owner?.id??g.players[0]?.id;
    e.cooldown=.75;e.attack=.35;e.animationAction='attack';e.poseTime=0;
  }else if(e.attack>0){e.animationAction='slash';e.poseTime=1-e.attack/.35;}
  else {e.animationAction=e.moving?'walk':'idle';e.poseTime=null;}
  if(e.jumpHeight>0){e.animationAction='jump';e.poseTime=null;}
  e.step=(e.step||0)+(e.moving?dt*8:dt*1.5);
}
