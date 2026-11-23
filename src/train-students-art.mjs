const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
export function drawStudentScarf(c,p,d,colors=['#8d3a36','#d2a657'],collarOnly=false){
 const back=d>=3&&d<=5,profile=d===2||d===6,x=p.chest.x,y=p.chest.y-(collarOnly?3.5:6),red=colors[0],gold=colors[1];
 pixel(c,x-(profile?2:4),y,profile?4:8,2,'#38292f');pixel(c,x-(profile?1.5:3.5),y+.5,profile?3:7,1.5,red);pixel(c,x-1,y+.5,1,1.5,gold);
 if(!back&&!collarOnly){const tail=x+(profile?(d===2?-1.5:1.5):1);pixel(c,tail-1.5,y+1.5,3,7,'#38292f');pixel(c,tail-1,y+1.5,2,6,red);for(const dy of [3,6])pixel(c,tail-1,y+dy,2,1,gold);}
}
export function drawHarryFace(c,p,d,look){
 if(look?.face!=='harry_potter'||d>=3&&d<=5)return;
 const names=d===2?['eyeL']:d===6?['eyeR']:['eyeL','eyeR'];
 for(const name of names){const q=p[name],x=q.x,y=q.y-1;pixel(c,x-1.5,y-1.5,3, .5,'#302d34');pixel(c,x-2,y-1, .5,2,'#302d34');pixel(c,x+1.5,y-1,.5,2,'#302d34');pixel(c,x-1.5,y+1,3,.5,'#302d34');}
 if(names.length===2)pixel(c,(p.eyeL.x+p.eyeR.x)/2-.5,(p.eyeL.y+p.eyeR.y)/2-1,1,.5,'#302d34');
 const q=p[d===2?'eyeL':'eyeR'];pixel(c,q.x-.5,q.y-5,.5,1,'#a26052');pixel(c,q.x-1,q.y-4,.5,1,'#a26052');pixel(c,q.x-.5,q.y-3,.5,1,'#a26052');
}
export function drawHogwartsHem(c,p,d){
 const back=d>=3&&d<=5,profile=d===2||d===6,ink='#272730',base='#383641',light='#504a58';
 const poly=(points,color)=>{c.fillStyle=color;const top=Math.floor(Math.min(...points.map(q=>q.y))),bottom=Math.ceil(Math.max(...points.map(q=>q.y)));for(let y=top;y<=bottom;y++){const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a.y<=y+.5&&b.y>y+.5)||(b.y<=y+.5&&a.y>y+.5))hits.push(a.x+(y+.5-a.y)*(b.x-a.x)/(b.y-a.y));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)c.fillRect(Math.floor(hits[i]),y,Math.max(1,Math.ceil(hits[i+1]-hits[i])),1);}};
 for(const side of ['L','R']){const hip=p['hip'+side],knee=p['knee'+side],foot=p['foot'+side],sign=side==='L'?-1:1,width=profile?3:4,hem={x:knee.x+(foot.x-knee.x)*.4,y:knee.y+(foot.y-knee.y)*.4};poly([{x:hip.x-sign*1.5,y:hip.y-3},{x:hip.x+sign*width,y:hip.y-3},{x:hem.x+sign*(width+1),y:hem.y},{x:hem.x-sign*(back?2:1),y:hem.y}],ink);poly([{x:hip.x-sign*.6,y:hip.y-2},{x:hip.x+sign*(width-1),y:hip.y-2},{x:hem.x+sign*(width-.2),y:hem.y-1},{x:hem.x-sign*(back?1:.2),y:hem.y-1}],side==='L'?light:base);}
}
export function paintSchoolUniformIcon(c,type){
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},ink='#292831',cloth='#3b3945',light='#625c69';
 if(type==='hogwarts_student_robes'){r(7,3,10,3,ink);r(5,5,14,16,ink);r(3,6,4,10,ink);r(17,6,4,10,ink);r(6,6,12,14,cloth);r(4,7,3,8,cloth);r(17,7,3,8,cloth);r(10,5,4,11,'#aaa2a2');r(10,6,1,13,light);r(13,6,1,13,'#2d2b35');r(11,7,2,4,'#873e37');r(6,19,4,2,light);r(14,19,4,2,cloth);return true;}
 if(type==='hogwarts_trousers'){r(5,4,14,6,ink);r(5,9,6,12,ink);r(13,9,6,12,ink);r(6,5,12,4,'#5b5360');r(6,10,4,10,'#4b4650');r(14,10,4,10,'#3d3844');r(6,6,12,2,'#362e30');r(11,6,2,2,'#b39a68');return true;}
 if(type==='hogwarts_shoes'){for(const [x,y]of [[3,5],[12,11]]){r(x,y,8,8,ink);r(x-1,y+5,10,5,ink);r(x+1,y+1,5,6,'#795339');r(x,y+6,8,2,'#5b3c2c');r(x+2,y+2,4,1,'#b48b5d');}return true;}
 if(type==='hogwarts_cuffs'){for(const x of [4,14]){r(x-1,4,7,17,ink);r(x,5,5,14,'#89818f');r(x,6,5,2,'#bcb0b4');r(x,16,5,3,'#5a5260');r(x+1,9,2,6,'#a59ba5');}return true;}
 return false;
}
