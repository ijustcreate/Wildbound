const cast=[
 {id:'vespera',name:'Vespera',title:'Mermaid Lagoon',x:17345,y:5368,depth:5389,talkY:5398,
  mermaidPose:'brush',mermaidStyle:0,faceX:-.7,faceY:1,size:35,mermaidPhase:.3,
  greeting:'Oh, a visitor. I was going to drown you, but I only just got the tangles out.',
  question:'Do you say that to everyone?',answer:'Only the ones who interrupt. The quiet ones can stay until I finish.'},
 {id:'luma',name:'Luma',title:'Mermaid Lagoon',x:17410,y:5368,depth:5389,talkY:5398,
  mermaidPose:'harp',mermaidStyle:1,faceX:.8,faceY:1,size:34,mermaidPhase:1.1,
  greeting:'I might drown you after this song. I keep playing it slowly. You’re welcome, I suppose.',
  question:'What are you playing?',answer:'A song for shipwrecks. It sounds better beneath the water.'},
 {id:'coralie',name:'Coralie',title:'Mermaid Lagoon',x:17546,y:5407,depth:5426,talkY:5434,
  mermaidPose:'rest',mermaidStyle:2,faceX:-.8,faceY:1,size:36,mermaidPhase:2.1,
  greeting:'I’d drown you for this rock, if you tried to take it. The sun’s too good to move otherwise.',
  question:'Is there room for another?',answer:'On the little stone by the waterfall, perhaps. It goes cold well before mine.'},
 {id:'neri',name:'Neri',title:'Mermaid Lagoon',x:17473,y:5431,
  mermaidPose:'swim',mermaidStyle:3,size:33,mermaidPhase:.8,
  greeting:'I feel like drowning you. A splash might make Coralie look over. Or she might just go back to sleep.',
  question:'Are you waiting for Coralie?',answer:'She said she’d come swimming when the rock cooled. She said that yesterday, too.'},
].map(Object.freeze);
const [brush,harp,lounger,swimmer]=cast;
const leave={label:'Leave her to it.',action:'close'};

export function lagoonMermaids(t){
 if(!t?.design?.wildLands||t.design.activeRoom||t.wildLandsOverview)return [];
 const drift=(t.time||0)*.55+swimmer.mermaidPhase;
 const x=swimmer.x+9*Math.sin(drift),y=swimmer.y+5*Math.cos(drift);
 const dx=lounger.x-x,dy=lounger.y-y,distance=Math.hypot(dx,dy);
 return [brush,harp,lounger,{...swimmer,x,y,depth:y,faceX:dx/distance,faceY:dy/distance}];
}

function talkDistance(actor,p){
 return Math.hypot(actor.x-p.x,(actor.talkY??actor.y)-p.y);
}

function nearby(g,p){
 if(!(p.hp>0)||p.trainRide||p.pirateRide||p.vehicleId||
    p.x<17260||p.x>17640||p.y<5300||p.y>5530)return null;
 let nearest=null,range=67;
 for(const actor of lagoonMermaids(g.trainTest)){
  const distance=talkDistance(actor,p);
  if(distance<range){nearest=actor;range=distance;}
 }
 return nearest;
}

export function lagoonMermaidPrompt(g,p){
 const actor=nearby(g,p);
 return actor?'TALK TO '+actor.name.toUpperCase():'';
}

export function interactLagoonMermaid(g,p){
 const actor=nearby(g,p);
 if(!actor)return false;
 p.ui={shop:'npc-dialogue',lagoonMermaid:actor.id,ownerDevice:p.device,node:'greeting',index:0};
 Object.assign(p,{consumeInput:true,interactUsed:true,moving:false,charge:0,menuRepeat:0});
 g.onSound?.('ui',p);
 return true;
}

export function lagoonMermaidDialogue(g,p){
 const ui=p.ui;
 const actor=lagoonMermaids(g.trainTest).find(npc=>npc.id===ui.lagoonMermaid);
 if(!actor||ui.ownerDevice!==p.device||!(p.hp>0)||talkDistance(actor,p)>88){
  return {text:'Only the water answers.',choices:[leave]};
 }
 const followup=ui.node==='answer';
 return {npc:actor,title:actor.title,text:followup?actor.answer:actor.greeting,
  choices:followup?[leave]:[{label:actor.question,action:'answer'},leave]};
}

export function lagoonMermaidDialogueAction(g,p,action){
 const ui=p.ui,{npc,choices}=lagoonMermaidDialogue(g,p);
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!npc||action==='close')Object.assign(p,{ui:null,consumeInput:true});
 else if(['up','prev','down','next'].includes(action)){
  const step=action==='down'||action==='next'?1:-1;
  ui.index=(ui.index+choices.length+step)%choices.length;
 }else if(action==='answer'&&ui.node==='greeting'){
  ui.node='answer';ui.index=0;
 }
 return true;
}
