import {lupinDialogueNpc} from './remus-lupin.mjs';
import {holdsPatronusWand,learnPatronus,patronusLesson,PATRONUS_FORMS} from './patronus.mjs';

const close = {label:'See you, Professor.',action:'close'};

export function patronusDialogueView(g,p) {
  const npc=lupinDialogueNpc(g,p);
  if (!npc) return {text:'Lupin has gone back to the Shack.',choices:[close]};
  const lesson=patronusLesson(p),waiting=p.ui.node==='relearn',wand=holdsPatronusWand(p);
  const form=PATRONUS_FORMS[lesson?.form];
  const choices=[];
  let text;
  if (!lesson?.learned) {
    text=p.ui.notice||(npc.injured?'I’ll be all right. Let me sit a moment. I can teach you a charm for the next time you meet something that feeds on fear.':
      'Some things draw strength from whatever makes you afraid. The Patronus Charm asks you to hold on to a memory that still makes you glad. Take out your wand and we can try it.');
    choices.push({label:'Teach me the Patronus Charm.',action:'patronus:learn',disabled:!wand,
      detail:wand?'Learn Expecto Patronum.':'Equip a wand in either hand first.'});
  } else if (waiting) {
    text='Try a different memory. The next time you cast, a different animal will answer. Take this slowly. You have nothing to prove to the charm.';
    choices.push({label:'Let me learn it again.',action:'patronus:relearn',disabled:!wand,
      detail:wand?'Your next Patronus will take a different form.':'Equip a wand in either hand first.'},
    {label:'I’ll keep my Patronus.',action:'patronus:back'});
  } else {
    text=p.ui.notice||(form?`Your Patronus takes the shape of a ${form.toLowerCase()}. Cast your wand here to practise, or strike a ghost or Dementor with it when you need help.`:
      'Cast your wand here to see what answers. Out on the road, a wand hit on a ghost or Dementor will call your Patronus to your side.');
    if (form) choices.push({label:'I don’t feel like my Patronus is a good match.',action:'patronus:offer'});
  }
  return {npc,text,choices:[...choices,close]};
}

export function patronusDialogueAction(g,p,action) {
  const ui=p.ui,{npc,choices}=patronusDialogueView(g,p);
  if (!npc || action==='close') {p.ui=null;p.consumeInput=true;return true;}
  if (['next','prev','down','up'].includes(action)) {
    ui.index=((ui.index||0)+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;
    return true;
  }
  if (action==='use') action=choices[ui.index||0]?.action;
  if (action?.startsWith('choice:')) action=choices[Number(action.slice(7))]?.action;
  if (!choices.some(choice=>choice.action===action&&!choice.disabled)) return true;
  if (action==='close') {p.ui=null;p.consumeInput=true;return true;}
  ui.index=0;
  delete ui.notice;
  ui.node=action==='patronus:offer'?'relearn':'hello';
  if (action==='patronus:learn' || action==='patronus:relearn') {
    if (learnPatronus(g,p,{relearn:action==='patronus:relearn'})) {
      ui.notice='Expecto Patronum. Try casting beside me, or land a wand hit on a spirit. Your Patronus will stay for thirty seconds.';
      g.onSound?.('questAccept',p);
    }
  }
  return true;
}
