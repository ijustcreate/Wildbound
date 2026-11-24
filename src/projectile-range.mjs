export const chargedProjectileRange=charge=>280+280*Math.max(0,Math.min(1,(charge||0)/1.2));
export const chargedSpellDiameter=strength=>6+Math.round(strength*8);
export const arrowBeyondWorld=(world,x,y)=>x<10||y<10||x>(world.trainTest?.design.width||1600)-10||y>(world.trainTest?.design.height||1600)-10;
export function arrowFlightGravity(speed,charge,z=18){
 const t=chargedProjectileRange(charge)/speed,vz=20+70*Math.max(0,Math.min(1,(charge||0)/1.2));
 return 2*(z+vz*t)/(t*t);
}
