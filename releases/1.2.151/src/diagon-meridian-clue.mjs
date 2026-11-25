const leave={label:'Leave',action:'close'};

export function meridianClueView(g,p){
 const ui=p.ui;
 if(g.trainTest?.design.activeRoom!=='diagon'||ui.ownerDevice!==p.device)return {text:'Celia goes back to her charts.',choices:[leave]};
 return {npc:ui.meridianClerk,text:ui.node==='clue'
  ?'Well, the first rule is… I’m not supposed to talk about it. But you look like someone who can hold their own. Try the broken mirror beside the shelf. Press where the cracks meet.'
  :'You’re looking at the glass. Most people come in for the charts.',
 choices:ui.node==='clue'?[leave]:[{label:'What’s the story with the broken mirror?',action:'mirror'},leave]};
}

export function meridianClueAction(g,p,action){
 const ui=p.ui,{npc,choices}=meridianClueView(g,p);
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','up','down'].includes(action)){ui.index=(ui.index+1)%choices.length;return true;}
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;}
 else if(action==='mirror'){ui.node='clue';ui.index=0;}
 return true;
}
