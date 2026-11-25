import {tradeGestureActor} from './diagon-trade-gestures.mjs';

export function paintDiagonVisitorForm(c,actor,time,size,paint,portrait=false,conversation,tradeTime=time){
 actor=tradeGestureActor(actor,tradeTime,conversation);
 if(actor.visitorForm==='elf'){
  paint(actor,portrait?size:size*.83);
  return;
 }
 if(actor.visitorForm!=='ghost'&&actor.visitorForm!=='poltergeist'){
  paint(actor,size);
  return;
 }
 const ghost=actor.visitorForm==='ghost';
 const lift=(ghost?5:8)+Math.sin(time*(ghost?1.65:2.45))*2;
 c.save();
 c.globalAlpha*=ghost ? .66 : .9;
 paint({...actor,y:actor.y-lift},size);
 c.restore();
}
