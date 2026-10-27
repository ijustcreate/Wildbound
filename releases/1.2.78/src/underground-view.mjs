export const UNDERGROUND_VIEW=Object.freeze({width:640,height:400,top:26,bottom:22,zoom:2.6});
// The world renderer uses one logical pixel per two CSS pixels. Share that
// convention and its camera zoom instead of stretching a miniature room.
export function fitUndergroundCanvas(canvas,renderer){
 const width=Math.max(160,Math.round((canvas.clientWidth||1280)/2)),height=Math.max(120,Math.round((canvas.clientHeight||800)/2));
 const density=2*Math.min(2,globalThis.devicePixelRatio||1),w=Math.round(width*density),h=Math.round(height*density);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const c=canvas.getContext('2d');c.setTransform(density,0,0,density,0,0);c.imageSmoothingEnabled=false;
 return {...UNDERGROUND_VIEW,width,height,zoom:renderer?.camera?.zoom||2.6};
}
