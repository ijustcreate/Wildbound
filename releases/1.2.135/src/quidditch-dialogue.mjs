import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {QUIDDITCH_ROOM,QUIDDITCH_TEAMS} from './quidditch-layout.mjs';
import {controllerButtonNames} from './controls.mjs';

export const QUIDDITCH_COACH=Object.freeze({x:7830,y:5528,id:'quidditch-coach',name:'Rowan Fairwind',title:'Pitch referee'});
const coach={...QUIDDITCH_COACH,sprite:'player',kind:'player',hp:1,faceX:0,faceY:1,equipment:{},
 appearance:{...DEFAULT_APPEARANCE,skin:'#b78264',hair:'sidepart',hairColor:'#a0876b',shirt:'#718271',pants:'#414d4b'}};
const room=g=>g.trainTest?.design.activeRoom===QUIDDITCH_ROOM;
const within=(p,q,r)=>Math.hypot(p.x-q.x,p.y-q.y)<=r;
const grounded=p=>p.hp>0&&!p.room&&!p.broomMount&&!(p.jumpHeight>0);
const closeChoice={label:'Back to the pitch.',action:'close'};
export const quidditchCoachActor=()=>coach;

function participants(g){
 const match=g.trainTest?.quidditch;
 return match?.phase==='finished'?[coach,...match.ai.filter(a=>a.landed)]:[coach];
}
export function nearbyQuidditchTalker(g,p){
 if(!room(g)||!grounded(p))return null;
 let nearby=null,radius=43;
 for(const actor of participants(g)){
  const distance=Math.hypot(p.x-actor.x,p.y-actor.y);
  if(distance<radius){nearby=actor;radius=distance;}
 }
 return nearby;
}
export function openQuidditchDialogue(g,p,actor){
 if(p.ui||!actor||!room(g)||!grounded(p)||!within(p,actor,43))return false;
 p.ui={shop:'npc-dialogue',ownerDevice:p.device,npcId:actor.id,quidditchTalk:actor.id,node:'hello',index:0};
 p.consumeInput=true;p.moving=false;
 g.onSound?.('ui',p);
 return true;
}
function talker(g,p){
 if(!room(g)||!grounded(p)||p.ui?.ownerDevice!==p.device)return null;
 return participants(g).find(actor=>actor.id===p.ui.quidditchTalk&&within(p,actor,62))||null;
}
function ballKey(p){return p.device==='keyboard'?'X':controllerButtonNames(p.controllerFamily||'generic')[2];}
const rulesChoice={label:'How do I play?',action:'quidditch:rules'};
const finishChoice={label:'What about the Snitch?',action:'quidditch:snitch'};
export function quidditchDialogueView(g,p){
 const actor=talker(g,p);
 if(!actor)return {text:'The conversation has ended.',choices:[closeChoice]};
 const npc=actor===coach?coach:{...actor,sprite:'player',kind:'player',equipment:{},title:QUIDDITCH_TEAMS[actor.team].name+' team',
  appearance:{...DEFAULT_APPEARANCE,shirt:QUIDDITCH_TEAMS[actor.team].dark,pants:'#374342'}};
 const finished=g.trainTest.quidditch?.phase==='finished';
 if(p.ui.node==='hello'&&(actor!==coach||finished))return {npc,text:'Good game! The balls are back in the center chest. Open it when everyone is ready for another match.',choices:[rulesChoice,closeChoice]};
 if(p.ui.node==='rules')return {npc,text:`Borrow a broom from the rack and open the center chest. Fly near the Quaffle and press ${ballKey(p)} to grab it or steal it from an opponent at your height. Aim at the other team’s hoops and press ${ballKey(p)} to throw. Each goal is one point.`,choices:[finishChoice,closeChoice]};
 if(p.ui.node==='snitch')return {npc,text:`Use ${ballKey(p)} when you get close to the Snitch. Bring it to your own team’s stand and Interact to add three points and end the match. The higher score wins. Use ${ballKey(p)} near a Bludger to knock it away.`,choices:[rulesChoice,closeChoice]};
 return {npc,text:'First time on the pitch? The broom rack is just to the south. Once you’re ready, open the ball chest at midfield.',choices:[rulesChoice,finishChoice,closeChoice]};
}

export function quidditchDialogueAction(g,p,action){
 const close=()=>{p.ui=null;p.consumeInput=true;return true;};
 if(action==='close'||!talker(g,p))return close();
 const ui=p.ui,choices=quidditchDialogueView(g,p).choices;
 if(['next','prev','up','down'].includes(action)){
  ui.index=(ui.index+(['next','down'].includes(action)?1:-1)+choices.length)%choices.length;
  return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close')return close();
 if(action==='quidditch:rules'||action==='quidditch:snitch'){
  ui.node=action.slice('quidditch:'.length);ui.index=0;
 }
 return true;
}
