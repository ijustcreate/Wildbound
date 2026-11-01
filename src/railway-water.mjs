export function railwaySurface(d,x,y){const edge=d.river.width/2-Math.abs(x-d.river.x);if(edge>=0)return edge<22?'shallow':'water';const lake=d.station?.lake;if(lake&&Number.isFinite(y)){const r=Math.hypot((x-lake.x)/lake.rx,(y-lake.y)/lake.ry);if(r<1)return r>.84?'shallow':'water';}return 'grass';}
export function railwayWaterDepth(d,x,y){return railwaySurface(d,x,y)!=='grass';}
