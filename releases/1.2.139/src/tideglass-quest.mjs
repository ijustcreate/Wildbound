import {give} from './items.mjs';
import {TIDEGLASS_CAMP,TIDEGLASS_SIGNALS,TIDEGLASS_VAULT,tideglassIntersects} from './tideglass-layout.mjs';

export const TIDEGLASS_SURVEYOR={
 id:'mara-sounding',npcId:'mara-sounding',name:'Mara Sounding',title:'Surveyor of the Reach',
 x:TIDEGLASS_CAMP.x+28,y:TIDEGLASS_CAMP.y+48,kind:'player',sprite:'player',hp:1,maxHp:1,
 faceX:0,faceY:1,appearance:{skin:'#b47d61',hair:'waves',hairColor:'#353f42',eyeColor:'#325b57',
  shirt:'#3d756d',pants:'#485569'},equipment:{head:'witch_hat_slate'},
};
const quit={label:'Back to the shore',action:'close'};
const choices={
 welcome:[{label:'How do I light the beacon?',action:'signals'},{label:'What did the sea take?',action:'history'},quit],
 signals:[{label:'What did the sea take?',action:'history'},quit],
 history:[{label:'How do I light the beacon?',action:'signals'},quit],
};
const lines={
 welcome:'If you came for the beach, you took the long way. If you came for the sky, follow the old survey stones.',
 signals:'Wake the Singing Stacks to the east, the Drowned Orrery beside the lagoon, and Windward Arch in the northwest. Then take the northern road to Stormwatch. There’s a copper box beside the door.',
 history:'The lighthouse keepers measured the tides against the stars. One winter the sea borrowed their map. The stones still remember where the stars ought to be.',
};
const available=(g,p)=>g.trainTest?.design.wildLands&&!g.trainTest.design.activeRoom&&
 p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.swimming&&!p.underBridge&&
 tideglassIntersects(p.x-1,p.y-1,p.x+1,p.y+1);
const near=(p,a,reach)=>Math.hypot(p.x-a.x,p.y-a.y)<reach;
const signalKey=signal=>'tideglass:signal:'+signal.id;
const state=t=>t.wildExploration??={opened:new Set(),discovered:new Set(),nextCheck:0};
export const tideglassSignalLit=(t,signal)=>!!t.wildExploration?.opened.has(signalKey(signal));
export const tideglassBeaconLit=t=>TIDEGLASS_SIGNALS.every(signal=>tideglassSignalLit(t,signal));

function nearby(g,p){
 if(!available(g,p))return null;
 if(near(p,TIDEGLASS_SURVEYOR,70))return TIDEGLASS_SURVEYOR;
 if(near(p,TIDEGLASS_VAULT,72))return TIDEGLASS_VAULT;
 return TIDEGLASS_SIGNALS.find(signal=>near(p,signal,70));
}
export function tideglassPrompt(g,p){
 const node=nearby(g,p);
 if(node===TIDEGLASS_SURVEYOR)return 'TALK TO MARA SOUNDING';
 if(node===TIDEGLASS_VAULT)return 'EXAMINE THE STORMWATCH LOCKBOX';
 if(node)return (tideglassSignalLit(g.trainTest,node)?'READ ':'WAKE ')+node.name.toUpperCase();
 return '';
}
function tell(t,text){
 t.notice=text;
 t.noticeUntil=t.time+6;
}
export function interactTideglass(g,p){
 const node=nearby(g,p),t=g.trainTest;
 if(!node)return false;
 if(node===TIDEGLASS_SURVEYOR){
  p.ui={shop:'npc-dialogue',tideglassSurveyor:true,ownerDevice:p.device,index:0,node:'welcome'};
  p.consumeInput=true;p.moving=false;p.charge=0;
  return true;
 }
 if(node===TIDEGLASS_VAULT){
  if(!tideglassBeaconLit(t)){
   const count=TIDEGLASS_SIGNALS.filter(signal=>tideglassSignalLit(t,signal)).length;
   tell(t,'Stormwatch Lockbox · '+count+'/3 survey stones lit.');
   return true;
  }
  if(p.npcQuests?.tideglass?.claimed){tell(t,'Stormwatch Lockbox · your lens has already been recovered.');return true;}
  if(!give(p.inventory,'tideglass_lens',1)){tell(t,'Make one free backpack slot for the Tideglass Lens.');return true;}
  (p.npcQuests??={}).tideglass={claimed:true};
  state(t).opened.add('tideglass:vault');
  tell(t,'Tideglass Lens recovered · socket into compatible gear for +12 mana and +2 mana/sec.');
  g.onSound?.('loot',p);
  g.persist?.();
  return true;
 }
 if(tideglassSignalLit(t,node)){tell(t,node.inscription);return true;}
 state(t).opened.add(signalKey(node));
 const count=TIDEGLASS_SIGNALS.filter(signal=>tideglassSignalLit(t,signal)).length;
 tell(t,count===3?'The old light is turning again. The Stormwatch lockbox opens.':node.name+' wakes · '+count+'/3 survey stones lit.');
 g.onSound?.('portal',p);
 g.persist?.();
 return true;
}
export function tideglassDialogueView(g,p){
 const node=p.ui?.node;
 return available(g,p)&&near(p,TIDEGLASS_SURVEYOR,88)
  ?{npc:TIDEGLASS_SURVEYOR,text:lines[node]||lines.welcome,choices:choices[node]||choices.welcome}
  :{text:'Mara has gone back to her survey.',choices:[quit]};
}
export function tideglassDialogueAction(g,p,action){
 const ui=p.ui,view=tideglassDialogueView(g,p);
 if(action==='use')action=view.choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=view.choices[Number(action.slice(7))]?.action;
 if(action==='close'||!view.npc){p.ui=null;p.consumeInput=true;return true;}
 if(action==='next'||action==='down'||action==='prev'||action==='up'){
  const delta=action==='next'||action==='down'?1:-1;
  ui.index=(ui.index+view.choices.length+delta)%view.choices.length;
 }else if(view.choices.some(c=>c.action===action)&&lines[action]){
  ui.node=action;ui.index=0;
 }
 return true;
}
