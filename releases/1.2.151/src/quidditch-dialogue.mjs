import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {QUIDDITCH_ROOM,QUIDDITCH_TEAMS} from './quidditch-layout.mjs';
import {controllerButtonNames} from './controls.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {resetQuidditchMatch} from './quidditch-match.mjs';

export const QUIDDITCH_COACH=Object.freeze({x:7830,y:5528,id:'quidditch-coach',name:'Madam Hooch',title:'Flying instructor'});
const coach={...QUIDDITCH_COACH,sprite:'player',kind:'player',hp:1,faceX:0,faceY:1,equipment:{},
 appearance:{...DEFAULT_APPEARANCE,skin:'#c39d7f',hair:'spikes',hairColor:'#a9afb3',shirt:'#555a52',pants:'#2e3c3a'}};
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
const offerReset={label:'Stop this match and reset.',action:'quidditch:ask-reset'};
const confirmReset={label:'End the match and put the chest back.',action:'quidditch:reset'};
export function quidditchDialogueView(g,p){
 const actor=talker(g,p);
 if(!actor)return {text:'The conversation has ended.',choices:[closeChoice]};
 const npc=actor===coach?coach:{...actor,sprite:'player',kind:'player',equipment:{},title:QUIDDITCH_TEAMS[actor.team].name+' team',
  appearance:{...DEFAULT_APPEARANCE,shirt:QUIDDITCH_TEAMS[actor.team].dark,pants:'#374342'}};
 const phase=g.trainTest.quidditch?.phase;
 const finished=phase==='finished';
 if(p.ui.node==='ask-reset'&&actor===coach&&phase==='playing')return {
  npc,text:'I can call off this match and put the balls back in the center chest. The score will reset for both teams.',choices:[confirmReset,closeChoice],
 };
 if(p.ui.node==='hello'&&(actor!==coach||finished))return {npc,text:'Good game! The balls are back in the center chest. Open it when everyone is ready for another match.',choices:[rulesChoice,closeChoice]};
 if(p.ui.node==='rules'){
  const knock=p.device==='keyboard'?'F':actionInputLabel(g,p,'interact');
  return {npc,text:`Borrow a broom and open the center chest. Fly close and press ${ballKey(p)} to grab the Quaffle or steal it from an opponent at your height. Press ${knock} near that rider to knock the ball loose. Aim at the other team’s hoops and press ${ballKey(p)} to throw for one point.`,choices:[finishChoice,closeChoice]};
 }
 if(p.ui.node==='snitch'){
  const grab=p.device==='keyboard'?'X or F':ballKey(p);
  return {npc,text:`Use ${ballKey(p)} to catch the Snitch. Fly level with an opposing carrier and use ${grab} to steal it. Bring it to your own stand and Interact to add three points and end the match. Use ${ballKey(p)} near a Bludger to knock it away.`,choices:[rulesChoice,closeChoice]};
 }
 if(actor===coach&&phase==='playing')return {npc,text:'The match is underway. If both teams need a fresh start, I can reset the field.',choices:[rulesChoice,finishChoice,offerReset,closeChoice]};
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
 if(action===confirmReset.action&&choices.includes(confirmReset)){
  resetQuidditchMatch(g.trainTest.quidditch);
  g.message?.('Madam Hooch stopped the match. The ball chest is back at midfield.');
  g.onSound?.('confirm',p);g.persist?.();return close();
 }
 if(action==='quidditch:rules'||action==='quidditch:snitch'||action===offerReset.action&&choices.includes(offerReset)){
  ui.node=action.slice('quidditch:'.length);ui.index=0;
 }
 return true;
}
