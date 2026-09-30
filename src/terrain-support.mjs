// A falling actor's feet can leave a top before its collision circle clears
// the side. Let it move out (or slide along), but never deeper into that side.
// Only movement supplies `from`; stationary queries and projectiles stay solid.
export function raisedSurfaceBlocked(rect,x,y,radius,from=null,offset=0){
  const distance=(px,py)=>Math.hypot(px-Math.max(rect.x,Math.min(px,rect.x+rect.w)),py-Math.max(rect.y,Math.min(py,rect.y+rect.h)));
  const next=distance(x,y);
  if(next>=radius)return false;
  if(from){
    const previous=distance(from.x,from.y+offset);
    const outside=(px,py)=>px<=rect.x||px>=rect.x+rect.w||py<=rect.y||py>=rect.y+rect.h;
    if(previous<radius&&next>=previous&&outside(from.x,from.y+offset)&&outside(x,y))return false;
  }
  return true;
}
export function stumpShape(p){
  if(!p.fallen||!['tree','snow_tree','palm'].includes(p.kind))return null;
  const scale=(p.size||64)/64,base=p.rootY??p.y+(p.size||64)*(p.kind==='palm'?.19:.35);
  return {x:p.x-7*scale,y:base-4*scale,w:14*scale,h:7*scale,height:6*scale};
}
export function bridgeAt(g,x,y){
  const tx=Math.floor(x/32),ty=Math.floor(y/32);
  if(tx<0||ty<0||tx>=50||ty>=50)return false;
  return g?.terrain?.[ty*50+tx]==='bridge';
}
export function terrainSupport(g,a,offset=0){
  let height=bridgeAt(g,a.x,a.y)&&!a.underBridge&&!a.swimming?10:0;
  for(const p of g?.scenery||[]){const s=stumpShape(p);if(s&&a.x>=s.x&&a.x<=s.x+s.w&&a.y+offset>=s.y&&a.y+offset<=s.y+s.h)height=Math.max(height,s.height);}
  return height;
}
export function terrainActorDepth(g,a,depth=a.y){
  for(const p of g.scenery||[]){const s=stumpShape(p);if(s&&(a.jumpHeight||a.groundHeight||0)>=s.height&&a.x>=s.x&&a.x<=s.x+s.w&&a.y>=s.y-14&&a.y<=s.y+s.h)depth=Math.max(depth,s.y+s.h+.1);}
  return depth;
}
