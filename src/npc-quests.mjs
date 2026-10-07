import {getNpcQuestConfig} from './npc-quest-data.mjs';
import {ITEMS} from './items.mjs';
import {merchantSites} from './traveling-merchant.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';

const clone=x=>structuredClone(x),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=p=>p.profileId||String(p.id);
const scene=g=>g.questSceneToken||=(globalThis.crypto?.randomUUID?.()||`${Date.now()}:${g.seed}:${g.nextId++}`);
export function npcQuestState(p,id=getNpcQuestConfig().id){
  p.npcQuests||={};
  return p.npcQuests[id]||=( {version:1,completed:[],active:null,encounters:0,lastRewardEncounter:-1} );
}
function currentStage(p,config){const s=npcQuestState(p,config.id);return config.stages.find(stage=>!s.completed.some(c=>c.stageId===stage.id));}
function meet(p,npc){const s=npcQuestState(p,npc.npcId);if(s.seenEncounter!==npc.encounter){s.seenEncounter=npc.encounter;s.encounters++;}return s;}
function freeSites(g,p,npc){return merchantSites(g).filter(a=>distance(a,npc)>100&&distance(a,p)>90);}
function establishObjective(g,p,npc){
  const s=npcQuestState(p,npc.npcId),a=s.active;if(!a)return;
  const world=scene(g);
  if(a.world!==world){a.world=world;a.target=null;a.spawned=0;}
  if(a.contract.objective.type==='collect')return;
  if(!a.target){const sites=freeSites(g,p,npc);a.target=sites[Math.min(sites.length-1,Math.floor(sites.length*.3))]||null;}
  if(a.contract.objective.type!=='defeat'||!a.target)return;
  const goal=a.contract.objective;
  const live=(g.enemies||[]).filter(e=>e.questOwner===key(p)&&e.questStage===a.stageId&&e.questNpc===npc.npcId&&e.hp>0).length;
  const missing=Math.max(0,goal.count-a.progress-live),capacity=Math.max(0,12-(g.enemies||[]).filter(e=>e.questNpc&&e.hp>0).length);
  let spawned=0;
  for(let n=0;n<Math.min(missing,capacity);n++){
    let position=null;
    for(let i=0;i<16;i++){const angle=(n+i)*2.4,r=20+i*8,x=a.target.x+Math.cos(angle)*r,y=a.target.y+Math.sin(angle)*r;
      if(!g.blocked(x,y,12,false,false,false,0)&&!g.players.some(q=>distance({x,y},q)<70)){position={x,y};break;}}
    if(!position)continue;
    const e={id:g.nextId++,kind:goal.kind,skin:goal.kind,...position,group:`quest:${key(p)}:${a.stageId}`,hp:goal.kind==='bat'?32:65,maxHp:goal.kind==='bat'?32:65,
      speed:goal.kind==='bat'?76:52,damage:9,state:'hunt',timer:1,cooldown:1,flash:0,step:0,faceX:0,faceY:1,dx:0,dy:0,
      equipment:goal.kind==='skeleton'?{hand1:'sword'}:{},temperament:'patient',orbit:1,tacticTime:2,eventBound:false,
      questOwner:key(p),questNpc:npc.npcId,questStage:a.stageId};
    g.configureCreature?.(e,false);g.enemies.push(e);spawned++;
  }
  a.spawned=(a.spawned||0)+spawned;
}
export function spawnQuestNpc(g){
  const config=getNpcQuestConfig(),existing=(g.questNpcs||[]).find(n=>n.npcId===config.id);
  if(!existing&&(g.questNpcs||[]).length>=4)return false;
  const sites=merchantSites(g),position=sites[Math.floor(Math.max(0,Math.min(.999,g.random?.()??.5))*sites.length)];
  if(!position&&!existing){g.message?.('The wayfarer could not find a safe campsite.');return false;}
  const npc=existing||{id:g.nextId++,npcId:config.id,...position,campX:position.x,campY:position.y,hp:1,maxHp:1,faction:'ally',invincible:true,unattackable:true,
    faceX:0,faceY:1,moving:false,step:0,equipment:clone(config.equipment),appearance:clone(config.appearance||DEFAULT_APPEARANCE),name:config.name,title:config.title};
  npc.encounter=`${scene(g)}:${g.nextId++}`;
  if(!existing)(g.questNpcs||=[]).push(npc);
  for(const p of g.players){meet(p,npc);establishObjective(g,p,npc);}
  g.reveal={x:npc.x,y:npc.y,life:4};g.message?.(`${config.name} has made camp. Approach and interact to talk.`);g.persist?.();return npc;
}
export function openNpcDialogue(g,p){
  if(p.ui||p.room||p.hp<=0||g.phase!=='play')return false;
  const npc=(g.questNpcs||[]).filter(n=>distance(n,p)<=68).sort((a,b)=>distance(a,p)-distance(b,p))[0];if(!npc)return false;
  const config=getNpcQuestConfig();meet(p,npc);establishObjective(g,p,npc);
  p.ui={shop:'npc-dialogue',ownerDevice:p.device,npcId:npc.npcId,node:config.dialogue.start,index:0};
  p.consumeInput=true;p.charge=0;p.interactUsed=true;p.menuRepeat=0;g.onSound?.('ui',p);g.persist?.();return true;
}
const carried=(p,item)=>(p.inventory||[]).reduce((n,s)=>n+(s?.type===item?s.qty||1:0),0);
function progress(p,a){return a.contract.objective.type==='collect'?Math.min(a.contract.objective.count,carried(p,a.contract.objective.item)):a.progress||0;}
function choicesForNode(config,node){const def=config.dialogue.nodes[node];return (def?.choices||[]).map(c=>({label:c.label,action:'node:'+c.next}));}
export function npcDialogueView(g,p){
  const config=getNpcQuestConfig(),u=p.ui||{},npc=(g.questNpcs||[]).find(n=>n.npcId===u.npcId);
  const s=npcQuestState(p,config.id),stage=currentStage(p,config),a=s.active;
  const view={npc:{...npc,name:config.name,title:config.title,equipment:config.equipment,appearance:config.appearance},title:config.title,text:'',choices:[],
    stage:Math.min(s.completed.length+1,config.stages.length),totalStages:config.stages.length,notice:u.notice||'',quest:null};
  if(a){const value=progress(p,a);view.quest={title:a.contract.title,description:a.contract.description,progress:value,target:a.contract.objective.count,ready:value>=a.contract.objective.count,reward:a.reward};}
  if(u.node==='quests'){
    if(a){view.text=view.quest.ready?(a.contract.completion||'You kept your word. Let me give you something for the road.'):`${a.contract.description} Return when the work is done.`;
      view.choices=view.quest.ready?[{label:`Collect ${ITEMS[a.reward]?.name||a.reward}`,action:'claim'}]:[{label:'Show me the route again.',action:'route'}];
      view.choices.push({label:'Tell me about your expedition.',action:'node:'+ (config.dialogue.nodes.story?'story':config.dialogue.start)},{label:'I’ll return soon.',action:'close'});
    }else if(!stage){view.text='Every piece of this kit has a story. Now it has yours. You have earned the full Keeper set—and a friend on every road.';view.choices=[{label:'Until our next adventure.',action:'close'}];}
    else if(s.lastRewardEncounter===s.encounters){view.text='One promise at a time. Keep that piece safe. When our paths cross again, I’ll have another task for you.';view.choices=[{label:'Tell me more about yourself.',action:'node:'+(config.dialogue.nodes.story?'story':config.dialogue.start)},{label:`Safe travels, ${config.name}.`,action:'close'}];}
    else {view.title=stage.title;view.text='There is more than one way to help. Which road suits you?';view.choices=stage.branches.map((b,n)=>({label:b.label,detail:b.description,action:'offer:'+n}));view.choices.push({label:'Perhaps another time.',action:'close'});}
  }else if(u.node==='offer'&&stage&&!a){const b=stage.branches[u.offerBranch];
    if(b){view.title=b.title;view.text=b.description;view.quest={title:b.title,description:b.description,progress:0,target:b.objective.count,ready:false,reward:stage.reward};view.choices=[{label:'I accept. You have my word.',action:'accept'},{label:'Tell me about the other path.',action:'node:quests'},{label:'I’m not ready yet.',action:'close'}];}
  }else {const node=config.dialogue.nodes[u.node]?u.node:config.dialogue.start,def=config.dialogue.nodes[node];view.text=def?.text||config.greeting;view.choices=choicesForNode(config,node);}
  if(!view.choices.length)view.choices=[{label:'Goodbye.',action:'close'}];
  return view;
}
function validTalk(g,p){const u=p.ui,npc=(g.questNpcs||[]).find(n=>n.npcId===u?.npcId);return u?.shop==='npc-dialogue'&&u.ownerDevice===p.device&&g.players.filter(q=>q.device===p.device).length===1&&npc&&!p.room&&p.hp>0&&distance(npc,p)<=110;}
export function npcDialogueAction(g,p,action){
  const u=p.ui;if(u?.shop!=='npc-dialogue')return false;
  if(!validTalk(g,p)||action==='close'){p.ui=null;p.consumeInput=true;return true;}
  const config=getNpcQuestConfig(),s=npcQuestState(p,config.id),view=npcDialogueView(g,p),npc=(g.questNpcs||[]).find(n=>n.npcId===u.npcId);
  if(['next','prev','down','up'].includes(action)){u.index=(Math.max(0,u.index||0)+(['next','down'].includes(action)?1:-1)+view.choices.length)%view.choices.length;return true;}
  if(action==='use')action=view.choices[u.index||0]?.action;
  if(action?.startsWith('choice:'))action=view.choices[Number(action.slice(7))]?.action;
  if(!view.choices.some(c=>c.action===action&&!c.disabled))return true;
  if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
  if(action.startsWith('node:')){u.node=action.slice(5);u.index=0;delete u.notice;}
  else if(action.startsWith('offer:')){u.offerBranch=Number(action.slice(6));u.node='offer';u.index=0;}
  else if(action==='accept'){
    const stage=currentStage(p,config),branch=stage?.branches[u.offerBranch];if(!branch||s.active||s.lastRewardEncounter===s.encounters)return true;
    if(!ITEMS[stage.reward]){u.notice='This quest reward is not configured yet.';return true;}
    s.active={stageId:stage.id,branchId:branch.id,contract:clone(branch),reward:stage.reward,progress:0,acceptedAt:g.time||0};
    establishObjective(g,p,npc);u.node='quests';u.index=0;u.notice='Quest accepted. Your choice is recorded in your character journal.';g.message?.(`${p.name}: ${branch.title} accepted.`);g.persist?.();
  }else if(action==='claim'){
    const a=s.active;if(!a||progress(p,a)<a.contract.objective.count||s.completed.some(c=>c.stageId===a.stageId))return true;
    if(!ITEMS[a.reward]){u.notice='The saved reward item is unavailable. Progress has been kept.';return true;}
    let slot=p.inventory.findIndex(i=>!i);if(slot<0&&p.inventory.length>=24){u.notice='Free one backpack slot. Your reward will stay with me.';return true;}if(slot<0)slot=p.inventory.length;
    if(a.contract.objective.type==='collect'){let left=a.contract.objective.count;for(let n=0;n<p.inventory.length&&left>0;n++){const item=p.inventory[n];if(item?.type!==a.contract.objective.item)continue;const take=Math.min(left,item.qty||1);left-=take;item.qty=(item.qty||1)-take;if(item.qty<=0)p.inventory[n]=null;}}
    p.inventory[slot]={type:a.reward,qty:1};s.completed.push({stageId:a.stageId,branchId:a.branchId,reward:a.reward});s.lastRewardEncounter=s.encounters;s.active=null;
    u.node='quests';u.index=0;u.notice=`${ITEMS[a.reward].name} received. We’ll continue when our paths cross again.`;g.onSound?.('loot',p);g.persist?.();
  }else if(action==='route'){if(s.active?.target)g.reveal={...s.active.target,life:6};u.notice=s.active?.contract.objective.type==='collect'?'Gather the supplies listed in your quest, then bring them back.':'Follow the teal quest marker. Your party can help with this task.';}
  return true;
}
export function recordNpcQuestKill(g,e){
  if(e.faction==='ally'||e.faction==='neutral'||e.questCounted)return;
  let changed=false;
  for(const p of g.players){const config=getNpcQuestConfig(),s=p.npcQuests?.[config.id],a=s?.active;
    if(!a||a.contract.objective.type!=='defeat'||a.contract.objective.kind!==e.kind)continue;
    const credit=e.questOwner===key(p)&&e.questStage===a.stageId||g.players.some(q=>q.id===e.killedBy);
    if(credit&&a.progress<a.contract.objective.count){a.progress++;changed=true;g.uiRevision=(g.uiRevision||0)+1;if(a.progress===a.contract.objective.count)g.message?.(`${p.name}: ${a.contract.title} complete. Return to ${config.name}.`);}
  }
  e.questCounted=true;
  if(changed)g.persist?.();
}
export function tickNpcQuests(g,dt){
  if(g.phase!=='play')return;
  for(const npc of g.questNpcs||[]){npc.moving=false;const talk=g.players.find(p=>p.ui?.shop==='npc-dialogue'&&p.ui.npcId===npc.npcId);if(talk){const d=distance(talk,npc)||1;npc.faceX=(talk.x-npc.x)/d;npc.faceY=(talk.y-npc.y)/d;}}
  for(const p of g.players){if(p.ui?.shop==='npc-dialogue'&&!validTalk(g,p))p.ui=null;
    for(const s of Object.values(p.npcQuests||{})){const a=s.active;if(!a||p.hp<=0||p.room)continue;
      if(a.contract.objective.type==='visit'&&a.world===scene(g)&&a.target&&distance(p,a.target)<36&&a.progress<a.contract.objective.count){a.progress=a.contract.objective.count;g.message?.(`${p.name}: route surveyed. Return to the wayfarer.`);g.persist?.();}
    }
  }
  g.questSpawnTimer=(g.questSpawnTimer||0)-dt;
  if(g.questSpawnTimer<=0){g.questSpawnTimer=1;for(const npc of g.questNpcs||[])for(const p of g.players)if(p.npcQuests?.[npc.npcId]?.active)establishObjective(g,p,npc);}
}
export function drawQuestNpc(c,g,npc,animator){
  const config=getNpcQuestConfig();animator.draw(c,{...npc,equipment:config.equipment,appearance:config.appearance},g.time,48);
  c.save();c.textAlign='center';c.font='bold 10px sans-serif';c.fillStyle='#b6e8d6';c.fillText(config.name,npc.x,npc.y-94);
  c.font='9px sans-serif';c.fillStyle='#efd5a1';c.fillText('Interact · Talk',npc.x,npc.y+18);c.fillStyle='#ead090';c.fillRect(npc.x-1,npc.y-110,3,7);c.fillRect(npc.x-1,npc.y-100,3,2);c.restore();
}
export function drawNpcQuestMarkers(c,g,visible=()=>true){
  c.save();for(const p of g.players){const s=p.npcQuests?.[getNpcQuestConfig().id],a=s?.active;if(!a?.target||a.world!==g.questSceneToken||a.contract.objective.type==='collect'||!visible(a.target))continue;
    const t=a.target;c.strokeStyle='#79d9c0';c.lineWidth=2;c.beginPath();c.ellipse(t.x,t.y,24,12,0,0,Math.PI*2);c.stroke();c.fillStyle='#d5f5df';c.textAlign='center';c.font='9px sans-serif';c.fillText(`${p.name} · ${a.contract.title}`,t.x,t.y-27);
  }c.restore();
}

// Only quest-exclusive possessions travel with the contract. Other world-local
// supplies, HP and positions retain the existing house-world snapshot rules.
export function preserveQuestGear(source,target){
  const special=i=>!!ITEMS[typeof i==='string'?i:i?.type]?.questReward;
  const lists=p=>({pack:p.inventory,...Object.fromEntries((p.chests||[]).map((a,i)=>['chest:'+i,a])),starter:p.starterChest,robot:p.robotStock,overflow:p.field?.overflow});
  const old=Object.fromEntries(Object.entries(lists(source)).map(([k,a])=>[k,Array.isArray(a)?a.map(i=>special(i)?clone(i):null):null]));
  target.field||={};target.field.overflow||=[];target.inventory||=[];
  const push=item=>{const index=target.inventory.findIndex(i=>!i);if(index>=0)target.inventory[index]=item;else if(target.inventory.length<24)target.inventory.push(item);else target.field.overflow.push(item);};
  for(const a of Object.values(lists(target)))if(Array.isArray(a))for(let i=0;i<a.length;i++)if(special(a[i]))a[i]=null;
  const destinations=lists(target);
  for(const [k,items]of Object.entries(old))for(let i=0;i<(items?.length||0);i++){const item=items[i];if(!item)continue;const a=destinations[k];if(Array.isArray(a)&&!a[i])a[i]=item;else push(item);}
  target.equipment||={};target.equipmentSockets||={};
  for(const slot of Object.keys(target.equipment))if(special(target.equipment[slot])){target.equipment[slot]=null;delete target.equipmentSockets[slot];}
  for(const [slot,id]of Object.entries(source.equipment||{}))if(special(id)){
    if(target.equipment[slot])push({type:target.equipment[slot],qty:1,...(target.equipmentSockets[slot]?.length?{sockets:clone(target.equipmentSockets[slot])}:{})});
    target.equipment[slot]=id;target.equipmentSockets[slot]=clone(source.equipmentSockets?.[slot]||[]);
  }
}
