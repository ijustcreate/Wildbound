export function samePirateCombatFloor(a,b){
 const left=a?.pirateRide,right=b?.pirateRide;
 if(!left||!right)return !left&&!right;
 if(left.shipId!==right.shipId||left.level==='rope'||right.level==='rope')return false;
 if(left.level==='nest'||right.level==='nest')return left.level===right.level&&left.nest===right.nest;
 if(left.level==='hold'||right.level==='hold')return left.level===right.level;
 return true;
}

export const pirateShotFloor=p=>p.pirateRide?{pirateRide:{...p.pirateRide},pirateVisualLift:p.pirateVisualLift||0}:{};
