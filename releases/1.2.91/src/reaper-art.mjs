// Native chunky pixels, attached to the shared humanoid joints in all eight views.
const ink='#111219',dark='#202127',cloth='#30323b',light='#484b54',bone='#ded5b8',shade='#a69e87';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
function line(c,a,b,width,color){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));for(let i=0;i<=n;i++)rect(c,a.x+(b.x-a.x)*i/n-width/2,a.y+(b.y-a.y)*i/n-width/2,width,width,color);}
function poly(c,points,color){for(let y=Math.min(...points.map(p=>p[1]));y<=Math.max(...points.map(p=>p[1]));y+=.5){const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)rect(c,xs[i],y,Math.max(.5,xs[i+1]-xs[i]),.5,color);}}
export function reaperHood(c,id,h,d){
 if(id!=='reaper_hood')return false;
 const back=d>=3&&d<=5,side=d===2||d===6,diagonal=d%2===1,sign=d<4?-1:1;
 const x=h.x,y=h.y,w=side?5:6;
 // Half-pixel source grid: 26 deliberate pixels across, matching hero heads.
 const turn=back?-1:1,width=side?.8:1;
 const shape=[[-9,-3],[-8,-7],[-5,-10],[-1,-11],[3,-9],[6,-5],[7,0],[6,5],[2,8],[-3,7],[-6,4],[-7,0],[-5,-5],[-6,-6],[-8,-4]];
 const points=shape.map(([a,b])=>[x+a*width*turn,y+b]);poly(c,points,ink);
 poly(c,shape.map(([a,b])=>[x+a*width*.9*turn,y+b*.93]),cloth);
 line(c,{x:x-7*width*turn,y:y-5},{x:x-3*width*turn,y:y-9},1,light);
 line(c,{x:x-3*width*turn,y:y-9},{x:x+2*width*turn,y:y-8},1,light);
 line(c,{x:x+2*width*turn,y:y-8},{x:x+5*width*turn,y:y-4},1,light);
 line(c,{x:x-4*width*turn,y:y+4},{x:x+3*width*turn,y:y-5},1.5,dark);
 if(back){rect(c,x-.5+sign*(diagonal?2:0),y-5,1.5,10,dark);rect(c,x-w+1,y-3,.5,7,light);rect(c,x+1,y+4,2,.5,light);return true;}
 const fx=x+(side?sign*2:diagonal?sign*.5:0),fw=side?2.5:4;
 poly(c,[[fx,y-6],[fx+fw+1,y-3],[fx+fw+1.5,y+2],[fx+2,y+6],[fx-2,y+6],[fx-fw-1,y+2],[fx-fw-.5,y-2]],ink);
 // Domed brow, inset temples, cheekbones and a narrow articulated jaw.
 const rows=[[-4.5,fw-1],[-4,fw-.5],[-3.5,fw],[-3,fw],[-2.5,fw],[-2,fw],[-1.5,fw],[-1,fw],[-.5,fw-.5],[0,fw-.5],[.5,fw-1],[1,fw-1.5],[1.5,fw-1],[2,fw-1],[2.5,fw-1],[3,fw-1.5],[3.5,fw-1.5]];
 for(const [dy,span]of rows){rect(c,fx-span,y+dy,span*2+.5,.5,shade);rect(c,fx-span,y+dy,span*2-.5,.5,bone);}
 rect(c,fx-fw+1,y-3.5,fw*1.5,.5,'#f2e9cc');
 const eyes=side?[sign*1.25]:[-2,1.5];
 for(const ex of eyes){rect(c,fx+ex-1,y-2,2,2,ink);rect(c,fx+ex-.5,y-2.5,1.5,.5,shade);rect(c,fx+ex-.5,y-1.5,.5,.5,'#62716a');}
 rect(c,fx-.5,y,1,1.5,ink);rect(c,fx-.5,y,1.5,.5,bone);
 rect(c,fx-(side?1:2),y+2,side?2.5:4.5,.5,ink);
 for(let tooth=side?-1:-2;tooth<=(side?1:2);tooth++)rect(c,fx+tooth,y+2,.5,1,bone);
 rect(c,fx-1,y+3.5,2,.5,shade);
 return true;
}
export function reaperRibs(c,p,d){
 if(d>=3&&d<=5)return;
 const side=d===2||d===6,w=side?2:4,a=p.chest,b=p.pelvis;
 for(let i=0;i<4;i++){const t=.16+i*.17,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,span=w-i*.3;
  for(const s of [-1,1]){line(c,{x,y:y+.5},{x:x+s*(span-1),y:y+1},.75,shade);line(c,{x,y},{x:x+s*(span-1),y:y+.5},.5,bone);line(c,{x:x+s*(span-1),y:y+.5},{x:x+s*span,y:y-.5},.5,bone);}
 }
 line(c,{x:a.x,y:a.y+1},{x:b.x,y:b.y-2},.75,bone);
}
export function reaperGlove(c,id,h){if(id!=='reaper_gloves')return false;rect(c,h.x-2,h.y-2,4.5,4.5,ink);rect(c,h.x-1,h.y-2,2.5,1.5,shade);rect(c,h.x-1,h.y-2,2,.5,bone);for(let x=-1.5;x<=1.5;x++){rect(c,h.x+x,h.y-.5,.5,2.5,bone);rect(c,h.x+x,h.y+.5,.5,.5,shade);}rect(c,h.x-2,h.y-.5,.5,1.5,bone);return true;}
export function reaperSleeve(c,id,e,h){if(id!=='reaper_chest')return;const end={x:h.x+(e.x-h.x)*.15,y:h.y+(e.y-h.y)*.15};line(c,e,end,3.5,ink);line(c,e,end,2.5,cloth);line(c,{x:e.x-.5,y:e.y},{x:end.x-.5,y:end.y},.5,light);}
export function reaperSkirt(c,p,d){
 const a=p.pelvis,b={x:(p.footL.x+p.footR.x)/2,y:(p.footL.y+p.footR.y)/2-1};
 const side=d===2||d===6,n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2)),vx=b.x-a.x,vy=b.y-a.y,len=Math.hypot(vx,vy)||1;
 for(let i=0;i<=n;i++){const t=i/n,w=(side?3.5:5)+t*2,x=a.x+vx*t,y=a.y+vy*t;
  for(let k=-Math.ceil(w);k<=w;k+=.5){const edge=Math.abs(k)>w-.5,color=edge?ink:k<-w*.45?light:k>w*.25?dark:cloth;rect(c,x+vy/len*k,y-vx/len*k,.5,1,color);}
  if(t>.15)rect(c,x-vy/len*w*.15,y+vx/len*w*.15,.5,1,light);
 }
 line(c,{x:a.x-4,y:a.y},{x:a.x+4,y:a.y},2,ink);rect(c,a.x-1,a.y-1,2,2,shade);
}
export function drawScythe(c,h,d,action,t,project,glow=false,gripAxis=null){
 const active=action==='scythe_sweep'||action==='scythe_reap',reverse=action==='scythe_reap';
 const phase=t<.3?-.9:t<.65?-.9+(t-.3)/.35*2.2:1.3-(t-.65)/.35*1.3;
 const angle=active?phase*(reverse?-1:1):.12;
 const length=gripAxis?Math.hypot(...gripAxis):0,axis=length>1e-5?gripAxis.map(v=>v/length):null;
 const flat=axis?Math.hypot(axis[0],axis[1]):0,blade=flat>.05?[axis[1]/flat,-axis[0]/flat,0]:[1,0,0];
 const point=(x,z)=>{const v=project(axis?axis.map((v,i)=>v*z+blade[i]*x):[x*Math.cos(angle)+z*Math.sin(angle),0,z*Math.cos(angle)-x*Math.sin(angle)],d);return {x:h.x+v.x,y:h.y+v.y};};
 line(c,point(0,-9),point(0,24),3,ink);line(c,point(0,-9),point(0,24),1,'#88633e');
 const arc=[[0,24],[-5,24],[-11,23],[-17,20],[-22,16],[-25,11]];
 for(let i=1;i<arc.length;i++){const a=point(...arc[i-1]),b=point(...arc[i]);if(glow)line(c,a,b,i<4?6:3,'#92efcf55');line(c,a,b,i<4?4:2,ink);line(c,a,b,i<4?3:1,glow?'#aff1d9':'#8d9a9e');line(c,{x:a.x,y:a.y+1},{x:b.x,y:b.y+1},.75,glow?'#f1ffe5':'#e1e4db');}
 line(c,point(-1,20),point(1,20),2,shade);
}
export function paintReaperItem(c,id){
 const target=c;
 c={fillStyle:'',fillRect(x,y,w,h){const left=Math.max(0,Math.round(x)),top=Math.max(0,Math.round(y)),right=Math.min(24,Math.max(left+1,Math.round(x+w))),bottom=Math.min(24,Math.max(top+1,Math.round(y+h)));if(right>left&&bottom>top){target.fillStyle=this.fillStyle;target.fillRect(left,top,right-left,bottom-top);}}};
 if(id==='scythe'||id==='reaper_scythe'){
  const pixels={fillStyle:'',fillRect(x,y,w,h){const left=Math.round(16+x*.65),top=Math.round(17+y*.65);c.fillStyle=this.fillStyle;c.fillRect(left,top,Math.max(1,Math.round(16+(x+w)*.65)-left),Math.max(1,Math.round(17+(y+h)*.65)-top));}};
  drawScythe(pixels,{x:0,y:0},0,'idle',0,([x,y,z])=>({x,y:y*.5-z}));
  if(id==='reaper_scythe')rect(c,15,15,2,2,bone);
  return true;
 }
 if(id==='reaper_hood'){reaperHood(c,id,{x:12,y:12},0);return true;}
 if(id==='reaper_gloves'){reaperGlove(c,id,{x:7,y:12});reaperGlove(c,id,{x:17,y:12});return true;}
 if(id==='reaper_chest'){rect(c,5,4,14,17,ink);rect(c,6,5,12,15,cloth);rect(c,2,6,4,12,cloth);rect(c,18,6,4,12,cloth);reaperRibs(c,{chest:{x:12,y:6},pelvis:{x:12,y:20}},0);return true;}
 if(id==='deaths_shroud'){poly(c,[[7,3],[17,3],[21,22],[16,20],[12,23],[7,20],[3,22]],ink);poly(c,[[8,4],[16,4],[18,20],[12,19],[6,20]],cloth);line(c,{x:10,y:5},{x:8,y:19},1,light);return true;}
 if(id==='reaper_skirt'){reaperSkirt(c,{pelvis:{x:12,y:4},footL:{x:9,y:22},footR:{x:15,y:22}},0);return true;}return false;
}
