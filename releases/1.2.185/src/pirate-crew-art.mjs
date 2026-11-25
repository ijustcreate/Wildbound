import {drawActorGameplayFx} from './gameplay-fx.mjs';
import {drawPixelChatText,pixelChatTextWidth} from './pixel-chat-font.mjs';
import {block,shape} from './diagon-shop-brush.mjs';

const bubbleWidth=174;
const lift=actor=>actor.pirateVisualLift||0;

export function drawPirateCrewMember(renderer,g,actor){
 const c=renderer.ctx,size=actor.pirateSize||45;
 const visual={...actor,y:actor.y-lift(actor)};
 drawActorGameplayFx(c,g,visual,size,'back');
 renderer.animator.draw(c,visual,g.time,size);
 drawActorGameplayFx(c,g,visual,size,'front');
}

export function drawPirateCrewSpeech(c,actor,speech){
 const lines=[];
 let row='';
 for(const word of speech.split(' ')){
  const phrase=row?row+' '+word:word;
  if(row&&pixelChatTextWidth(phrase)>bubbleWidth){lines.push(row);row=word;}
  else row=phrase;
 }
 if(row)lines.push(row);
 const width=Math.max(...lines.map(pixelChatTextWidth))+16,height=10+lines.length*9;
 const x=Math.round(actor.x-width/2),y=Math.round(actor.y-lift(actor)-(actor.pirateSize||45)-height-7);
 block(c,x,y,width,height,'#271e21ee');
 block(c,x+1,y+1,width-2,1,'#bd9667');
 block(c,x+1,y+height-2,width-2,1,'#765641');
 shape(c,'#271e21ee',[[actor.x-5,y+height-1],[actor.x+5,y+height-1],[actor.x,y+height+6]]);
 for(const [index,line] of lines.entries())drawPixelChatText(c,line,x+Math.floor((width-pixelChatTextWidth(line))/2),y+5+index*9,'#f4dfbb');
}
