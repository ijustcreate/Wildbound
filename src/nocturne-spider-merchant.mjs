import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {take} from './items.mjs';
import {ADOPTABLE_SPIDER_KINDS,petRecord,restoreHunterPet} from './hunter-pets.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {rigSubject} from './rig-subjects.mjs';
import {nocturneLaneX} from './alley-street-layout.mjs';

export const NOCTURNE_SPIDER_STOCK=[
 {kind:'spider',name:'Inkleg',price:4,detail:'A charcoal spider with blue-gray legs.'},
 {kind:'tarantula',name:'Cinderbrush',price:6,detail:'A copper-colored tarantula with fuzzy feet.'},
 {kind:'jumping_spider',name:'Thimble',price:8,detail:'A bright-eyed jumping spider.'},
];
export const NOCTURNE_SPIDER_MERCHANT={
 id:'nocturne-spider-merchant',name:'Silas Threadneedle',title:'Spider keeper',kind:'player',sprite:'player',
 x:nocturneLaneX(9180),y:5308,hp:1,faceX:-.8,faceY:.6,unattackable:true,
 appearance:{...DEFAULT_APPEARANCE,skin:'#b48672',hair:'waves',hairColor:'#c4bec4',shirt:'#543b55',pants:'#3c394a'},
 equipment:{head:'alley_inkcap',chest:'warlock_robe',back:'alley_lantern_mantle'},
};

const actor=NOCTURNE_SPIDER_MERCHANT;
const near=(g,p,r)=>g.trainTest?.design.activeRoom==='diagon'&&p.hp>0&&!p.trainRide&&!p.room&&!p.controlledFollowerId&&
 Math.hypot(p.x-actor.x,p.y-actor.y)<r;
const essence=p=>(p?.inventory||[]).reduce((total,i)=>total+(i?.type==='dark_essence'?i.qty:0),0);

export function nocturneSpiderPrompt(g,p){return near(g,p,69)?'TALK TO SILAS THREADNEEDLE':'';}
export function openNocturneSpiderMerchant(g,p){
 if(!near(g,p,69)||p.ui)return false;
 p.ui={shop:'npc-dialogue',nocturneSpiderMerchant:true,npcId:actor.id,ownerDevice:p.device,node:'stock',index:0};
 p.consumeInput=true;p.charge=0;p.moving=false;
 return true;
}
export function validNocturneSpiderTalk(g,p){
 const u=p.ui;
 return !!u?.nocturneSpiderMerchant&&u.ownerDevice===p.device&&g.players.filter(q=>q.device===p.device).length===1&&near(g,p,99);
}

export function nocturneSpiderView(g,p){
 const u=p.ui,leave={label:'I’ll leave them to their webs.',action:'close'};
 if(!validNocturneSpiderTalk(g,p))return {npc:actor,text:'The stall is out of reach.',choices:[leave]};
 const receipt=g.trainTest.alleyPurchases?.[p.id];
 const occupied=!!(p.hunterPet||receipt?.spiderAdoption);
 const offers=occupied?[]:NOCTURNE_SPIDER_STOCK.map(s=>({label:`Adopt ${s.name} · ${s.price} Dark Essence`,detail:s.detail,action:`adopt:${s.kind}`}));
 return {npc:actor,title:actor.title,notice:u.notice||'',
  text:occupied?'A good keeper gives one companion their full attention. Yours already knows your footsteps.':
   `They follow a familiar set of footsteps. I take Dark Essence for their care. You’re carrying ${essence(p)}.`,
  choices:[...offers,leave]};
}

function notice(u,text){u.notice=text;u.revision=(u.revision||0)+1;}

function adopt(g,p,choice){
 const t=g.trainTest,u=p.ui;
 const receipt=t.alleyPurchases?.[p.id],original=t.returnPlayers?.find(q=>q.id===p.id);
 if(p.hunterPet||receipt?.spiderAdoption||original?.hunterPet){notice(u,'You already have a companion.');return;}
 if(essence(p)<choice.price){notice(u,`Bring ${choice.price} Dark Essence to adopt ${choice.name}.`);return;}
 const available=essence(original)+(receipt?.delta?.dark_essence||0);
 if(!t.persistent&&available<choice.price){notice(u,'Bring Dark Essence from your expedition to adopt a lasting companion.');return;}
 const pet=restoreHunterPet({kind:choice.kind,name:choice.name,collar:p.color});
 if(!pet||!take(p.inventory,'dark_essence',choice.price))return;
 p.hunterPet=pet;
 if(!t.persistent){
  const r=((t.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});
  r.delta.dark_essence=(r.delta.dark_essence||0)-choice.price;
  r.spiderAdoption=petRecord(pet);
 }
 notice(u,`${choice.name} is your companion now. Use Companion care to name or feed them.`);
 u.index=0;
 g.message?.(`${choice.name} scurries after you.`);g.onSound?.('pickup',p);g.persist?.();
}

export function nocturneSpiderAction(g,p,action){
 if(!p.ui?.nocturneSpiderMerchant)return false;
 if(action==='close'||!validNocturneSpiderTalk(g,p)){p.ui=null;p.consumeInput=true;return true;}
 const u=p.ui,{choices}=nocturneSpiderView(g,p);
 if(['next','prev','down','up'].includes(action)){
  u.index=(u.index+(['next','down'].includes(action)?1:-1)+choices.length)%choices.length;
  return true;
 }
 if(action==='use')action=choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 const stock=NOCTURNE_SPIDER_STOCK.find(s=>action===`adopt:${s.kind}`);
 if(stock)adopt(g,p,stock);
 return true;
}

export function transferNocturneSpiderPurchase(original,preview,receipt){
 const record=receipt?.spiderAdoption;
 if(!record||original.hunterPet)return false;
 const live=preview?.hunterPet;
 original.hunterPet=restoreHunterPet(live?.kind===record.kind?(petRecord(live)||record):record);
 return !!original.hunterPet;
}

function drawTerrarium(c,x,y,time,s,index){
 const r=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(x+dx,y+dy,w,h);};
 r(-15,-2,30,6,'#25212d');r(-13,1,26,3,'#735343');r(-12,-22,24,21,'#302937');
 r(-10,-20,20,17,'#415c5a');r(-8,-18,16,13,'#294341');r(-8,-6,16,3,'#6c554a');
 r(-7,-8,3,2,'#8b7960');r(4,-9,4,3,'#574738');
 const rig=rigSubject(s.kind);
 if(rig){
  c.save();c.translate(x,y-8);c.scale(.27,.27);
  rig.draw(c,{id:index+6,hp:1,kind:s.kind,faceX:index===1?-1:1,faceY:1,animationAction:'idle'},time,rig.data);
  c.restore();
 }
 r(-11,-21,22,2,'#ad966b');r(-10,-19,1,11,'#73908a');r(8,-17,1,10,'#5a7c79');
 r(-13,-2,26,2,'#8c6951');r(-12,3,4,2,'#322735');r(8,3,4,2,'#322735');
}

export function queueNocturneSpiderStall(c,g,visible,objects){
 if(visible(actor.x,actor.y,65,90)){
  objects.push({depth:actor.y,player:actor});
  for(const [index,s] of NOCTURNE_SPIDER_STOCK.entries()){
   const x=nocturneLaneX(9200),y=5277+index*25;
   objects.push({depth:y,paint:()=>drawTerrarium(c,x,y,g.time,s,index)});
  }
 }
 for(const p of g.players){
  const pet=p.hunterPet;
  if(!pet||!ADOPTABLE_SPIDER_KINDS.includes(pet.kind)||pet.controlledBy||!Number.isFinite(pet.x)||!visible(pet.x,pet.y,65,90))continue;
  objects.push({depth:pet.y,paint:()=>drawHunterPet(c,pet,p,g.time)});
 }
}
