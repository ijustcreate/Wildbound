export const PLAYER_RENDER_SIZE = 43;
export const creatureRenderSize=kind=>['skeleton','archer','skeleton_unarmed','frost_skeleton_mage','skeleton_wizard'].includes(kind)?PLAYER_RENDER_SIZE:kind==='elephant'?82:kind==='baby_spider'?27:
  ['golem','crocodile','lion','tiger','white_lion','rhino','dragon','zebra','carnivorous_flower'].includes(kind)?61:
  ['bat','wasp','bee','tsetse'].includes(kind)?34:47;
export const LOBBY_WORLD_SCALE = 2;
export const LOBBY_PLAYER_SIZE = PLAYER_RENDER_SIZE * LOBBY_WORLD_SCALE;
export const actorRenderSize=actor=>actor?.isPlayer?(actor.controlledBy&&actor.kind?creatureRenderSize(actor.kind):PLAYER_RENDER_SIZE):creatureRenderSize(actor?.kind);

// Both scenes use the same logical viewport and nearest-neighbour sprite sampling.
export function resizeGameSurface(canvas,ctx,pixelScale=2,{densityLimit=2}={}){
  const w=Math.max(1,Math.round(canvas.clientWidth/2)),h=Math.max(1,Math.round(canvas.clientHeight/2));
  const density=Math.min(densityLimit,globalThis.devicePixelRatio||1),scale=pixelScale*density;
  const width=Math.round(w*scale),height=Math.round(h*scale);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  ctx.setTransform(scale,0,0,scale,0,0);ctx.imageSmoothingEnabled=false;
  return {w,h,scale};
}
