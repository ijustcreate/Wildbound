import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {DEATH_EATER_MASKS} from './death-eater-masks.mjs';
import {collectNocturneBossLoot,dropNocturneBossLoot} from './nocturne-boss.mjs';
import {nocturneLaneX} from './alley-street-layout.mjs';

const masks=Object.keys(DEATH_EATER_MASKS);
const DUEL_LOOT='Nocturne duel spoils';
const CLOSE={label:'I’m just passing through.',action:'close'};
const choices=(question,challenge)=>[
 CLOSE,{label:question,action:'question'},{label:challenge,action:'provoke'},
];
const resident=(id,name,x,y,hp,damage,appearance,clothes,line,answer,question,challenge)=>({
 id,name,x:nocturneLaneX(x),y,maxHp:hp,damage,kind:'player',sprite:'player',hp:1,unattackable:true,faceX:0,faceY:1,
 title:'Nocturne Alley',appearance:{...DEFAULT_APPEARANCE,...appearance},equipment:clothes,
 line,answer,choices:choices(question,challenge),
});

export const NOCTURNE_DARK_WIZARDS=[
 resident('corvin-sable','Corvin Sable',9015,4735,86,23,
  {skin:'#bd947f',hair:'crop',hairColor:'#a2a4a6',shirt:'#344749',pants:'#393643'},
  {chest:'warlock_robe',feet:'warlock_boots',back:'alley_lantern_mantle'},
  'Mind the gutter. Some of what washes down here has teeth.',
  'Keep the wax intact. A seal like that is meant to keep something in.',
  'What are the seals on those packages?','I’m taking that package to the watch.'),
 resident('isolde-flint','Isolde Flint',9095,5120,96,25,
  {skin:'#9d6e63',hair:'bob',hairColor:'#171d26',shirt:'#603b52',pants:'#342c3e'},
  {head:'alley_inkcap',chest:'alley_moonstitch_robe',feet:'warlock_boots'},
  'Two coins for a warning. Keep your fingers off the black glass.',
  'Black glass holds an echo of the last wand turned against it.',
  'Why is the glass dangerous?','You’re hiding cursed goods. Hand them over.'),
];

const inAlley=g=>g.trainTest?.design.activeRoom==='diagon';
const wizardById=id=>NOCTURNE_DARK_WIZARDS.find(w=>w.id===id);
const duelFor=(g,id)=>g.trainTest?.nocturneDarkWizards?.[id];
const canTalk=(g,p,w,r)=>inAlley(g)&&!!w&&!duelFor(g,w.id)&&p.hp>0&&!p.trainRide&&!p.room&&
 !p.broomMount&&!p.controlledFollowerId&&Math.hypot(p.x-w.x,p.y-w.y)<r;
const nearby=(g,p)=>NOCTURNE_DARK_WIZARDS.find(w=>canTalk(g,p,w,68));

export function nocturneDarkWizardPrompt(g,p){
 const wizard=nearby(g,p);
 return wizard?`TALK TO ${wizard.name.toUpperCase()}`:'';
}

export function openNocturneDarkWizard(g,p){
 const wizard=nearby(g,p);
 if(!wizard||p.ui)return false;
 p.ui={shop:'npc-dialogue',nocturneDarkWizard:true,npcId:wizard.id,ownerDevice:p.device,node:'intro',index:0};
 p.consumeInput=true;p.charge=0;p.moving=false;
 return true;
}

export function validNocturneDarkWizardTalk(g,p){
 const u=p.ui;
 return !!u?.nocturneDarkWizard&&u.ownerDevice===p.device&&g.players.filter(q=>q.device===p.device).length===1&&
  canTalk(g,p,wizardById(u.npcId),96);
}

export function nocturneDarkWizardView(g,p){
 const u=p.ui,w=wizardById(u.npcId);
 if(!validNocturneDarkWizardTalk(g,p))return {npc:w,text:'The wizard has turned away.',choices:[CLOSE]};
 return {npc:w,title:w.title,text:u.node==='question'?w.answer:w.line,choices:w.choices};
}

function provoke(g,p,w){
 const {id:darkWizardId,name,x,y,maxHp,damage,appearance,equipment}=w;
 const id=g.nextId++;
 const dx=p.x-x,dy=p.y-y,length=Math.hypot(dx,dy)||1;
 const actor={
  id,name,x,y,maxHp,hp:maxHp,damage,speed:73,darkWizardId,group:id,kind:'skeleton_wizard',sprite:'player',
  faction:'enemy',state:'hunt',aggro:true,faceX:dx/length,faceY:dy/length,appearance,
  equipment:{...equipment,head:masks[w===NOCTURNE_DARK_WIZARDS[0]?0:1],hand1:'alley_ashwood_wand'},
  cooldown:.75,attack:0,step:0,flash:0,timer:0,tacticTime:0,
 };
 (g.trainTest.nocturneDarkWizards??={})[darkWizardId]={status:'hostile',actor};
 g.enemies.push(actor);
 for(const q of g.players)if(q.ui?.nocturneDarkWizard&&q.ui.npcId===darkWizardId){
  q.ui=null;q.consumeInput=true;
 }
 g.message?.(`${name} draws a wand!`);
 g.onSound?.('magic',actor);g.persist?.();
}

export function nocturneDarkWizardAction(g,p,action){
 if(!p.ui?.nocturneDarkWizard)return false;
 if(action==='close'||!validNocturneDarkWizardTalk(g,p)){
  p.ui=null;p.consumeInput=true;return true;
 }
 const u=p.ui,{npc,choices}=nocturneDarkWizardView(g,p);
 if(['next','prev','down','up'].includes(action)){
  u.index=(u.index+(['next','down'].includes(action)?1:-1)+choices.length)%choices.length;
  return true;
 }
 if(action==='use')action=choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;}
 if(action==='question'){u.node='question';u.index=0;u.revision=(u.revision||0)+1;}
 if(action==='provoke')provoke(g,p,npc);
 return true;
}

export function tickNocturneDarkWizards(g){
 if(!inAlley(g))return;
 for(const duel of Object.values(g.trainTest.nocturneDarkWizards||{})){
  if(duel.status!=='hostile'||!duel.actor)continue;
  const live=g.enemies.find(e=>e.id===duel.actor.id&&e.darkWizardId===duel.actor.darkWizardId);
  if(live){duel.actor=live;continue;}
  g.enemies.push(duel.actor);
  g.nextId=Math.max(g.nextId,duel.actor.id+1);
 }
 for(const drop of g.trainTest.nocturneDarkWizardDrops||[]){
  if(!g.loot.some(l=>l.id===drop.id&&isNocturneDarkWizardLoot(l)))g.loot.push(drop);
  g.nextId=Math.max(g.nextId,drop.id+1);
 }
}

export function nocturneDarkWizardActors(g){
 if(!inAlley(g))return [];
 return [
  ...NOCTURNE_DARK_WIZARDS.filter(w=>!duelFor(g,w.id)),
  ...g.enemies.filter(e=>e.darkWizardId&&(e.hp>0||(e.deathTimer||0)<1.2)),
 ];
}

export const isNocturneDarkWizardLoot=loot=>loot?.source===DUEL_LOOT&&
 (loot.type==='dark_essence'||Object.hasOwn(DEATH_EATER_MASKS,loot.type));

export function dropNocturneDarkWizardLoot(g,enemy){
 if(dropNocturneBossLoot(g,enemy))return true;
 const duel=duelFor(g,enemy.darkWizardId);
 if(!duel||!inAlley(g)||!wizardById(enemy.darkWizardId)||enemy.hp>0)return false;
 if(duel.status==='defeated')return true;
 if(enemy.id!==duel.actor?.id)return false;
 duel.status='defeated';delete duel.actor;
 const drops=g.trainTest.nocturneDarkWizardDrops??=[];
 const drop=(type,qty,offset)=>{
  g.dropLoot(enemy.x+offset,enemy.y+10,type,qty,DUEL_LOOT,true);
  drops.push(g.loot.at(-1));
 };
 drop('dark_essence',enemy.darkWizardId==='isolde-flint'?3:2,-11);
 const maskRoll=g.random();
 if(maskRoll<.42)drop(masks[Math.floor(maskRoll/.42*masks.length)],1,13);
 g.persist?.();
 return true;
}

export function collectNocturneDarkWizardLoot(g,p,loot){
 if(collectNocturneBossLoot(g,p,loot))return true;
 if(!inAlley(g)||!isNocturneDarkWizardLoot(loot))return false;
 const t=g.trainTest,drops=t.nocturneDarkWizardDrops||[];
 if(!drops.some(d=>d.id===loot.id&&d.type===loot.type))return false;
 t.nocturneDarkWizardDrops=drops.filter(d=>d.id!==loot.id);
 if(!t.persistent&&t.returnPlayers?.some(q=>q.id===p.id)){
  const receipt=((t.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});
  receipt.delta[loot.type]=(receipt.delta[loot.type]||0)+loot.qty;
 }
 return true;
}
