import {gardenPondContains} from './diagon-garden-layout.mjs';
import {GARDEN_MANA_BONUS,GARDEN_MANA_SECONDS,gardenManaWardRemaining} from './garden-mana-state.mjs';
import {refreshVitals} from './items.mjs';

export {GARDEN_MANA_BONUS,GARDEN_MANA_SECONDS,gardenManaWardRemaining};
export const GARDEN_POND_SOAK_SECONDS=5;
const soaks=new WeakMap();

export function inGardenPond(p){
 return !!p?.swimming&&p.hp>0&&!(p.jumpHeight>0)&&!p.broomMount&&!p.wingHover&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.room&&gardenPondContains(p.x,p.y);
}

export function gardenPondSoak(p){return inGardenPond(p)?soaks.get(p)||0:0;}

export function tickGardenPond(g,dt){
 let activated=false;
 for(const p of g.players){
  if(!inGardenPond(p)){soaks.delete(p);continue;}
  const prior=soaks.get(p)||0;
  if(prior>=GARDEN_POND_SOAK_SECONDS)continue;
  const elapsed=Math.min(GARDEN_POND_SOAK_SECONDS,prior+dt);
  if(elapsed+1e-8<GARDEN_POND_SOAK_SECONDS){soaks.set(p,elapsed);continue;}
  soaks.set(p,GARDEN_POND_SOAK_SECONDS);
  p.field??={};p.field.gardenManaWard=GARDEN_MANA_SECONDS;
  refreshVitals(p);p.mana=p.maxMana;
  g.message?.(`Mage Garden ward restores mana and raises maximum mana by ${GARDEN_MANA_BONUS} for ten minutes.`);
  activated=true;
 }
 if(activated)g.persist?.();
}

export function tickGardenManaWards(g,dt){
 let expired=false;
 for(const p of g.players){
  if(g.trainTest?.design.activeRoom!=='diagon')soaks.delete(p);
  if(p.field?.gardenManaWard===undefined)continue;
  const remaining=gardenManaWardRemaining(p)-dt;
  if(remaining>1e-8){p.field.gardenManaWard=remaining;continue;}
  delete p.field.gardenManaWard;
  refreshVitals(p);
  expired=true;
 }
 if(expired)g.persist?.();
}

export function transferGardenManaWards(active,returning){
 let changed=false;
 for(const p of returning){
  const former=active.find(candidate=>candidate.id===p.id),prior=gardenManaWardRemaining(p);
  if(!former)continue;
  const remaining=gardenManaWardRemaining(former);
  if(remaining===prior)continue;
  if(remaining){p.field??={};p.field.gardenManaWard=remaining;}
  else if(p.field)delete p.field.gardenManaWard;
  refreshVitals(p);
  if(remaining>prior)p.mana=p.maxMana;
  changed=true;
 }
 return changed;
}
