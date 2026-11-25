// Native palette and alpha conversion retain the existing CPU algorithm.
// Unoccupied assembled cars reuse the completed image instead of reading again.
export function shadeCarPixels(data){
 for(let i=0;i<data.length;i+=4){if(data[i+3]<128){data[i+3]=0;continue;}data[i+3]=255;for(let k=0;k<3;k++)data[i+k]=Math.min(255,Math.round(data[i+k]/8)*8);}return data;
}
// Empty cars reuse their assembled native image; moving occupants bypass this
// bounded cache. Keep the CPU palette conversion as the exact reference.
let surface,readbacks=0;const frames=new Map(),MAX_BYTES=8*1024*1024;let frameBytes=0;
export function carPixelShaderStats(){return {mode:'cpu-cached',readbacks,entries:frames.size,bytes:frameBytes,limit:MAX_BYTES};}
export function drawPixelShadedCar(c,v,g,paint,{cacheKey=null}={}){
 let entry=cacheKey&&frames.get(cacheKey);if(entry){frames.delete(cacheKey);frames.set(cacheKey,entry);}
 if(!entry){surface??=document.createElement('canvas');const size=Math.ceil(Math.max(v.w||96,v.h||144)*2+64),cx=Math.floor(size/2),cy=Math.floor(size*.65);if(surface.width!==size||surface.height!==size)surface.width=surface.height=size;
  const pen=surface.getContext('2d',{willReadFrequently:true});pen.setTransform(1,0,0,1,0,0);pen.clearRect(0,0,size,size);pen.save();pen.translate(cx-v.x,cy-v.y);paint(pen,v,g);pen.restore();
  const pixels=pen.getImageData(0,0,size,size);readbacks++;shadeCarPixels(pixels.data);pen.putImageData(pixels,0,0);const result=surface;
  entry={canvas:result,cx,cy};if(cacheKey){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d',{willReadFrequently:true}).putImageData(pixels,0,0);entry={canvas,cx,cy,bytes:size*size*4};while(frames.size&&(frameBytes+entry.bytes>MAX_BYTES||frames.size>=16)){const key=frames.keys().next().value;frameBytes-=frames.get(key).bytes;frames.delete(key);}if(entry.bytes<=MAX_BYTES){frames.set(cacheKey,entry);frameBytes+=entry.bytes;}}
 }
 c.save();c.imageSmoothingEnabled=false;c.drawImage(entry.canvas,Math.round(v.x)-entry.cx,Math.round(v.y)-entry.cy);c.restore();
}
