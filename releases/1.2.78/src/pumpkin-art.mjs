// Broad, squat reference silhouette. Worn size: 15×12, only a little wider
// than the normal humanoid skull; item/crop silhouettes remain 21px wide.
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawPumpkin(c,x,y,{direction=0,carved=false,time=0,worn=false}={}){
  const scale=worn?.7:1;
  const r=(a,b,w,h,color)=>{
    const left=Math.round(a*scale),top=Math.round(b*scale);
    const width=Math.round((a+w)*scale)-left,height=Math.round((b+h)*scale)-top;
    if(width&&height)pixel(c,x+left,y+top,width,height,color);
  };
  const profile=direction===2||direction===6,rear=direction>=3&&direction<=5;
  const half=profile?8:10;
  // Overlapping solid masses avoid the old horizontal scanline seams.
  r(-half,-4,half*2+1,8,'#512718');r(-half+1,-6,half*2-1,12,'#512718');
  r(-half+3,-7,half*2-5,14,'#512718');r(-4,-8,9,16,'#512718');
  r(-half+1,-3,half*2-1,6,'#b94f1d');r(-half+2,-5,half*2-3,10,'#b94f1d');
  r(-half+4,-6,half*2-7,12,'#d56c25');r(-4,-7,9,14,'#d56c25');
  r(-half+3,-3,3,7,'#e99335');r(-5,-6,9,2,'#e99335');r(half-3,-3,2,7,'#843819');
  if(rear){r(-3,-5,2,10,'#e99335');r(3,-5,2,10,'#a6461c');}
  r(-1,-9,3,2,'#51532c');r(0,-9,2,1,'#899043');
  if(!carved||rear)return;
  const flick=Math.sin(time*11)>0?1:0;
  const turn=direction===1?-1:direction===7?1:0;
  for(const side of profile?[direction===2?-1:1]:[-1,1]){
    const shift=profile?(side<0?2:-2):turn;
    const eye=(a,b,w,h,color)=>r(a+shift,b,w,h,color);
    // Outer corners rise; inner corners slope down toward the nose.
    eye(side<0?-8:3,-5,6,4,'#38251e');
    eye(side<0?-7:5,-4,3,1,'#ff9a29');eye(side<0?-6:4,-3,4,1,'#ffc04c');
    eye(side<0?-5:3,-2,3,1,'#ffc04c');eye(side<0?-7:6,-4,2,2,'#fff1a1');
    eye(side<0?-2:3,-5,2,1,'#b94f1d');eye(side<0?-8:7,-2,2,1,'#b94f1d');
    if(time)eye(side<0?-6:5,-4-flick,1,2,flick?'#fff1a1':'#ffda69');
  }
  const mouth=profile?(direction===2?-6:0):-8+turn,width=profile?7:17;
  r(mouth,1,width,4,'#38251e');r(mouth+2,5,width-4,1,'#38251e');
  // A continuous zigzag grin rather than a straight rectangular mouth.
  for(let n=0;n<width-1;n++){
    const yy=2+(n%4<2?0:1);r(mouth+n,yy,2,2,'#ffc04c');
  }
  r(mouth,0,2,2,'#d56c25');r(mouth+width-2,0,2,2,'#d56c25');
  if(!profile){r(turn,-1,1,1,'#fff1a1');r(turn-1,0,3,1,'#ffc04c');}
}
export function pumpkinHeadgear(c,id,anchor,d,time=0){
  if(id!=='jack_o_lantern')return false;
  drawPumpkin(c,anchor.x,anchor.y,{direction:d,carved:true,time,worn:true});return true;
}
export function paintPumpkinItem(c,id){
  if(!['pumpkin','jack_o_lantern'].includes(id))return false;
  drawPumpkin(c,12,14,{carved:id==='jack_o_lantern'});return true;
}
export function drawPumpkinCrop(c,p){
  pixel(c,p.x-18,p.y-3,36,7,'#443c2e');pixel(c,p.x-16,p.y-2,32,4,'#695236');
  for(const side of [-1,1]){pixel(c,p.x+side*13-4,p.y-3,9,3,'#40543a');pixel(c,p.x+side*16-3,p.y-5,6,2,'#6c7b42');}
  if(!p.picked)drawPumpkin(c,p.x,p.y-8);
}
