// Generated plates are sampled once on a shared logical grid; runtime motion stays pixel sharp.
export const TV_PARALLAX_LAYERS=Object.freeze([
 {id:'far-valley',file:'far-valley-v1.png',speed:.045,y:28,height:512,alpha:1},
 {id:'ruin-aqueduct',file:'ruin-aqueduct-v1.png',speed:.14,y:-43,height:480,alpha:.65},
 {id:'mid-forest',file:'mid-forest-v1.png',speed:.28,y:-75,height:512,alpha:.78},
 {id:'near-canopy',file:'near-canopy-v1.png',speed:.48,y:37,height:400,alpha:.66},
]);
let pending=null,ready=false,error=null;const surfaces=new Map();
export function loadTvParallax(){
 if(pending)return pending;
 pending=Promise.all(TV_PARALLAX_LAYERS.map(layer=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.round(512*img.naturalHeight/img.naturalWidth);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(img,0,0,canvas.width,canvas.height);surfaces.set(layer.id,canvas);resolve();
  };img.onerror=()=>reject(Error('Unable to load TV parallax plate: '+layer.file));img.src=new URL('../assets/tv-arena/'+layer.file,import.meta.url).href;
 }))).then(()=>{ready=true;return tvParallaxStatus();}).catch(e=>{error=e.message;return tvParallaxStatus();});return pending;
}
export function tvParallaxStatus(){return {ready,error,layers:surfaces.size,pixels:[...surfaces.values()].reduce((n,c)=>n+c.width*c.height,0)};}
export function parallaxTiles(camera,left,width,tileWidth,speed){
 const scroll=Math.floor(camera*speed),tiles=[];
 for(let i=Math.floor((left+scroll)/tileWidth);i*tileWidth-scroll<left+width;i++)tiles.push({x:Math.round(i*tileWidth-scroll),mirror:Math.abs(i%2)===1});
 return tiles;
}
export function drawTvParallax(c,camera,left,width,time){
 if(!pending)loadTvParallax();if(!ready)return false;
 c.save();c.imageSmoothingEnabled=false;c.fillStyle='#6c9b8c';c.fillRect(left,55,width,485);
 for(const layer of TV_PARALLAX_LAYERS){
  const surface=surfaces.get(layer.id),w=Math.round(layer.height*surface.width/surface.height);c.globalAlpha=layer.alpha;
  for(const tile of parallaxTiles(camera,left,width,w,layer.speed)){
   if(tile.mirror){c.save();c.translate(tile.x+w,layer.y);c.scale(-1,1);c.drawImage(surface,0,0,w,layer.height);c.restore();}
   else c.drawImage(surface,tile.x,layer.y,w,layer.height);
  }
 }
 c.globalAlpha=.45;c.fillStyle='#d3dc97';
 for(let i=0;i<18;i++){const period=1250,x=((i*191-camera*.34+Math.sin(time*.18+i)*12)%period+period)%period;for(let at=x;at<left+width;at+=period)if(at>=left)c.fillRect(Math.round(at),Math.round(125+i*47%285+Math.sin(time*.7+i)*4),2,2);}
 c.restore();return true;
}
