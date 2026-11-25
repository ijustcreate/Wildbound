// Native editable art study; not registered in runtime generation until approved.
import {swampNoise as noise} from './swamp-terrain.mjs';
export const CAVERN_STUDY={width:960,height:640,pixelSize:2,rooms:[{x:112,y:175,rx:100,ry:102},{x:356,y:114,rx:104,ry:83},{x:340,y:310,rx:92,ry:67}],passages:[[{x:174,y:163},{x:218,y:141},{x:246,y:153},{x:289,y:136}],[{x:384,y:171},{x:401,y:214},{x:372,y:250},{x:344,y:273}]]};
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function poly(c,points,col){for(let y=Math.floor(Math.min(...points.map(p=>p[1])));y<=Math.ceil(Math.max(...points.map(p=>p[1])));y++){const cuts=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i];if((a[1]>y+.5)!==(b[1]>y+.5))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}cuts.sort((a,b)=>a-b);for(let i=0;i<cuts.length;i+=2)rect(c,Math.ceil(cuts[i]),y,Math.ceil(cuts[i+1])-Math.ceil(cuts[i]),1,col);}}
function ellipse(c,x,y,rx,ry,col){for(let row=-ry;row<=ry;row++){const half=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx;rect(c,x-half,y+row,half*2,1,col);}}
function segment(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);}
export function cavernStudyDistance(x,y){
 const rooms=CAVERN_STUDY.rooms.map(p=>(Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)-1)*Math.min(p.rx,p.ry));
 const tunnels=CAVERN_STUDY.passages.flatMap(line=>line.slice(1).map((p,i)=>segment(x,y,line[i],p)-21));
 const base=Math.min(...rooms,...tunnels)+(noise(x/27,y/27)-.5)*19+(noise(x/9,y/9)-.5)*4;
 // Recesses and projecting rock noses break the room ellipses into excavated shapes.
 return Math.max(base,20-Math.hypot((x-24)*.8,y-159),18-Math.hypot(x-356,(y-205)*1.3));
}
const poolDistance=(x,y)=>Math.min(Math.hypot((x-100)/44,(y-211)/27)-1,Math.hypot((x-132)/27,(y-201)/18)-1)+(noise(x/19,y/19)-.5)*.3;
function floor(c){for(let y=0;y<320;y++)for(let x=0;x<480;x++){
 const d=cavernStudyDistance(x,y),n=noise(x/35,y/31),p=poolDistance(x,y);let color;
 if(d>0){const below=cavernStudyDistance(x,y+19);color=below<0?(noise(x/15,y/8)>.5?'#545c60':'#434c53'):d<8?'#2b333f':d<18?'#1a222e':'#0e1420';if(below<0&&cavernStudyDistance(x,y+5)>0)color=noise(x/19,y/12)>.48?'#737973':'#5c6665';if(below<0&&Math.floor(y+noise(x/16,3)*7)%11===0&&noise(x/12,y/9)>.35)color='#35434c';if(d<2)color='#303c46';}
 else if(p<0){color=p<-.32?'#203e50':p<-.1?'#315d68':'#4d777a';}
 else {color=n>.68?'#657071':n<.3?'#4a575e':'#58656a';if(d>-6)color='#3a4852';else if(d>-12)color='#48565e';if(p<.14)color='#718281';}
 rect(c,x,y,1,1,color);
 }
 for(let i=0;i<1800;i++){const x=hash(i,13)*480,y=hash(i,29)*320,d=cavernStudyDistance(x,y),p=poolDistance(x,y);if(d>-8)continue;
 if(p<-.12&&i%4===0)rect(c,x,y,3+hash(i,3)*8,1,'#537c81');else if(p>.2&&i%3===0){rect(c,x,y,2+hash(i,9)*3,1,i%2?'#748080':'#42515a');if(i%7===0)rect(c,x+2,y+1,2,1,'#42515a');}
 }
}
function shelf(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);
 ellipse(c,5,2,28,8,'#293943');
 poly(c,[[-26,-5],[-24,-18],[-15,-26],[7,-29],[24,-20],[30,-8],[25,5],[-18,7]],'#333f48');
 poly(c,[[-24,-17],[-14,-24],[6,-26],[22,-19],[19,-9],[-4,-7]],'#89908a');
 poly(c,[[-24,-17],[-4,-7],[-6,4],[-20,4]],'#606d70');
 poly(c,[[-4,-7],[19,-9],[27,-7],[23,3],[-6,4]],'#485860');
 poly(c,[[-20,-18],[-13,-22],[5,-24],[16,-20],[4,-19],[-1,-14]],'#a0a598');
 poly(c,[[-18,-7],[-6,-4],[-7,-1],[-20,-3]],'#7f8984');rect(c,4,-5,14,2,'#758180');c.restore();}
function stalagmites(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,2,2,22,6,'#293a43');
 for(const [xx,h,w]of [[-13,23,8],[2,44,11],[16,18,7]]){
 poly(c,[[xx-w,1],[xx-4,-h*.6],[xx-2,-h],[xx+1,-h-2],[xx+4,-h*.5],[xx+w,2]],'#36444c');
 poly(c,[[xx-w+2,0],[xx-2,-h*.6],[xx-1,-h],[xx+1,-h*.5],[xx+2,0]],'#9aa79e');
 poly(c,[[xx+1,-h],[xx+3,-h*.5],[xx+w-2,0],[xx+2,0]],'#647a7c');
 rect(c,xx-2,-h*.52,2,h*.3,'#b8c0a9');
 }c.restore();}
function crystals(c,x,y,scale=1,amber=false){c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,2,1,24,7,'#253b46');
 const ramp=amber?['#514845','#9e774e','#dbba75','#f1db9b']:['#294955','#427f88','#82c4bf','#d0e5cc'];
 for(const [xx,h,w,lean]of [[-16,17,7,-5],[-5,33,8,-3],[8,24,8,4],[19,13,6,6]]){
 poly(c,[[xx-w/2,1],[xx-w/2+lean,-h+6],[xx+lean,-h],[xx+w/2+lean,-h+7],[xx+w/2,0]],ramp[0]);
 poly(c,[[xx-w/2+1,0],[xx-w/2+lean+1,-h+6],[xx+lean,-h+1],[xx,0]],ramp[2]);
 poly(c,[[xx+lean,-h+1],[xx+w/2+lean-1,-h+7],[xx+w/2-1,0],[xx,0]],ramp[1]);
 poly(c,[[xx-w/2+lean+1,-h+6],[xx+lean,-h+1],[xx+lean+1,-h+8]],ramp[3]);
 }c.restore();}
function fungi(c,x,y){for(const [dx,h]of [[-6,8],[2,12],[9,6]]){rect(c,x+dx,y-h,2,h,'#a9b7a8');ellipse(c,x+dx,y-h,6,3,'#395760');ellipse(c,x+dx-1,y-h-1,5,2,'#719e9c');rect(c,x+dx-3,y-h-2,3,1,'#a8c8b2');}}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function warning(c,time){const x=223,y=147;ellipse(c,x,y,11,5,'#293740');ellipse(c,x,y,7,3,'#1d2b36');for(let i=0;i<6;i++){const dy=(time*17+i*7)%26;rect(c,x-8+hash(i,9)*16,y-31+dy,1,2,i%2?'#c5bf9d':'#8f9d98');}}
export function drawCavernStudy(c,{time=1.2,drawPlayer}={}){
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;const p=canvas.getContext('2d');floor(p);
 // Light is concentrated around wall growths; passages and floor remain legible.
 p.save();p.globalCompositeOperation='screen';glow(p,327,66,65,'#4a989c55');glow(p,432,111,48,'#61a1a648');glow(p,305,281,44,'#9c78383a');p.restore();
 const props=[{y:116,draw:()=>shelf(p,56,116,1.1)},{y:125,draw:()=>stalagmites(p,170,125,.9)},{y:73,draw:()=>crystals(p,326,73,1.1)},{y:133,draw:()=>crystals(p,436,133,.85)},{y:173,draw:()=>shelf(p,317,173,.85)},{y:167,draw:()=>stalagmites(p,425,167,.65)},{y:239,draw:()=>stalagmites(p,48,239,1.15)},{y:251,draw:()=>shelf(p,154,251,1)},{y:290,draw:()=>crystals(p,299,290,.8,true)},{y:317,draw:()=>stalagmites(p,414,317,1.1)},{y:139,draw:()=>fungi(p,81,139)},{y:268,draw:()=>fungi(p,370,268)}];
 if(drawPlayer)props.push({y:163,draw:()=>drawPlayer(p,145,163)});
 warning(p,time);props.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 // One drip: falling bead and low elliptical ripples, not a glowing hazard marker.
 rect(p,92,193+(time*14)%16,1,3,'#94b8b8');p.strokeStyle='#608d92';p.lineWidth=1;p.beginPath();p.ellipse(92,211,6,2,0,0,Math.PI*2);p.stroke();
 c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,960,640);
}

