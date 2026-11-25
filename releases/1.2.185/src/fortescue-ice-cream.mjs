export const FORTESCUE_ICE_CREAM_SECONDS=90;

const flavors={
 mint:{type:'diagon_ice_cream_mint_chip',name:'Mint Chip Ice Cream',price:9,color:'#8fc7aa',light:'#cee6bd',topping:'#49413e',
  stat:'manaRegen',bonus:1,effect:'+1 mana per second'},
 chocolate:{type:'diagon_ice_cream_chocolate',name:'Chocolate Ice Cream',price:10,color:'#976950',light:'#c69777',
  stat:'armor',bonus:2,effect:'+2 armor'},
 strawberry:{type:'diagon_ice_cream',name:'Strawberry Ice Cream',price:8,color:'#ce9da3',light:'#f3d4bc',
  stat:'hpRegen',bonus:.2,effect:'+0.2 health per second',heal:35},
 bertie:{type:'diagon_ice_cream_bertie_botts',name:'Bertie Bott’s Every-Flavour Ice Cream',price:12,color:'#cda6bc',light:'#f3d8ac',topping:'#7f5b9e',
  effect:'One random Fortescue flavor bonus'},
 moonberry:{type:'diagon_ice_cream_moonberry',name:'Moonberry Swirl',price:10,color:'#9380c1',light:'#cbc3ef',topping:'#634275',
  stat:'speedBonus',bonus:.05,effect:'+5% ground movement speed'},
};
const byType=Object.fromEntries(Object.entries(flavors).map(([key,spec])=>[spec.type,key]));
const surpriseFlavors=['mint','chocolate','strawberry','moonberry'];

export const FORTESCUE_ICE_CREAM_STOCK=Object.values(flavors).map(flavor=>[flavor.type,flavor.price]);
export const FORTESCUE_ICE_CREAM_ITEMS=Object.fromEntries(Object.values(flavors).map(flavor=>[flavor.type,{
 name:flavor.name,base:'potion',food:true,iceCream:true,stack:10,supplyOnly:true,color:flavor.color,artColor:flavor.color,
 highlightColor:flavor.light,...(flavor.topping?{iceCreamTopping:flavor.topping}:{}),...(flavor.heal?{heal:flavor.heal}:{}),
 description:`${flavor.heal?`Restore up to ${flavor.heal} health now. `:''}${flavor.effect} for 90 seconds. Replaces your current ice cream bonus.`,
}]));

export const isFortescueIceCream=type=>Object.hasOwn(byType,type);

export function fortescueIceCreamBonus(p,stat){
 const active=p.field?.fortescueIceCream;
 if(!(active?.remaining>0))return 0;
 const flavor=flavors[active.flavor];
 return flavor?.stat===stat?flavor.bonus:0;
}

export function eatFortescueIceCream(g,p,index){
 const item=p.inventory?.[index];
 if(p.hp<=0||!isFortescueIceCream(item?.type)||item.qty<=0)return false;
 const flavor=byType[item.type],scoop=flavors[flavor];
 const selected=flavor==='bertie'?surpriseFlavors[Math.min(surpriseFlavors.length-1,Math.floor(g.random()*surpriseFlavors.length))]:flavor;
 const restored=Math.max(0,Math.min(scoop.heal||0,p.maxHp-p.hp));
 p.hp+=restored;
 if(--item.qty===0)p.inventory[index]=null;
 (p.field??={}).fortescueIceCream={type:item.type,flavor:selected,remaining:FORTESCUE_ICE_CREAM_SECONDS};
 const notice=`${scoop.name} · ${restored?`+${restored} health now. `:''}${flavors[selected].effect} for 90 seconds.`;
 if(p.ui)p.ui.notice=notice;
 g.message?.(notice);
 g.onSound?.('heal',p);
 g.persist?.();
 return true;
}

export function tickFortescueIceCream(p,dt){
 const current=p.field?.fortescueIceCream;
 if(!current)return;
 current.remaining-=dt;
 if(current.remaining<=0)delete p.field.fortescueIceCream;
}
