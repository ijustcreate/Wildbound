// Creature catalog modules must remain loadable before the Game and rig
// registries initialize. The live game supplies the full navigation service.
export function navigateCreature(game,actor,target,dt){
 if(typeof game.navigateCreature==='function')return game.navigateCreature(actor,target,dt);
 // Standalone pack previews use a small game facade. Its moveActor still
 // owns collision; the real game always uses the pathfinding service above.
 const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy)||1,step=Math.min(d,(actor.speed||0)*dt);
 actor.faceX=dx/d;actor.faceY=dy/d;
 return game.moveActor?.(actor,dx/d*step,dy/d*step,!!actor.flying)>0;
}
export function creatureClearShot(game,a,b,r=2){
 const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/4));
 for(let i=1;i<n;i++)if(game.projectileBlocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;
 return true;
}
