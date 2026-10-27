// Deterministic local clearings used by points of interest. Keeping this small
// makes event camps and wells feel placed in the world rather than at the door.
export function locationClearing(g,focus,seed=0){
  const points=[];for(let ring=2;ring<=5&&points.length<2;ring++)for(let n=0;n<8&&points.length<2;n++){
    const a=(n+(seed%8)*.17)*Math.PI/4,x=focus.x+Math.cos(a)*ring*64,y=focus.y+Math.sin(a)*ring*64;
    if(x<96||y<96||x>1504||y>1504||g.blocked(x,y,22,false,false,false,0))continue;
    if(!points.some(p=>Math.hypot(p.x-x,p.y-y)<130))points.push({x,y});
  }
  return {center:points[0]||focus,points};
}
