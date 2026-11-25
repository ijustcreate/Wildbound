import {give} from './items.mjs';
import {BAYOU_GOBLIN_HUT,isBayouHutSurface,inBayouGoblinHut} from './bayou-goblin-hut-layout.mjs';

export const WISE_LITTLE_GOBLIN=Object.freeze({
 id:'wise-little-goblin',npcId:'wise-little-goblin',name:'Wise Little Goblin',title:'Keeper of the Reed Hut',
 x:BAYOU_GOBLIN_HUT.cx+22,y:BAYOU_GOBLIN_HUT.y+39,kind:'alley_goblin',sprite:'alley_goblin',
 hp:1,maxHp:1,goblinRole:'bayou-sage',faceX:0,faceY:1,moving:false,
});
const farewell={label:'I should be going.',action:'close'};
const say={
 greet:'Feet bring you here. Curiosity, I think, told them where to go. Sit a while, if your boots can keep still.',
 advice:'Cheap, advice is. Expensive is the lesson that makes you remember it. When the reeds all go quiet, pause and let the bayou finish speaking.',
 blade:'Light inside this hilt, there is. Draw it when the dark gives you a reason. Until then, let the frogs have the loudest song.',
 claimed:'An empty hook, I have now. Glad of it, I am. A fine blade ought to see more of the world than a hut wall.',
 full:'Space for it, your bag has none. Leave one pocket empty and come back. In a hurry, the blade is not.',
 gifted:'Yours, the green blade is. Bring it out for a good reason, and put it away for a better one.',
};
const claimed=p=>!!p.npcQuests?.wiseLittleGoblin?.bladeClaimed;
function near(g,p){
 return isBayouHutSurface(g.trainTest?.design)&&p.hp>0&&!p.room&&!p.swimming&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&
  !p.broomMount&&!p.wingHover&&!p.spectator&&!p.disconnected&&!p.lobbyDisconnected&&!p.unavailable&&(p.jumpHeight||0)<3&&inBayouGoblinHut(p.x,p.y,3)&&
  Math.hypot(p.x-WISE_LITTLE_GOBLIN.x,p.y-WISE_LITTLE_GOBLIN.y)<76;
}
export const bayouGoblinPrompt=(g,p)=>near(g,p)?'TALK TO WISE LITTLE GOBLIN':'';
export function interactBayouGoblin(g,p){
 if(!near(g,p))return false;
 p.ui={shop:'npc-dialogue',bayouGoblin:true,npcId:WISE_LITTLE_GOBLIN.id,ownerDevice:p.device,index:0,node:'greet'};
 p.consumeInput=true;p.moving=false;p.charge=0;
 return true;
}

export function bayouGoblinDialogueView(g,p){
 if(p.ui?.ownerDevice!==p.device||!near(g,p))return {text:'The Reed Hut is out of earshot.',choices:[farewell]};
 const node=p.ui.node,choices=[];
 if(node!=='advice')choices.push({label:'What should I know about the bayou?',action:'advice'});
 if(node==='blade'||node==='full'){
  if(!claimed(p))choices.push({label:'Accept the green blade',action:'take'});
 }else if(!['gifted','claimed'].includes(node))choices.push({label:'What is that hilt by the lamp?',action:claimed(p)?'claimed':'blade'});
 choices.push(farewell);
 return {npc:WISE_LITTLE_GOBLIN,text:say[node]||say.greet,choices};
}

export function bayouGoblinDialogueAction(g,p,action){
 const u=p.ui,view=bayouGoblinDialogueView(g,p);
 if(action==='use')action=view.choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=view.choices[Number(action.slice(7))]?.action;
 if(action==='close'||!view.npc){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','down','up'].includes(action)){
  u.index=(u.index+(['next','down'].includes(action)?1:-1)+view.choices.length)%view.choices.length;
  return true;
 }
 if(!view.choices.some(choice=>choice.action===action))return true;
 let node=action;
 if(action==='take'){
  if(claimed(p))node='claimed';
  else if(!give(p.inventory,'energy_blade_green'))node='full';
  else{
   (p.npcQuests??={}).wiseLittleGoblin={bladeClaimed:true};
   node='gifted';g.onSound?.('loot',p);g.persist?.();
  }
 }
 u.node=node;u.index=0;
 return true;
}
