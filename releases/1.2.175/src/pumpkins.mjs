import {give,itemKind,clearSlot} from './items.mjs';
export const hasCarvingKnife=p=>['hand1','hand2'].some(slot=>itemKind(p.equipment?.[slot])==='dagger');
export function carvePumpkin(g,p,index){
  const fail=notice=>{if(p.ui)p.ui.notice=notice;return false;};
  if(!p.ui||p.ui.panel!=='pack'||p.ui.shop||p.ui.carry||p.hp<=0)return false;
  if(p.inventory[index]?.type!=='pumpkin')return fail('Select a pumpkin in your backpack.');
  if(!hasCarvingKnife(p))return fail('Equip a knife in either hand to carve a pumpkin.');
  const list=structuredClone(p.inventory),item=list[index];
  if(item.qty>1)item.qty--;else clearSlot(list,index);
  if(!give(list,'jack_o_lantern',1))return fail('Make space for the carved jack-o’-lantern first.');
  p.inventory.splice(0,p.inventory.length,...list);
  p.ui.notice='Pumpkin carved! Equip your jack-o’-lantern or drop it on the ground.';
  g.uiRevision=(g.uiRevision||0)+1;g.onSound?.('harvest',p);g.persist?.();return true;
}
export function pickPumpkin(g,p){
  if(g.generatedEnvironment!=='graveyard'||g.phase!=='play'||p.room||p.ui||p.hp<=0)return false;
  const crop=(g.scenery||[]).filter(s=>s.kind==='pumpkin_crop'&&!s.picked&&!s.depleted&&Math.hypot(p.x-s.x,p.y+14-s.rootY)<48)
    .sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];
  if(!crop)return false;
  if(!give(p.inventory,'pumpkin',1)){g.message?.('Backpack full. The pumpkin stays in its patch.');return true;}
  crop.picked=true;g.uiRevision=(g.uiRevision||0)+1;g.message?.('Pumpkin picked. Equip a knife to carve it from your backpack.');g.onSound?.('harvest',p);g.persist?.();return true;
}
