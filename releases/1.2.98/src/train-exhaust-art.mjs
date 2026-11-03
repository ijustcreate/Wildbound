// Bounded reusable pixel billows. Particle motion/age remain live; the lobe
// silhouette is stamped once instead of rebuilding every row on every frame.
const clouds=new Map();let pixels=0;
export function drawPixelTrainCloud(c,p,x,y){
 const size=Math.max(2,Math.round(p.size/2)*2),variant=((Math.floor((p.seed||0)*17)%8)+8)%8,key=[p.kind,size,variant].join(':');let cloud=clouds.get(key);
 if(!cloud){const extent=Math.ceil(size*1.1)+4,canvas=document.createElement('canvas');canvas.width=canvas.height=extent*2;const pen=canvas.getContext('2d'),shades=p.kind==='smoke'?['#42494c','#68706e','#858b80']:['#b7c4ba','#d1d9c9','#e0e4d6'];
  for(let i=0;i<5;i++){const a=i*2.4+variant*Math.PI/4,r=size*(.32+(i%2)*.1),cx=extent+Math.cos(a)*size*.25,cy=extent+Math.sin(a)*size*.2;pen.fillStyle=shades[i%3];for(let row=-r;row<=r;row+=2){const half=Math.sqrt(Math.max(0,r*r-row*row));pen.fillRect(Math.round((cx-half)/2)*2,Math.round((cy+row)/2)*2,Math.ceil(half)*2,2);}}
  cloud={canvas,extent,pixels:canvas.width*canvas.height};clouds.set(key,cloud);pixels+=cloud.pixels;while(pixels>2*1024*1024&&clouds.size>1){const old=clouds.keys().next().value;pixels-=clouds.get(old).pixels;clouds.delete(old);}
 }else{clouds.delete(key);clouds.set(key,cloud);}
 c.imageSmoothingEnabled=false;c.drawImage(cloud.canvas,x-cloud.extent,y-cloud.extent);
}
