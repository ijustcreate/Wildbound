import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {HOLLOW_GATE} from './wild-mountain-layout.mjs';

const characters=[
 {id:'fred',name:'Fred Jones',dx:115,dy:63,faceX:.55,faceY:1,
  appearance:{hair:'sidepart',hairColor:'#dfbd59',shirt:'#e1ddcc',pants:'#39688d',shoes:'#583a2d'},
  equipment:{back:'hogwarts_scarf_red'},
  greeting:'Mystery Inc. is taking a look at the wreck. The harbor records say a captain called One-Eyed Willy made his last run here. His ship never came back out.',
  clue:'The gangplank still reaches the shore. Velma wants me to check the forward hold once we know what’s walking around on deck.'},
 {id:'velma',name:'Velma Dinkley',dx:171,dy:50,faceX:-.7,faceY:1,
  appearance:{hair:'bob',hairColor:'#884d3c',face:'glasses',shirt:'#da874c',pants:'#794045',shoes:'#8a4d51'},
  greeting:'A treasure tally, a ship with no return date, and bones that walk. I can explain the first two. The tide marks put the wreck right inside this mountain.',
  clue:'The cabin door sits forward of the hold’s bulkhead. If you find Willy’s table, try examining the chair at its head.'},
 {id:'daphne',name:'Daphne Blake',dx:215,dy:81,faceX:-.8,faceY:.3,
  appearance:{hair:'long',hairColor:'#b6653e',shirt:'#79638f',pants:'#b17c91',shoes:'#61466c'},
  equipment:{back:'hogwarts_scarf_green'},
  greeting:'The last sailor who talked about Willy’s gold drew this cave from memory. He remembered every bend in the shore and couldn’t tell me what chased him out.',
  clue:'Look up while you’re on the cave paths. If you see dust falling or a shadow growing on the ground, clear the spot.'},
 {id:'shaggy',name:'Shaggy Rogers',dx:191,dy:131,faceX:-.9,faceY:-.2,
  appearance:{hair:'shag',hairColor:'#846142',facialHair:'goatee',shirt:'#8b9b59',pants:'#855c49',shoes:'#4b463b'},
  greeting:'Like, Willy buried his whole ship instead of buying a lockbox? I’m staying here to guard our lunch, in case he comes back for that too.',
  clue:'Someone was stomping around on the open deck. Scoob and I voted to check the beach for more clues. We got two votes.'},
 {id:'scooby',name:'Scooby-Doo',dx:137,dy:121,faceX:.6,faceY:-.4,dog:true,
  greeting:'Ruh-roh. Pirate bones! Shaggy and I smelled something old, down by the boat.',
  clue:'A chair down below. One big bone pirate. Rrr… I’ll wait with Shaggy.'},
].map(({dx,dy,appearance,...npc})=>({...npc,npcId:npc.id,title:'Mystery Inc.',
 x:HOLLOW_GATE.x+dx,y:HOLLOW_GATE.y+dy,hp:1,maxHp:1,kind:npc.dog?'golden_retriever':'player',sprite:npc.dog?'golden_retriever':'player',
 appearance:{...DEFAULT_APPEARANCE,...appearance},equipment:npc.equipment||{},
}));

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const close={label:'Good luck with the case.',action:'close'};
const question={label:'Have you found a clue?',action:'clue'};

export function mysteryVisitors(g){
 const t=g.trainTest;
 return t?.design.wildLands&&!t.design.activeRoom&&!t.wildLandsOverview?characters:[];
}

function isVisitor(p){return p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.broomMount&&!p.vehicleId&&!p.swimming;}

function nearby(g,p){
 if(!isVisitor(p)||p.ui||distance(HOLLOW_GATE,p)>310)return null;
 let best=null,reach=53;
 for(const npc of mysteryVisitors(g)){
  const gap=distance(npc,p);
  if(gap<reach){reach=gap;best=npc;}
 }
 return best;
}

export function mysteryPrompt(g,p){
 const npc=nearby(g,p);
 return npc?'TALK TO '+npc.name.toUpperCase():'';
}

export function interactMystery(g,p){
 const npc=nearby(g,p);
 if(!npc)return false;
 p.ui={shop:'npc-dialogue',mysteryVisitor:npc.id,ownerDevice:p.device,index:0,node:'greeting'};
 p.consumeInput=true;p.interactUsed=true;p.charge=0;p.moving=false;
 g.onSound?.('ui',p);
 return true;
}

export function mysteryDialogue(g,p){
 const u=p.ui;
 const npc=isVisitor(p)&&u.ownerDevice===p.device?mysteryVisitors(g).find(n=>n.id===u.mysteryVisitor&&distance(n,p)<=80):null;
 if(!npc)return {text:'Mystery Inc. is back at the cave mouth.',choices:[close]};
 const clue=u.node==='clue';
 return {npc,text:clue?npc.clue:npc.greeting,choices:clue?[close]:[question,close]};
}

export function mysteryDialogueAction(g,p,action){
 const u=p.ui,{npc,choices}=mysteryDialogue(g,p);
 if(action==='use')action=choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','down','prev','up'].includes(action)){
  const step=action==='next'||action==='down'?1:-1;
  u.index=(u.index+choices.length+step)%choices.length;
 }else if(action==='clue'&&u.node==='greeting'){
  u.node='clue';u.index=0;
 }
 return true;
}
