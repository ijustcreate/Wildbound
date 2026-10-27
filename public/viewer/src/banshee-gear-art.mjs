// Native-resolution pixels, fitted to the existing humanoid attachment anchors.
const pixels=(c,a={x:0,y:0})=>(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(a.x+x),Math.round(a.y+y),w,h);};
export function bansheeHood(c,h,d,p){
 const r=pixels(c,h),back=d>=3&&d<=5,side=d===2||d===6;
 r(-2,-11,5,1,p.ink);r(-4,-10,9,2,p.ink);r(-6,-8,13,5,p.ink);
 r(-3,-10,7,1,p.base);r(-4,-8,9,2,p.base);r(-5,-6,2,4,p.base);r(4,-7,2,4,p.dark);r(-4,-8,2,2,p.light);
 r(0,-10,1,1,p.trim);r(0,-9,1,1,p.shine);
 if(back){r(-5,-3,11,7,p.ink);r(-4,-3,9,6,p.base);r(-3,-2,2,4,p.light);r(3,-3,1,6,p.dark);}
 else{
  const cheeks=side?[d===2?4:-5]:[-5,4];
  for(const x of cheeks){r(x,-3,2,8,p.ink);r(x,-3,1,7,p.base);r(x,3,2,1,p.trim);}
  // Only the brow is covered; the shared face/elf ears remain visible below it.
  r(side?(d===2?-3:0):-3,-4,side?4:7,1,p.dark);
 }
}
export function widenBansheeCape(rows){
 return rows.map((row,i)=>{
  const center=row.left.map((v,k)=>(v+row.right[k])/2),width=1+.5*i/24;
  const expand=point=>point.map((v,k)=>k<2?center[k]+(v-center[k])*width:v);
  return {...row,left:expand(row.left),right:expand(row.right),segments:row.segments.map(s=>({...s,left:expand(s.left),right:expand(s.right)}))};
 });
}
export function bansheeShoulder(c,a,d,side,p){
 const r=pixels(c,a),rear=d>=3&&d<=5,sign=side==='L'?-1:1;
 r(-4,-3,9,5,p.ink);r(-3,-3,7,3,p.base);r(-3,-3,6,1,p.light);
 r(sign<0?-5:3,-5,2,3,p.ink);r(sign<0?-5:4,-5,1,3,p.trim);
 r(sign<0?-3:2,-7,1,4,p.shine);r(sign<0?-5:4,1,2,3,p.ink);r(sign<0?-5:4,1,1,2,p.light);
 if(!rear){
  r(-2,-2,5,4,p.trim);r(-1,-3,3,1,p.shine);r(-1,-1,1,1,p.ink);r(1,-1,1,1,p.ink);
  r(0,0,1,1,p.dark);r(-1,2,3,1,p.light);r(0,2,1,1,p.ink);
 }else{r(-2,-1,5,1,p.dark);r(0,-2,1,3,p.shine);}
}
export function bansheeCuirass(c,points,d,p,skin){
 const r=pixels(c),a=points.chest,b=points.pelvis,back=d>=3&&d<=5,side=d===2||d===6;
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
 for(let n=0;n<=steps;n++){
  const t=n/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,w=side?4:7;
  const bare=!back&&t>.38&&t<.8;
  r(x-w/2,y,w,1,bare?skin:t>.8?p.dark:p.base);
  r(x-w/2,y,1,1,bare?'#6d96ab':p.trim);
  if(!bare&&!side)r(x+w/2-1,y,1,1,p.dark);
 }
 r(a.x-3,a.y,6,1,p.trim);r(b.x-3,b.y-1,7,2,p.ink);r(b.x-3,b.y-1,7,1,p.trim);
 if(!back){r(a.x,a.y+1,1,2,'#9ae5ed');r(b.x,b.y-2,1,2,p.shine);}
}
export function bansheeGearIcon(c,kind,p){
 const r=pixels(c);
 if(kind==='hat'){bansheeHood(c,{x:12,y:15},0,p);r(8,13,9,8,p.dark);r(10,14,5,5,'#85b9cd');r(10,15,1,1,'#ee627f');r(14,15,1,1,'#ee627f');}
 else if(kind==='shoulder_armor'){bansheeShoulder(c,{x:6,y:13},0,'L',p);bansheeShoulder(c,{x:18,y:13},0,'R',p);r(10,14,4,1,p.trim);}
 else if(kind==='bow'){
  for(const [x,y,w,h]of [[7,2,5,2],[11,4,3,3],[13,7,3,4],[15,11,3,4],[13,15,3,4],[10,19,4,2],[6,21,5,2]]){r(x-1,y,w+2,h,p.ink);r(x,y,w,h,p.base);r(x,y,1,h,p.shine);}
  r(7,3,1,19,p.trim);r(13,10,5,4,p.dark);r(14,11,2,2,'#94eff6');r(6,1,2,3,p.shine);r(5,21,2,2,p.shine);
 }else if(kind==='quiver'){
  for(const x of [8,12,16]){r(x,1,1,11,p.trim);r(x-1,2,3,3,p.shine);}
  r(5,8,14,14,p.ink);r(6,9,12,12,p.base);r(6,9,2,12,p.light);r(16,9,2,12,p.dark);
  r(5,9,14,2,p.trim);r(6,19,12,2,p.trim);r(10,13,5,4,p.trim);r(11,14,1,1,p.ink);r(13,14,1,1,p.ink);r(12,16,1,2,'#9ae5ed');
 }else if(kind==='cape'){
  for(let y=3;y<22;y++){const w=Math.min(10,3+Math.floor(y/3));r(12-w,y,w*2,1,p.ink);r(13-w,y,w*2-2,1,p.base);r(13-w,y,1,1,p.light);}
  for(const [x,y]of [[4,20],[8,21],[12,19],[18,21]]){r(x,y,2,3,p.ink);r(x,y,1,2,p.trim);}
  r(9,2,6,3,p.trim);r(11,3,2,2,'#9ae5ed');r(10,8,1,10,p.light);r(15,7,1,12,p.dark);
 }else return false;
 return true;
}
