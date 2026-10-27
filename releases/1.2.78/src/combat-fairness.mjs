export function mitigatedHit(raw,armor,difficulty='adventure'){
  raw=Math.max(0,Number(raw)||0);if(!raw)return 0;
  if(difficulty==='gentle')return 1;
  const reduced=Math.max(1,raw-Math.min(Math.max(0,Number(armor)||0),raw*.75));
  return reduced*(difficulty==='adventure'?.65:1);
}
export function actualDamage(before,after){return Math.max(0,Math.min(Math.max(0,before||0),(before||0)-(after||0)));}
export function spawnProtected(e,time){return Number.isFinite(e.spawnReadyAt)&&time<e.spawnReadyAt;}
