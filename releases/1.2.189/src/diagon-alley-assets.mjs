import {prepareAlleyPavingAt} from './diagon-alley-street-art.mjs';
import {prepareAlleyGardenProps} from './diagon-garden-props.mjs';
import {prepareMageGardenGround} from './diagon-mage-garden.mjs';

const scheduled=new Set();

function prepareWhenIdle(key,prepare){
 if(typeof document==='undefined'||scheduled.has(key))return;
 scheduled.add(key);
 const run=deadline=>{
  if(deadline&&!deadline.didTimeout&&deadline.timeRemaining()<3){schedule();return;}
  prepare();
 };
 const schedule=()=>{
  if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:350});
  else setTimeout(run,0);
 };
 schedule();
}

export function prepareDiagonArrival(alley){
 for(const y of [alley.entry.y-170,alley.entry.y,alley.entry.y+160]){
  prepareWhenIdle('street:'+y,()=>prepareAlleyPavingAt(alley,y));
 }
 prepareWhenIdle('prop-atlas',prepareAlleyGardenProps);
}

export function prepareDiagonGardenApproach(){
 prepareWhenIdle('garden-terrain',prepareMageGardenGround);
}
