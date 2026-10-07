export const PLAYER_RENDER_SIZE = 43;
export const LOBBY_WORLD_SCALE = 2;
export const LOBBY_PLAYER_SIZE = PLAYER_RENDER_SIZE * LOBBY_WORLD_SCALE;

// Both scenes use the same logical viewport and nearest-neighbour sprite sampling.
export function resizeGameSurface(canvas,ctx,pixelScale=2){
  const w=Math.max(1,Math.round(canvas.clientWidth/2)),h=Math.max(1,Math.round(canvas.clientHeight/2));
  const density=Math.min(2,globalThis.devicePixelRatio||1),scale=pixelScale*density;
  const width=Math.round(w*scale),height=Math.round(h*scale);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  ctx.setTransform(scale,0,0,scale,0,0);ctx.imageSmoothingEnabled=false;
  return {w,h,scale};
}
