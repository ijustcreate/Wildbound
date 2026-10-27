import {give,take,stat} from './items.mjs';
import {SANTA_EQUIPMENT} from './christmas-items.mjs';
import {drawToyTrain} from './christmas-art.mjs';
import {dropTempleLoot} from './temple-loot-data.mjs';
const protectedItem=(p,type)=>!!p.field?.favorites?.includes(type);
export const SANTA_EVENT=Object.freeze({name:'A little Christmas spirit',type:'santa',kind:'santa',environment:'ice',weight:4,count:0,hp:1,speed:0,damage:0,
 verse:'Two antlers crest the drifting snow.\nA merry voice calls, “Ho, ho, ho!”',tip:'Santa has arrived with two reindeer. Approach and talk. Perhaps he is waiting for a letter.'});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ownerKey=p=>String(p.profileId||p.id);
export const carriesSantaLetter=g=>(g.players||[]).some(p=>p.hp>0&&p.inventory?.some(i=>i?.type==='santa_letter'&&i.qty>0));
export function santaEncounterChance(g){return (g.generatedEnvironment||g.environment)==='ice'?(carriesSantaLetter(g)?.65:.045):0;}
export function spawnSanta(g,{force=false}={}){
 if(!force&&(g.generatedEnvironment||g.environment)!=='ice')return false;
 const existing=(g.questNpcs||[]).find(n=>n.santa);if(existing)return existing;
 let spot;
 const anchor=(g.players||[]).find(p=>p.hp>0&&!p.room)||{x:800,y:800};
 for(let i=0;i<96;i++){const angle=i*2.399963,radius=220+Math.floor(i/12)*24,x=anchor.x+Math.cos(angle)*radius,y=anchor.y+Math.sin(angle)*radius;
  if(![-66,0,66].some(offset=>g.blocked(x+offset,y+20,24,false,false,false,0))){spot={x,y};break;}}
 if(!spot)return false;
 const npc={id:g.nextId++,npcId:'santa',santa:true,name:'Santa',title:'Bearer of Christmas Spirit',sprite:'player',...spot,hp:1,maxHp:1,invincible:true,unattackable:true,faction:'ally',faceX:0,faceY:1,moving:false,
  equipment:{...SANTA_EQUIPMENT},appearance:{skin:'#d59f79',shirt:'#b63840',pants:'#a72e36',shoes:'#352e32',hair:'long',hairColor:'#e6dfcb',facialHair:'fullbeard',facialHairColor:'#e6dfcb',face:'classic',build:'broad'},chocolateGiven:[]};
 (g.questNpcs??=[]).push(npc);
 g.santaDeer=[-1,1].map((side,i)=>({id:g.nextId++,kind:'stag',name:i?'Comet':'Dasher',x:spot.x+side*66,y:spot.y+20,hp:120,maxHp:120,faction:'neutral',faceX:side,faceY:1,state:'graze',step:0,moving:false}));
 g.reveal={...spot,life:6};g.message?.('A merry laugh carries through the snow. Santa and two reindeer have arrived.');g.persist?.();return npc;
}
export function openSantaDialogue(g,p){
 if(p.ui||p.room||p.hp<=0||g.phase!=='play')return false;
 const npc=(g.questNpcs||[]).find(n=>n.santa&&distance(n,p)<=68);if(!npc)return false;
 p.ui={shop:'npc-dialogue',ownerDevice:p.device,npcId:'santa',node:'greeting',index:0};p.consumeInput=true;p.interactUsed=true;p.charge=0;p.menuRepeat=0;
 npc.laughStarted=g.time;g.onSound?.('ui',p);return true;
}
export function santaDialogueView(g,p){
 const npc=(g.questNpcs||[]).find(n=>n.santa),letter=p.inventory?.some(i=>i?.type==='santa_letter'&&i.qty>0),given=npc?.chocolateGiven?.includes(ownerKey(p));
 return {npc,title:'Santa · A little Christmas spirit',text:letter?'Ho, ho, ho! That envelope has travelled a long way. A child’s wish should never be forgotten. Will you deliver that letter to me?':given?'Merry Christmas, dear explorer! May your journey be full of warm hearts, good friends and little wonders.':'Ho, ho, ho! Merry Christmas! Even the coldest road is warmer with a friend. Would you like a little chocolate for your travels?',
  quest:letter?{title:'The undelivered letter',description:'Deliver the forgotten letter to Santa.',progress:1,target:1,reward:'wrapped_present',ready:true}:null,
  choices:[...(letter?[{label:'Deliver the undelivered letter.',detail:'Receive a wrapped present.',action:'santa:deliver'}]:!given?[{label:'Thank you. I’d love some chocolate.',action:'santa:chocolate'}]:[]),{label:'Merry Christmas, Santa!',action:'close'}],notice:p.ui?.notice||''};
}
function grant(g,p,type,qty=1){
 if(give(p.inventory,type,qty,24))return 'backpack';
 if(p.room==='temple-upper')dropTempleLoot(g,p,type,qty);
 else g.dropLoot(p.x+16,p.y+8,type,qty,'A Christmas gift',true);
 return 'ground';
}
export function santaDialogueAction(g,p,action){
 const u=p.ui,view=santaDialogueView(g,p),npc=view.npc;if(!npc)return true;
 if(['next','prev','up','down'].includes(action)){u.index=((u.index||0)+(['next','down'].includes(action)?1:-1)+view.choices.length)%view.choices.length;return true;}
 if(action==='use')action=view.choices[u.index||0]?.action;
 if(action?.startsWith('choice:'))action=view.choices[Number(action.slice(7))]?.action;
 if(!view.choices.some(c=>c.action===action))return true;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(action==='santa:deliver'&&take(p.inventory,'santa_letter',1)){
  const destination=grant(g,p,'wrapped_present');p.santaLetterTurnIns=(p.santaLetterTurnIns||0)+1;
  u.notice=destination==='backpack'?'Ho, ho, ho! Your wrapped present is in your backpack.':'Your backpack is full. Santa placed your wrapped present safely at your feet.';
 }else if(action==='santa:chocolate'&&!npc.chocolateGiven.includes(ownerKey(p))){
  const destination=grant(g,p,'christmas_chocolate',1);npc.chocolateGiven.push(ownerKey(p));u.notice=destination==='backpack'?'Christmas chocolate received. Merry Christmas!':'Santa left your chocolate at your feet. Merry Christmas!';
 }
 u.index=0;npc.laughStarted=g.time;g.uiRevision=(g.uiRevision||0)+1;g.onSound?.('loot',p);g.persist?.();return true;
}
export function unwrapPresent(g,p,index){
 const item=p.inventory?.[index];if(item?.type!=='wrapped_present'||p.hp<=0||protectedItem(p,item.type))return false;
 if(--item.qty<=0)p.inventory[index]=null;
 const destinations=['christmas_bell','christmas_chocolate','toy_train'].map(type=>grant(g,p,type));
 if(p.ui)p.ui.notice=destinations.includes('ground')?'Present unwrapped! Gifts that did not fit are on the ground.':'Present unwrapped: a Christmas bell, chocolate and a blue toy train!';
 p.salvageFinish=.3;g.onSound?.('loot',p);g.uiRevision=(g.uiRevision||0)+1;g.persist?.();return true;
}
export function tickPresentUnwrap(g,p,held,dt){
 const item=p.inventory?.[p.ui?.index];if(item?.type!=='wrapped_present'||p.ui?.panel!=='pack'||p.ui.shop)return false;
 if(!held){delete p.salvageHold;return true;}
 if(p.salvageHold?.latched)return true;
 if(p.hp<=0||p.stun>0||protectedItem(p,item.type)){p.salvageHold={latched:true};return true;}
 let hold=p.salvageHold;
 if(hold&&(hold.item!==item||hold.index!==p.ui.index)){p.salvageHold={latched:true};return true;}
 hold=p.salvageHold??={item,index:p.ui.index,elapsed:0};hold.elapsed+=Math.max(0,Math.min(.1,dt));
 if(hold.elapsed>=1.25){unwrapPresent(g,p,p.ui.index);p.salvageHold={latched:true};}return true;
}
export function useChristmasItem(g,p,index,action='use'){
 const item=p.inventory?.[index],type=item?.type;if(!['wrapped_present','santa_letter','christmas_bell','christmas_chocolate','toy_train'].includes(type))return false;
 const notice=text=>{if(p.ui)p.ui.notice=text;else g.message?.(text);};
 if(p.hp<=0)return true;
 if(type==='santa_letter'){notice('Dear Santa, please don’t forget the explorers far from home. A little wonder would mean the world. — A child of Wildbound');return true;}
 if(protectedItem(p,type)){notice('Unlock this item in Field Kit first.');return true;}
 if(type==='wrapped_present'){unwrapPresent(g,p,index);return true;}
 if(type==='christmas_chocolate'){p.hp=p.maxHp;take(p.inventory,type,1);g.onSound?.('heal',p);notice('Christmas chocolate restored all health.');}
 if(type==='christmas_bell'){
  const existing=(g.enemies||[]).find(e=>e.holidayReindeer&&e.allyOwner===p.id&&e.hp>0);
  if(existing){notice('Your reindeer is already beside you.');return true;}
  if(p.room||g.phase!=='play'){notice('Ring the bell outside during an expedition.');return true;}
  const spots=[[32,24],[-32,24],[0,40],[40,0],[-40,0],[0,-40]],spot=spots.find(([x,y])=>!g.blocked(p.x+x,p.y+y,12));
  if(!spot){notice('There is no safe space for your reindeer here.');return true;}
  g.enemies.push({id:g.nextId++,kind:'stag',skin:'stag',name:'Christmas Reindeer',holidayReindeer:true,allyOwner:p.id,faction:'ally',x:p.x+spot[0],y:p.y+spot[1],hp:140,maxHp:140,damage:18,speed:135,state:'idle',cooldown:0,attack:0,faceX:0,faceY:1,step:0,moving:false});
  notice('Your reindeer answers the bell. It will defend you for this expedition.');g.onSound?.('magic',p);
 }
 if(type==='toy_train'){
  if(p.room||g.phase!=='play'){notice('Place the train outside during an expedition.');return true;}
  if((g.toyTrains||[]).length>=24){notice('There are already plenty of toy trains here.');return true;}
  const x=p.x+(p.faceX||0)*34,y=p.y+(p.faceY||1)*34;
  if(g.blocked(x,y,22)){notice('Find a clear patch of ground for the track.');return true;}
  (g.toyTrains??=[]).push({id:g.nextId++,x,y,owner:p.id,angle:0,lapsLeft:2});take(p.inventory,type,1);notice('Blue train placed. Interact for two more laps; strike it to pack it up.');
 }
 g.uiRevision=(g.uiRevision||0)+1;g.persist?.();return true;
}
export function interactToyTrain(g,p){
 const toy=(g.toyTrains||[]).filter(t=>distance(t,p)<58).sort((a,b)=>distance(a,p)-distance(b,p))[0];if(!toy||p.room)return false;
 toy.lapsLeft=Math.min(20,(toy.lapsLeft||0)+2);g.message?.('All aboard! Two more laps.');g.persist?.();return true;
}
export function hitToyTrain(g,p,range=45){
 if(p.room)return false;
 const toy=(g.toyTrains||[]).find(t=>{const d=distance(t,p)||1;return d<range+20&&((t.x-p.x)*(p.faceX||0)+(t.y-p.y)*(p.faceY||1))/d>-.1;});if(!toy)return false;
 g.toyTrains=g.toyTrains.filter(t=>t!==toy);g.dropLoot(toy.x,toy.y,'toy_train',1,'Packed blue train',true);g.onSound?.('drop',toy);g.persist?.();return true;
}
export function tickChristmas(g,dt){
 if(g.phase!=='play'){g.enemies=(g.enemies||[]).filter(e=>!e.holidayReindeer);return;}
 for(const toy of g.toyTrains||[]){if(!(toy.lapsLeft>0))continue;toy.angle=(toy.angle||0)+dt*1.5;while(toy.angle>=Math.PI*2&&toy.lapsLeft>0){toy.angle-=Math.PI*2;toy.lapsLeft--;}if(!toy.lapsLeft)toy.angle=0;}
 const santa=(g.questNpcs||[]).find(n=>n.santa);if(santa){const laughing=Number.isFinite(santa.laughStarted)&&g.time-santa.laughStarted<1.3;santa.animationAction=laughing?'santa_laugh':'idle';santa.playerFrame=laughing?(g.time-santa.laughStarted)*24:undefined;}
 for(const e of g.enemies||[])if(e.holidayReindeer&&e.hp>0){const owner=g.players.find(p=>p.id===e.allyOwner);if(!owner)continue;
  if(owner.room){e.room=owner.room;e.roomX=owner.roomX-25;e.roomY=owner.roomY+10;}
  else if(e.room){e.room=null;e.x=owner.x-32;e.y=owner.y+24;}
 }
}
export function drawChristmasGround(c,g){for(const toy of g.toyTrains||[])drawToyTrain(c,toy,g.time||0);}
export function drawChristmasSpirit(c,p,time){
 if(p.hp<=0||stat(p,'christmasSpirit')<=0)return;
 const phase=((time+(p.id||0)*.71)%4+4)%4;if(phase>.65)return;
 c.save();c.globalAlpha*=Math.sin(phase/.65*Math.PI)*.8;c.fillStyle='#f7edbe';
 for(const[x,y]of[[-9,-24],[7,-37]]){const xx=Math.round(p.x+x),yy=Math.round(p.y+y-phase*6);c.fillRect(xx-1,yy,3,1);c.fillRect(xx,yy-1,1,3);}c.restore();
}
export function drawSanta(c,g,npc,animator){
 for(const deer of g.santaDeer||[])animator.draw(c,deer,g.time,48);
 animator.draw(c,npc,g.time,48);drawChristmasSpirit(c,npc,g.time);
 c.save();c.font='bold 9px sans-serif';c.textAlign='center';c.fillStyle='#f1d291';c.fillText('Santa',npc.x,npc.y-52);c.font='8px sans-serif';c.fillText('Interact · Christmas greetings',npc.x,npc.y+17);c.restore();
}
