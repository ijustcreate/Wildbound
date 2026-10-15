export function trainingPoints(p) {
  p.field??={};
  if(p.field.trainingVersion!==1){
    const ranks=Object.values(p.field.skills||{}).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);
    p.field.trainingPoints=Math.max(0,Math.floor(p.level||1)-1-ranks);
    p.field.trainingVersion=1;
  }
  p.field.trainingPoints=Math.max(0,Math.floor(Number(p.field.trainingPoints)||0));
  return p.field.trainingPoints;
}
export function awardTrainingPoint(p){trainingPoints(p);p.field.trainingPoints++;}
