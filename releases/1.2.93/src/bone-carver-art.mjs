// Native articulated Bone Carver study. Integer scanlines keep every facet on the game grid.
const ink='#332c37',bone='#e5dac1',shade='#b4a6a4',green='#64876b';
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function poly(c,x,y,points,color){const lo=Math.floor(Math.min(...points.map(p=>p[1]))),hi=Math.ceil(Math.max(...points.map(p=>p[1])));for(let row=lo;row<hi;row++){const cuts=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i],yy=row+.5;if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))cuts.push(a[0]+(yy-a[1])*(b[0]-a[0])/(b[1]-a[1]));}cuts.sort((a,b)=>a-b);for(let k=0;k+1<cuts.length;k+=2)r(c,x+Math.ceil(cuts[k]),y+row,Math.max(1,Math.floor(cuts[k+1])-Math.ceil(cuts[k])+1),1,color);}}
export function drawCarverCrown(c,h,d,time=0){
 const side=d===2||d===6,back=d>=3&&d<=5,diag=d===1||d===7||d===3||d===5,sgn=d<4?-1:1;
 // A broad, pointed mane, with a jagged hem rather than horizontal hair rows.
 const hair=[[-4,-10],[3,-11],[7,-7],[8,-1],[7,5],[10,11],[7,10],[9,17],[4,15],[4,20],[-1,17],[-5,20],[-5,15],[-10,17],[-8,10],[-10,9],[-7,3],[-7,-5]];
 const hx=h.x+(side?-sgn*2:0);poly(c,hx,h.y,hair,ink);
 poly(c,hx,h.y,[[-4,-9],[2,-10],[6,-6],[5,3],[8,10],[5,9],[7,15],[2,13],[1,18],[-3,14],[-7,16],[-5,8],[-7,7],[-5,0]],'#c6b9b1');
 poly(c,hx,h.y,[[-4,-9],[1,-10],[3,-6],[0,0],[-3,4],[-2,10],[-5,14],[-4,5],[-6,1]],'#f0e3ca');
 poly(c,hx,h.y,[[3,-7],[6,-5],[5,3],[7,9],[4,7],[5,13],[2,11],[1,4]],'#96878d');
 if(!back){const fx=h.x+(side?sgn*3:diag?sgn*1:0);
 // Narrow face framed by sweeping pale fringe; retain the joint-mounted head.
 poly(c,fx,h.y,[[-4,-5],[3,-5],[4,0],[2,5],[0,7],[-3,4],[-4,0]],'#d2ae96');
 poly(c,fx,h.y,[[-3,-5],[1,-5],[1,4],[-1,5],[-3,2]],'#f0cfaa');
 if(!side){r(c,fx-3,h.y,2,1,'#394844');r(c,fx+2,h.y,2,1,'#394844');r(c,fx-2,h.y,1,1,'#8fb292');}else r(c,fx+sgn*2,h.y,1,1,'#4a5547');
 poly(c,fx,h.y,[[-5,-7],[0,-9],[4,-6],[1,-3],[0,0],[-2,-3],[-5,-1]],bone);
 poly(c,fx,h.y,[[1,-8],[5,-5],[5,1],[3,5],[3,-2],[0,-5]],'#b8aaa3');
 poly(c,fx,h.y,[[-1,-7],[1,-8],[2,-6],[0,-4]],'#4e9b78');
 }
 // Heavy ram curls: broad bases, recessed dark center, tapered inward tip.
 const horns=side?[sgn]:[-1,1];for(const sg of horns){poly(c,hx,h.y,[[sg*2,-8],[sg*5,-10],[sg*7,-8],[sg*5,-5],[sg*3,-5]],'#9b8380');const squish=diag&&sg===sgn?.8:1,px=(a)=>a.map(([x,y])=>[sg*(2+(x-2)*.6)*squish,-6+(y+6)*.65]);
 poly(c,hx,h.y,px([[4,-6],[6,-13],[10,-17],[14,-16],[17,-12],[17,-7],[14,-3],[10,-3],[7,-6],[8,-10],[11,-11],[13,-9],[12,-7],[10,-7],[11,-5],[14,-6],[15,-10],[12,-13],[9,-12],[8,-6]]),ink);
 poly(c,hx,h.y,px([[5,-7],[7,-13],[10,-16],[13,-15],[12,-12],[9,-11],[8,-6]]),'#aa9378');
 poly(c,hx,h.y,px([[10,-16],[14,-15],[16,-12],[13,-11],[12,-13],[9,-13]]),'#e0cba2');
 poly(c,hx,h.y,px([[16,-12],[17,-8],[14,-4],[10,-4],[8,-6],[9,-9],[11,-10],[13,-9],[12,-7],[10,-7],[11,-5],[14,-6],[15,-10]]),'#514047');
 }
 if(!back)drawCarverEyeParticles(c,{x:h.x+(side?sgn*3:diag?sgn:0),y:h.y},d,time);
 return true;
}
export function drawCarverVest(c,p,d){const side=d===2||d===6,back=d>=3&&d<=5,x=p.chest.x,y=p.chest.y,w=side?3:5,waist=p.pelvis.y-y;
 poly(c,x,y,[[-w,-2],[-3,-4],[0,-1],[3,-4],[w,-2],[4,5],[3,waist-2],[6,waist+3],[0,waist+6],[-6,waist+3],[-3,waist-2],[-4,5]],ink);
 poly(c,x,y,[[-w+1,-2],[-3,-3],[0,1],[3,-3],[w-1,-1],[3,5],[2,waist-2],[5,waist+2],[0,waist+4],[-5,waist+2],[-2,waist-2],[-3,5]],bone);
 poly(c,x,y,[[2,0],[w-1,-1],[3,5],[2,waist-2],[5,waist+2],[1,waist+3],[0,6]],'#b4a9a1');
 if(!back){poly(c,x,y,[[-3,-3],[0,-1],[3,-3],[1,3],[-1,3]],'#c9aa95');poly(c,x,y,[[-1,-2],[1,-2],[2,0],[0,2],[-2,0]],'#5f9877');}
 for(const sg of [-1,1])poly(c,x,y,[[sg*2,waist-3],[sg*6,waist-5],[sg*8,waist-1],[sg*4,waist+1]],'#8ca580');
}
export function drawBoneWorkbench(c,npc){const x=npc.x+42,y=npc.y+6;r(c,x-22,y-6,45,20,ink);r(c,x-20,y-8,41,15,'#6b5941');r(c,x-20,y-8,41,2,'#a29167');r(c,x-19,y+7,4,14,'#443d32');r(c,x+15,y+7,4,14,'#443d32');r(c,x-6,y-10,14,3,bone);r(c,x-8,y-11,4,5,shade);r(c,x+7,y-11,4,5,shade);r(c,x-17,y-15,8,8,'#325a48');r(c,x-16,y-14,6,2,'#8ca47a');r(c,x+11,y-16,3,12,'#d0c8a9');r(c,x+10,y-5,5,3,'#514235');r(c,x-1,y-8,3,1,ink);}
export function drawCarvedBoneIcon(c,animal){r(c,7,4,11,17,ink);r(c,8,5,9,14,bone);r(c,15,6,2,13,shade);if(['bird','dragonfly','grave_moth','fairy','marsh_firefly'].includes(animal)){r(c,3,7,7,5,bone);r(c,16,7,6,5,shade);r(c,10,6,4,9,'#72856a');}else if(animal==='frog'){r(c,5,12,15,6,bone);r(c,6,9,4,3,bone);r(c,15,9,4,3,bone);r(c,7,10,1,1,ink);r(c,16,10,1,1,ink);}else if(['white_mouse','scavenger'].includes(animal)){r(c,6,2,4,6,bone);r(c,15,2,4,6,shade);r(c,10,9,1,2,ink);r(c,15,9,1,2,ink);}else if(animal==='crab'||animal==='crypt_beetle'){for(let i=0;i<3;i++){r(c,4,8+i*4,5,2,bone);r(c,16,8+i*4,5,2,shade);}r(c,11,6,2,13,'#738568');}else{r(c,7,9,11,4,'#7a9176');r(c,15,8,6,5,bone);}r(c,10,20,6,2,'#72856a');const details={marsh_firefly:[[10,13,4,4,'#a8c58b']],dragonfly:[[2,6,7,1,bone],[16,6,7,1,shade],[11,2,2,5,shade]],fairy:[[9,1,1,4,bone],[14,1,1,4,bone],[11,10,2,3,'#b89bb0']],bird:[[15,9,6,2,shade],[9,17,2,4,ink]],scavenger:[[5,14,3,7,shade],[7,18,3,1,ink],[10,9,7,2,ink]],grave_moth:[[6,4,2,4,shade],[17,4,2,4,shade],[3,11,4,5,shade]],crypt_beetle:[[11,5,2,13,ink],[7,3,2,4,bone],[16,3,2,4,shade]]};for(const p of details[animal]||[])r(c,...p);}

export function drawCarverMantle(c,p,d){const side=d===2||d===6,back=d>=3&&d<=5,diag=d===1||d===7||d===3||d===5,x=p.pelvis.x,y=p.pelvis.y-2,len=Math.max(17,Math.max(p.footL.y,p.footR.y)-y-2);
 // Split leaf train: pale upper blades, moss midplanes and dark teal hanging tips.
 const panel=(sg,near=true)=>{const w=side?9:diag?13:15,xx=x+sg*(side?1:3),sy=y+(near?0:-1);const pts=[[0,-5],[sg*5,-2],[sg*w,len-3],[sg*7,len-6],[sg*5,len],[sg*2,len-4],[-sg*1,4]];poly(c,xx,sy,pts,ink);poly(c,xx,sy,[[0,-4],[sg*4,-1],[sg*(w-1),len-4],[sg*6,len-7],[sg*4,len-2],[sg*1,len-5],[0,4]],'#28584e');poly(c,xx,sy,[[0,-4],[sg*4,-1],[sg*7,len*.49],[sg*3,len*.7],[sg*1,len*.4],[-sg*1,3]],'#799b78');poly(c,xx,sy,[[0,-4],[sg*4,-1],[sg*6,len*.3],[sg*2,len*.45],[-sg*1,3]],'#dadbc0');poly(c,xx,sy,[[sg*4,len*.25],[sg*8,len*.67],[sg*5,len*.8],[sg*3,len*.55]],'#4e8067');};
 if(back){poly(c,x,y,[[-7,-6],[7,-6],[10,len-4],[5,len],[0,len-3],[-5,len],[-10,len-4]],'#28584e');poly(c,x,y,[[-7,-6],[7,-6],[5,5],[0,12],[-5,5]],'#b4c3a0');poly(c,x,y,[[-4,2],[0,4],[4,2],[5,12],[0,len-2],[-5,12]],'#598d72');}
 panel(-1,false);panel(1,true);
}

export function drawCarverDress(c,p,d){const side=d===2||d===6,back=d>=3&&d<=5,x=p.pelvis.x,y=p.pelvis.y-2,len=Math.max(15,Math.max(p.footL.y,p.footR.y)-y-4),w=side?4:7;
 poly(c,x,y,[[-3,-2],[3,-2],[w,len-3],[w-2,len],[2,len-2],[0,len],[-3,len-2],[-w,len-1]],ink);
 poly(c,x,y,[[-2,-2],[2,-2],[w-1,len-4],[w-2,len-1],[1,len-3],[0,len-1],[-3,len-3],[-w+1,len-2]],'#396452');
 poly(c,x,y,[[-2,-1],[2,-1],[4,len*.4],[1,len*.64],[-3,len*.48]],'#c6ccb0');
 poly(c,x,y,[[-2,1],[0,1],[1,len*.47],[-2,len*.65],[-4,len*.43]],'#e2ddc3');
 poly(c,x,y,[[2,2],[4,len*.4],[w-1,len-4],[3,len*.75],[1,len*.55]],'#759375');
 if(back)poly(c,x,y,[[-1,0],[1,0],[2,len*.5],[0,len-1],[-2,len*.5]],'#8da385');}
export function drawCarverEyeParticles(c,h,d,time){if(d>=3&&d<=5)return;const side=d===2||d===6,eyes=side?[d===2?-2:2]:[-3,3];for(const x of eyes){r(c,h.x+x,h.y,1,1,'#ff80c4');if(!c.save)continue;c.save();c.globalCompositeOperation='lighter';c.shadowColor='#ff48b2';c.shadowBlur=3;for(let i=0;i<3;i++){const life=(time*.55+i*.34)%1;c.globalAlpha=(1-life)*.6;r(c,h.x+x+Math.sin(time*1.7+i)*1.2,h.y-life*7,1,1,'#ff70c3');}c.restore();}}
export function drawCarverCircle(c,npc,time){if(!c.beginPath||!c.stroke)return;const x=npc.campX??npc.x,y=(npc.campY??npc.y)+3;c.save();c.translate(x,y);c.scale(1,.5);c.strokeStyle='#19191b';c.lineWidth=3;for(const radius of [39,32]){c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}const lines=()=>{for(const offset of [0,Math.PI]){c.beginPath();for(let i=0;i<4;i++){const a=offset+i*Math.PI*2/3,px=Math.sin(a)*30,py=Math.cos(a)*30;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}};c.lineWidth=2;lines();c.globalAlpha=.12+Math.sin(time*1.1)*.035;c.strokeStyle='#fc6ab4';c.lineWidth=1;c.shadowColor='#ff4eae';c.shadowBlur=4;for(const radius of [39,32]){c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}lines();c.restore();}
