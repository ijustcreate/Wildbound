import {CRYSTAL_BALL_REPLIES,ZODIAC_READINGS} from './divination-content.mjs';

const signs=Object.keys(ZODIAC_READINGS),readings=new WeakMap();
const leave={label:'Leave the conservatory counter',action:'close'};

function nextReading(p,key,values){
 let decks=readings.get(p);
 if(!decks){decks=new Map();readings.set(p,decks);}
 let deck=decks.get(key);
 if(!deck){deck={rest:[],last:null};decks.set(key,deck);}
 if(!deck.rest.length)deck.rest=[...values];
 const eligible=deck.rest.filter(value=>value!==deck.last);
 const reply=eligible[Math.floor(Math.random()*eligible.length)]||deck.rest[0];
 deck.rest.splice(deck.rest.indexOf(reply),1);deck.last=reply;
 return reply;
}

export function useCrystalBall(g,p){
 const reply=nextReading(p,'crystal_ball',CRYSTAL_BALL_REPLIES);
 if(p.ui)p.ui.notice=reply;
 else g.message?.(reply);
 g.onSound?.('magic',p);
 return reply;
}

export function openBellglassDivination(g,p,merchant){
 p.ui={shop:'npc-dialogue',bellglassDivination:true,npcId:merchant.visual.id,ownerDevice:p.device,index:0,node:'greeting',page:0};
 p.charge=0;p.moving=false;p.consumeInput=true;
 g.onSound?.('ui',p);
 return true;
}

function bellglassMerchant(g,p){
 const t=g.trainTest,u=p.ui;
 return u?.bellglassDivination&&u.ownerDevice===p.device&&p.hp>0&&t?.design.activeRoom==='diagon'?t.alleyMerchants?.bellglass:null;
}

export function bellglassDialogueView(g,p){
 const merchant=bellglassMerchant(g,p),u=p.ui;
 if(!merchant)return {text:'Iona has stepped away from the counter.',choices:[leave]};
 const npc={...merchant.visual,name:merchant.owner};
 const title='Bellglass Conservatory';
 if(u.node==='signs'){
  const page=u.page===1?1:0,start=page*6;
  const choices=signs.slice(start,start+6).map(sign=>({label:sign,action:'sign:'+sign}));
  choices.push({label:page?'Aries through Virgo':'Libra through Pisces',action:'signs:'+(1-page)},{label:'Back to Iona',action:'greeting'});
  return {npc,title,text:'Which sign shall I look for in the glass?',choices};
 }
 if(u.node==='reading')return {npc,title:u.sign+' · Bellglass reading',text:u.reading,choices:[
  {label:'Read another omen for '+u.sign,action:'sign:'+u.sign},{label:'Choose another sign',action:'signs:'+u.page},{label:'Back to Iona',action:'greeting'},
 ]};
 return {npc,title,text:'The moonmint behaves itself. The mushrooms, well… they make the garden look terribly funny. Would you like your stars read, or shall I show you the shop?',choices:[
  {label:'Read my stars',action:'signs:0'},{label:'Browse the shop',action:'shop'},leave,
 ]};
}

export function bellglassDialogueAction(g,p,action){
 const u=p.ui,merchant=bellglassMerchant(g,p);
 if(!merchant||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 const {choices}=bellglassDialogueView(g,p);
 if(['next','prev','up','down'].includes(action)){
  const step=action==='next'||action==='down'?1:-1;
  u.index=(u.index+step+choices.length)%choices.length;
  return true;
 }
 if(action==='use')action=choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!choices.some(choice=>choice.action===action))return true;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(action==='shop'){
  p.ui={shop:'merchant',alleyShop:'bellglass',panel:'stock',index:0,page:0,notice:merchant.greeting};
  return true;
 }
 u.index=0;
 if(action==='greeting')u.node='greeting';
 else if(action.startsWith('signs:')){u.node='signs';u.page=Number(action.slice(6));u.revision=u.page;}
 else if(action.startsWith('sign:')){
  const sign=action.slice(5);
  u.node='reading';u.sign=sign;u.reading=nextReading(p,sign,ZODIAC_READINGS[sign]);u.revision=u.reading;
  g.onSound?.('magic',p);
 }
 return true;
}
