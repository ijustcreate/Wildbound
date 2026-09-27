export const COMBO_KEY='wildbound-combos-v1';
const step=(clip,damage=1,reach=1,arc=90,duration=.34)=>({clip,damage,reach,arc,duration});
export const DEFAULT_COMBOS=[
 {id:'melee',name:'Three swipe finisher',kind:'melee',enabled:true,steps:[step('swipe_one'),step('swipe_two',1.1),step('swipe_big',1.65,1.3,160,.55)]},
 {id:'unarmed',name:'Left right uppercut',kind:'unarmed',enabled:true,steps:[step('punch_left'),step('punch_right'),step('punch_left',1.1),step('punch_right',1.1),step('uppercut',1.8,1.2,105,.5)]},
];
export const COMBO_CLIPS=['swipe_one','swipe_two','swipe_big','punch_left','punch_right','uppercut','slash','punch'];
export const combos=structuredClone(DEFAULT_COMBOS);
export const validCombos=data=>Array.isArray(data)&&data.length<=24&&new Set(data.map(c=>c?.id)).size===data.length&&data.every(c=>typeof c.id==='string'&&c.id.length<80&&typeof c.name==='string'&&c.name.length>0&&c.name.length<=60&&['melee','unarmed'].includes(c.kind)&&typeof c.enabled==='boolean'&&Array.isArray(c.steps)&&c.steps.length>0&&c.steps.length<=12&&c.steps.every(s=>COMBO_CLIPS.includes(s.clip)&&[['damage',.1,5],['reach',.5,2],['arc',20,360],['duration',.15,2]].every(([k,a,b])=>Number.isFinite(s[k])&&s[k]>=a&&s[k]<=b)));
try{const saved=JSON.parse(globalThis.localStorage?.getItem(COMBO_KEY)||'null');if(validCombos(saved))combos.splice(0,combos.length,...saved);}catch{}
export function saveCombos(data){if(!validCombos(data))throw Error('Invalid combo settings');globalThis.localStorage?.setItem(COMBO_KEY,JSON.stringify(data));combos.splice(0,combos.length,...structuredClone(data));}
export function nextCombo(actor,kind,time){
 const combo=combos.find(c=>c.kind===kind&&c.enabled);
 if(!combo){actor.comboId=null;return step(kind==='melee'?'slash':'punch');}
 const index=actor.comboId===combo.id&&time<(actor.comboUntil||0)?((actor.comboIndex||0)+1)%combo.steps.length:0;
 actor.comboId=combo.id;actor.comboIndex=index;actor.comboUntil=time+combo.steps[index].duration+.8;
 return combo.steps[index];
}
