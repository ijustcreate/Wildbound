export function setTreeFallDirection(tree,dx=1,dy=0){
 if(Math.hypot(dx,dy)<1e-6){dx=1;dy=0;}const length=Math.hypot(dx,dy);tree.fallX=dx/length;tree.fallY=dy/length;
 if(!Number.isFinite(tree.fallX)||!Number.isFinite(tree.fallY)){tree.fallX=1;tree.fallY=0;}
 tree.fallDirection=tree.fallX<0?-1:1;
}
export function treeFallVector(tree){return Number.isFinite(tree.fallX)&&Number.isFinite(tree.fallY)?{x:tree.fallX,y:tree.fallY}:{x:tree.fallDirection||1,y:0};}
export function applyTreeFall(c,tree,angle){
 if(!Number.isFinite(tree.fallX)||!Number.isFinite(tree.fallY)){c.rotate(angle);return;}
 const v=treeFallVector(tree),s=Math.sin(Math.abs(angle)),cos=Math.cos(Math.abs(angle));
 // Rotate height into the ground plane; preserve the fixed cut/root pivot.
 const yy=cos-v.y*s*.5;
 c.transform(1-Math.abs(v.x)*(1-cos),v.x*s,-v.x*s,Math.abs(yy)<.05?(yy<0?-.05:.05):yy,0,0);
}
