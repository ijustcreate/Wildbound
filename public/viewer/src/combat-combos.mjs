import {ITEMS,itemKind} from './items.mjs';
export const COMBO_KEY='wildbound-combos-v1';
export const COMBO_KINDS=['unarmed','dagger','sword','dagger_shield','sword_shield','dual_dagger','dual_sword','dagger_sword','wand','dual_wand','dagger_wand','sword_wand','melee'];
const step=(clip,damage=1,reach=1,arc=90,duration=.34)=>({clip,damage,reach,arc,duration});
export const DEFAULT_COMBOS=[
 {id:'melee',name:'Three swipe finisher',kind:'melee',enabled:true,steps:[step('swipe_one'),step('swipe_two',1.1),step('swipe_big',1.65,1.3,160,.55)]},
 {id:'unarmed',name:'Left right uppercut',kind:'unarmed',enabled:true,steps:[step('punch_left'),step('punch_right'),step('punch_left',1.1),step('punch_right',1.1),step('uppercut',1.8,1.2,105,.5)]},
 ...['dagger','sword','dagger_shield','sword_shield','dual_dagger','dual_sword','dagger_sword','wand','dual_wand','dagger_wand','sword_wand'].map(kind=>({id:kind,name:kind.replaceAll('_',' + ')+' combo',kind,enabled:false,steps:['wand','dual_wand','dagger_wand','sword_wand'].includes(kind)?[step('cast'),step('cast',1.1),step('cast',1.25,1.1,120,.45)]:[step('swipe_one'),step('swipe_two',1.1),step('swipe_big',1.65,1.3,160,.55)]})),
];
export const COMBO_CLIPS=['swipe_one','swipe_two','swipe_big','punch_left','punch_right','uppercut','slash','punch','cast'];
export const combos=structuredClone(DEFAULT_COMBOS);
export const validCombos=data=>Array.isArray(data)&&data.length<=48&&new Set(data.map(c=>c?.id)).size===data.length&&data.every(c=>typeof c.id==='string'&&c.id.length<80&&typeof c.name==='string'&&c.name.length>0&&c.name.length<=60&&COMBO_KINDS.includes(c.kind)&&typeof c.enabled==='boolean'&&Array.isArray(c.steps)&&c.steps.length>0&&c.steps.length<=12&&c.steps.every(s=>COMBO_CLIPS.includes(s.clip)&&[['damage',.1,5],['reach',.5,2],['arc',20,360],['duration',.15,2]].every(([k,a,b])=>Number.isFinite(s[k])&&s[k]>=a&&s[k]<=b)));
try{const saved=JSON.parse(globalThis.localStorage?.getItem(COMBO_KEY)||'null');if(validCombos(saved))combos.splice(0,combos.length,...saved);}catch{}
export function saveCombos(data){if(!validCombos(data))throw Error('Invalid combo settings');globalThis.localStorage?.setItem(COMBO_KEY,JSON.stringify(data));combos.splice(0,combos.length,...structuredClone(data));}
export function loadoutKind(actor){
 const hands=['hand1','hand2'].map(slot=>actor.equipment?.[slot]).filter(Boolean);
 const kinds=hands.map(id=>{
  if(id==='occupied')return '';
  const kind=ITEMS[id]?.magic?'wand':itemKind(id);
  return ['wand','shield','dagger','sword'].includes(kind)?kind:'';
 }).filter(Boolean);
 const w=kinds.filter(k=>k==='wand').length,m=kinds.filter(k=>k==='dagger'||k==='sword');
 if(!kinds.length)return 'unarmed';
 if(w===2)return 'dual_wand';
 if(w===1&&m.length)return `${m[0]}_wand`;
 if(w===1)return 'wand';
 if(m.length===2&&m[0]===m[1])return `dual_${m[0]}`;
 if(m.length===2)return 'dagger_sword';
 if(m.length===1&&kinds.includes('shield'))return `${m[0]}_shield`;
 return m[0]||'unarmed';
}
export function nextCombo(actor,kind,time){
 const combo=combos.find(c=>c.kind===kind&&c.enabled)||combos.find(c=>c.kind==='melee'&&kind!=='unarmed'&&c.enabled)||combos.find(c=>c.kind==='unarmed'&&kind==='unarmed'&&c.enabled);
 if(!combo){actor.comboId=null;return step(kind==='melee'?'slash':'punch');}
 const index=actor.comboId===combo.id&&time<(actor.comboUntil||0)?((actor.comboIndex||0)+1)%combo.steps.length:0;
 actor.comboId=combo.id;actor.comboIndex=index;actor.comboUntil=time+combo.steps[index].duration+.8;
 return combo.steps[index];
}
