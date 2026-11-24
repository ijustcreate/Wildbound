export const BROOM_SEAT_DROP=2,BROOM_PITCH=.08,BROOM_GRIP_FORWARD=9;
export {drawWitchHat} from './witch-hat-art.mjs';
const ink='#252e29',wood='#936335',light='#c29453',straw='#bd8a3f';
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function line(c,a,b,width,color){const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let n=0;n<=steps;n++)pixel(c,a.x+(b.x-a.x)*n/steps-width/2,a.y+(b.y-a.y)*n/steps-width/2,width,width,color);}
export function broomPoint(d,forward,z=0){const a=d*Math.PI/4;return {x:-Math.sin(a)*forward,y:Math.cos(a)*forward*.52-z-forward*BROOM_PITCH};}
function polygon(c,points,color){const left=Math.floor(Math.min(...points.map(p=>p.x))),right=Math.ceil(Math.max(...points.map(p=>p.x))),top=Math.floor(Math.min(...points.map(p=>p.y))),bottom=Math.ceil(Math.max(...points.map(p=>p.y)));for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}if(inside)pixel(c,x,y,1,1,color);}}
export function drawBroom(c,p,d,type='flying_broom'){if(type==='firebolt')return drawFirebolt(c,p,d);if(type==='nimbus_2000')return drawNimbus(c,p,d);const z=p.pelvis.y+BROOM_SEAT_DROP,point=n=>{const q=broomPoint(d,n);return{x:p.pelvis.x+q.x,y:z+q.y};},front=point(22),rear=point(-23),brush=point(-34);line(c,rear,front,4,ink);line(c,rear,front,2,wood);line(c,{x:rear.x,y:rear.y-1},{x:front.x,y:front.y-1},1,light);const side={x:Math.cos(d*Math.PI/4),y:Math.sin(d*Math.PI/4)*.52};const rim=(p,w,sign)=>({x:p.x+side.x*w*sign,y:p.y+side.y*w*sign});polygon(c,[rim(rear,3,-1),rim(brush,7,-1),rim(brush,7,1),rim(rear,3,1)],ink);polygon(c,[rim(rear,2,-1),rim(brush,6,-1),rim(brush,6,1),rim(rear,2,1)],straw);polygon(c,[rear,rim(brush,5,-1),brush],'#d6a353');for(const n of [-3,2])line(c,rear,rim(brush,Math.abs(n),Math.sign(n)),1,'#967036');line(c,{x:rear.x-side.x*3,y:rear.y-side.y*3},{x:rear.x+side.x*3,y:rear.y+side.y*3},3,'#5d4731');}
export function drawNimbus(c,p,d){
 const root={x:p.pelvis.x,y:p.pelvis.y+BROOM_SEAT_DROP},point=(n,z=0)=>{const q=broomPoint(d,n,z);return {x:root.x+q.x,y:root.y+q.y};},side={x:Math.cos(d*Math.PI/4),y:Math.sin(d*Math.PI/4)*.52},edge=(q,w)=>({x:q.x+side.x*w,y:q.y+side.y*w});
 const rear=point(-22),neck=point(-26),middle=point(-35),tail=point(-45,1),shaft=point(23),nose=point(31,2);
 polygon(c,[edge(neck,-2),edge(middle,-7),edge(tail,-3),edge(tail,3),edge(middle,7),edge(neck,2)],'#35291f');
 polygon(c,[edge(neck,-1.5),edge(middle,-6),edge(tail,-2),edge(tail,2),edge(middle,6),edge(neck,1.5)],'#8c542d');
 polygon(c,[edge(neck,-1),edge(middle,-5),edge(tail,-1.5),tail,edge(middle,1.5)],'#bf8a4d');
 for(const n of [-3,0,3])line(c,neck,edge(tail,n*.6),1,n<0?'#ddb477':'#684326');
 line(c,rear,shaft,4,'#35291f');line(c,rear,shaft,2,'#88532f');line(c,{x:rear.x,y:rear.y-1},{x:shaft.x,y:shaft.y-1},1,'#c08a50');line(c,shaft,nose,3,'#35291f');line(c,shaft,nose,1,'#ad783e');
 for(const n of [-22,3,10]){const q=point(n);line(c,edge(q,-2),edge(q,2),3,'#76522e');line(c,edge(q,-1.7),edge(q,1.7),1,'#e3c16e');}
}

function drawFirebolt(c,p,d){
 const angle=d*Math.PI/4,sideX=Math.cos(angle),sideY=Math.sin(angle)*.52;
 const point=(forward,side=0,height=0)=>{
  const q=broomPoint(d,forward,height);
  return {x:p.pelvis.x+q.x+sideX*side,y:p.pelvis.y+BROOM_SEAT_DROP+q.y+sideY*side};
 };
 const outline='#2e2729',ebony='#4e3934',bronze='#ac794f',iron='#555958';
 const shape=(points,color)=>polygon(c,points.map(v=>point(...v)),color);
 const stroke=(a,b,width,color)=>line(c,point(...a),point(...b),width,color);
 const near=d>=1&&d<=3?1:-1;
 function stirrup(sign){
  const curve=[[-16,sign*1,0],[-13,sign*4,-1],[-8,sign*7,-5],[-3,sign*8,-6],[-3,sign*10,-5]];
  for(let i=1;i<curve.length;i++)stroke(curve[i-1],curve[i],2,outline);
  for(let i=1;i<curve.length;i++)stroke(curve[i-1],curve[i],1,sign===near?'#909089':iron);
  stroke(curve[3],curve[4],2,sign===near?'#a5a398':'#747470');
 }
 stirrup(-near);
 shape([[-21,-2],[-28,-5],[-36,-7],[-46,-5,1],[-50,-3,2],[-46,-1,1],[-48,2,1],[-43,5],[-36,6],[-27,4],[-21,2]],outline);
 shape([[-22,-1],[-29,-4],[-37,-6],[-47,-3,1],[-42,-2,1],[-46,2,1],[-39,5],[-31,4],[-22,1]],'#765642');
 shape([[-22,-1,1],[-33,-5,1],[-44,-4,2],[-39,0,1],[-32,1,1]],'#a6764e');
 for(const [tail,fan,height,color] of [[-48,-3,2,'#c49765'],[-45,-1,1,'#72503b'],[-46,2,1,'#b58a5a'],[-40,4,0,'#5b4235']]){
  stroke([-27,fan*.27,0],[tail,fan,height],1,color);
 }
 stroke([-23,0,0],[19,0,0],4,outline);
 stroke([-22,0,0],[19,0,0],2,ebony);
 stroke([18,0,0],[33,0,2.3],3,outline);
 stroke([18,0,0],[32,0,2.3],1,ebony);
 stroke([-21,-.6,1],[18,-.6,1],1,'#88604a');
 stroke([18,-.6,1],[31,-.6,3],1,'#9b7355');
 for(const forward of [13,17,22,26]){
  const q=point(forward,-.7,1+(forward>20?1:0));
  pixel(c,q.x,q.y,1,1,bronze);
 }
 stroke([-23,-2,0],[-23,2,0],4,'#4a3c36');
 stroke([-23,-2,1],[-23,1.8,1],2,'#9f7954');
 stroke([-23,-1.75,2],[-23,1,2],1,'#e5b97a');
 stirrup(near);
}

export function drawBroomIcon(c){drawBroom(c,{pelvis:{x:12,y:13}},6);}

const carryPalettes={
 flying_broom:{shaft:wood,highlight:light,brush:straw,shade:'#896136',tip:'#d6a353',band:'#80603c',tail:26},
 nimbus_2000:{shaft:'#88532f',highlight:'#c08a50',brush:'#a86c3e',shade:'#683e2b',tip:'#cc9c5d',band:'#d5b16d',tail:31},
 firebolt:{shaft:'#4e3934',highlight:'#ad7952',brush:'#855c43',shade:'#583c34',tip:'#b98b63',band:'#b99063',tail:32},
};

export function drawShoulderBroom(c,type,point,brushEnd){
 const p=carryPalettes[type]||carryPalettes.flying_broom;
 if(!brushEnd){
  const grip=point(-.7),tip=point(13,.6);
  line(c,grip,tip,3,ink);
  line(c,point(0,.4),point(12,1),1,p.highlight);
  return;
 }
 const base=-p.tail+11,tail=-p.tail;
 line(c,point(base),point(.7),3,ink);
 line(c,point(base,.4),point(.7,.4),1,p.shaft);
 // The bound bundle has thickness around the handle. Keep its cross-section
 // visible even in side views, where the broom's horizontal axis is foreshortened.
 const root=point(base),end=point(tail),dx=end.x-root.x,dy=end.y-root.y;
 const length=Math.hypot(dx,dy)||1,sign=dx>=0?1:-1;
 const edge=(forward,spread)=>{
  const p=point(forward);
  return {x:p.x-dy*sign/length*spread,y:p.y+dx*sign/length*spread};
 };
 const brush=[edge(base,-1.35),edge(tail+7,-2.5),edge(tail+2,-3.5),edge(tail,-2),
  edge(tail+1,2.8),edge(tail+5,3.1),edge(base,1.5)];
 polygon(c,brush,ink);
 polygon(c,[edge(base,-.75),edge(tail+7,-1.6),edge(tail+3,-2.5),edge(tail+1,-1.6),
  edge(tail+2,1.8),edge(tail+5,2),edge(base,.9)],p.brush);
 line(c,edge(base-2,-.4),edge(tail+3,-1.6),1,p.tip);
 line(c,edge(base-3,.7),edge(tail+3,1.5),1,p.shade);
 line(c,edge(base-1,-1.25),edge(base-1,1.25),2,ink);
 line(c,edge(base-.8,-1),edge(base-.8,1),1,p.band);
}
