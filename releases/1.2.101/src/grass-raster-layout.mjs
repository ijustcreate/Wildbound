export const GRASS_BUFFER_WIDTH=1536,GRASS_BUFFER_HEIGHT=1024;
// Small zoom changes keep the same backing dimensions. The GPU allocation is
// fixed; the current world-space viewport occupies a cropped rectangle in it.
export function grassRasterLayout(w,h,zoom){
 const pixelStep=2**Math.max(1,Math.ceil(Math.log2(Math.max(w/zoom/1200,h/zoom/800))));
 return {pixelStep,width:Math.ceil((w/zoom+128)/pixelStep/64)*64,height:Math.ceil((h/zoom+128)/pixelStep/64)*64};
}
