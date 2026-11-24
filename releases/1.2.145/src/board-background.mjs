// Cache custom board brightness at source resolution; never filter each tiny table draw.
const entries=new Map(),LIMIT=32*1024*1024;let bytes=0;
export function drawBoardBackground(c,image,brightness=1){
 if(brightness===1||typeof document==='undefined'){c.save();c.filter=brightness===1?'none':`brightness(${brightness})`;c.drawImage(image,-140,-96,280,192);c.restore();return;}
 const key=[image.src,brightness,image.naturalWidth,image.naturalHeight].join(':');let entry=entries.get(image);
 if(entry?.key!==key){if(entry){bytes-=entry.bytes;entries.delete(image);}const canvas=document.createElement('canvas'),scale=Math.min(1,2048/image.naturalWidth,2048/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const pen=canvas.getContext('2d');pen.filter=`brightness(${brightness})`;pen.drawImage(image,0,0,canvas.width,canvas.height);entry={key,canvas,bytes:canvas.width*canvas.height*4};while(entries.size&&(bytes+entry.bytes>LIMIT||entries.size>=4)){const [old,value]=entries.entries().next().value;bytes-=value.bytes;entries.delete(old);}bytes+=entry.bytes;}
 entries.delete(image);entries.set(image,entry);c.drawImage(entry.canvas,-140,-96,280,192);
}
