import {drawPalmTree,drawTreeRoots,drawStump,treeFallPose,TREE_CUT_Y} from './forest.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
const line=(c,x,y,xx,yy,color,width=1)=>pixelLine(c,{x,y},{x:xx,y:yy},color,width);
const poly=(c,points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
const crown=(c,x,y,rx,ry,color,seed)=>{for(let row=-ry;row<=ry;row+=2){const w=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx,jag=hash(row,seed)*2;rect(c,x-w+jag,y+row,w*2-jag,2,color);}};
function cypressTrunk(c,p){
 drawTreeRoots(c,p);
 for(const [a,b,w]of [[[-1,-4],[4,-22],9],[[4,-22],[-4,-42],8],[[-4,-42],[-16,-61],6]]){line(c,...a,...b,'#353d32',w+2);line(c,...a,...b,'#80664a',w);line(c,a[0]-2,a[1],b[0]-2,b[1],'#b09364',2);}
 for(const [x,y,xx,yy]of [[3,-24,26,-44],[-3,-37,-31,-50],[-9,-47,16,-61],[-14,-58,-31,-65]]){line(c,x,y,xx,yy,'#353d32',4);line(c,x-1,y-1,xx,yy-1,'#9b8057',2);}
}
function cypressCrown(c,p,time){
 const wind=Math.sin(time*1.1+p.x)*.8;
 for(const [i,[x,y,rx,ry]]of [[-29,-53,20,8],[20,-47,23,9],[2,-64,24,9],[-28,-69,21,8],[-8,-77,28,10]].entries()){
  const seed=hash(p.x+i,p.rootY),xx=x+wind;
  crown(c,xx,y,rx,ry,'#244939',seed);crown(c,xx-2,y-2,rx-3,ry-2,'#3d6743',seed);
  for(let n=0;n<13;n++){const lx=(hash(n,seed)-.5)*rx*1.6,ly=(hash(seed,n)-.6)*ry*1.4;if(lx*lx/(rx*rx)+ly*ly/(ry*ry)>.7)continue;rect(c,xx+lx-2,y+ly-2,5,2,n%4?'#78934e':'#a4ad64');rect(c,xx+lx,y+ly,3,2,'#5f8047');}
 }
}
function cypress(c,p,time){
 c.save();c.translate(p.x,p.rootY);c.scale(p.size/96,p.size/96);
 if(p.fallen)drawStump(c,p);
 else if(p.falling){const pose=treeFallPose(p);c.save();c.beginPath();c.rect(-100,TREE_CUT_Y,200,40);c.clip();cypressTrunk(c,p);drawStump(c,p);c.restore();c.save();c.translate(0,pose.cutY);c.rotate(pose.angle);c.translate(0,-pose.cutY);c.globalAlpha*=pose.alpha;c.beginPath();c.rect(-110,-130,220,130+pose.cutY);c.clip();cypressTrunk(c,p);cypressCrown(c,p,time);c.restore();}
 else{cypressTrunk(c,p);cypressCrown(c,p,time);}c.restore();
}
function arch(c){
 poly(c,[[-54,-7],[-51,-40],[-47,-68],[-30,-81],[-29,-45],[-27,-7]],'#a98d69');
 poly(c,[[27,-7],[29,-43],[28,-78],[47,-65],[53,-31],[55,-7]],'#8e7a61');
 poly(c,[[-47,-68],[-43,-85],[-25,-98],[-4,-107],[13,-103],[35,-90],[47,-66],[29,-50],[26,-71],[15,-82],[-2,-87],[-18,-80],[-29,-58]],'#d3b98b');
 poly(c,[[-43,-82],[-25,-98],[-4,-107],[13,-103],[28,-91],[5,-97],[-19,-88],[-36,-71]],'#ecd1a0');
 poly(c,[[-51,-40],[-43,-60],[-36,-70],[-32,-34],[-35,-10],[-50,-9]],'#d6b98a');
 poly(c,[[34,-64],[47,-65],[53,-31],[55,-7],[45,-10]],'#665d52');
 for(let i=0;i<6;i++){const y=-16-i*10;line(c,-49,y,-32,y-2,i%2?'#8b7359':'#f0d4a1',2);line(c,30,y,48,y+3,'#b89b72',1);}
 for(const [x,y]of [[-20,-96],[8,-100],[26,-87],[-46,-67]]){rect(c,x,y,10,3,'#526648');rect(c,x-2,y-1,6,2,'#98a266');}
 for(const side of [-1,1]){poly(c,[[side*26,-5],[side*32,-13],[side*46,-16],[side*61,-5],[side*53,1],[side*25,0]],'#716c60');poly(c,[[side*32,-13],[side*46,-16],[side*54,-8],[side*36,-7]],'#a6a28a');}
}
function rock(c,p){
 const cliff=!!p.beachCliff,h=cliff?74:39,pal=cliff?(hash(p.x,p.rootY)>.5?['#b79570','#dfc39b','#8e775e','#625d53']:['#ad9c82','#e3d0ab','#887b65','#595d54']):['#65706a','#99a28a','#485750','#344740'];
 poly(c,[[-32,-4],[-30,-h*.48],[-20,-h*.94],[-3,-h],[17,-h*.82],[29,-h*.38],[32,-3],[15,2],[-16,1]],pal[0]);
 poly(c,[[-30,-h*.48],[-20,-h*.94],[-3,-h],[17,-h*.82],[7,-h*.57],[-10,-h*.51]],pal[1]);
 poly(c,[[7,-h*.57],[17,-h*.82],[29,-h*.38],[32,-3],[14,0],[6,-h*.3]],pal[2]);
 for(let i=0;i<5;i++){const y=-7-i*(h/7);line(c,-27+i,y,-4,y-3,i%2?pal[2]:pal[1],1);line(c,12,y-3,26,y+1,pal[3],1);}
 for(let n=0;n<7;n++){const x=-23+hash(n,p.x)*42,y=-h*.25+hash(p.y,n)*10;rect(c,x,y,7,2,'#5f7550');rect(c,x+2,y-1,3,1,'#a4ad72');}
 if(cliff){
  // Exposed strata, a cracked vertical face and a worn salt line at the base.
  for(let i=0;i<4;i++){const y=-13-i*12;line(c,-25+i,y,6,y-3,pal[2],2);line(c,-21+i,y-2,5,y-5,pal[1],1);}
  line(c,3,-h+8,-2,-h*.62,pal[3],1);line(c,-2,-h*.62,5,-h*.40,pal[3],1);line(c,5,-h*.4,3,-12,pal[3],1);
  for(let x=-27;x<28;x+=5)rect(c,x,-3-hash(x,p.x)*3,4,2,'#ead9b5');
 }
 if(!cliff){for(let n=0;n<5;n++){const x=-21+n*7,y=-8+(n%2)*3;rect(c,x,y,3,2,'#d5cba4');rect(c,x+1,y,1,1,'#f4e5bb');}const x=-12,y=-15;line(c,x-4,y,x+4,y+1,'#d09266',2);line(c,x,y-4,x,y+4,'#d09266',2);rect(c,x,y,2,1,'#efbc87');}
}
export function drawNativeBeachProp(c,p,time=0){
 if(!p.coastal)return false;
 if(p.kind==='beach_foundation')return true;
 if(p.kind==='palm'){drawPalmTree(c,p,time);return true;}
 if(p.kind==='tree'){cypress(c,p,time);return true;}
 if(p.depleted)return true;
 c.save();c.translate(Math.round(p.x),Math.round(p.rootY??p.y+p.size*.19));
 const scale=p.size/(p.kind==='beach_arch'?128:p.kind==='rock'?96:48);c.scale(scale,scale);
 if(p.kind==='beach_arch')arch(c);
 else if(p.kind==='rock')rock(c,p);
 else if(p.kind==='beach_driftwood'){
  line(c,-19,-4,19,-8,'#4f5341',8);line(c,-19,-6,19,-10,'#9b9170',5);line(c,-16,-7,13,-10,'#d0bf94',2);line(c,-6,-8,-14,-17,'#7d795f',3);line(c,6,-10,12,-19,'#9e9372',3);rect(c,-4,-10,6,1,'#514f41');rect(c,11,-3,5,2,'#e5d1a7');rect(c,-13,-2,4,2,'#e9deba');
 }else if(p.kind==='beach_grass'){
  const wind=Math.sin(time*1.5+p.x)*2;for(let i=0;i<9;i++){const x=-12+i*3,h=9+hash(i,p.x)*15,lean=(i-4)*2+wind;line(c,x,0,x+lean*.3,-h*.55,'#56754b',2);line(c,x+lean*.3,-h*.55,x+lean,-h,i%2?'#b7b878':'#8e9c60',1);if(i%3===0){rect(c,x+lean-1,-h-3,3,5,'#dcc69a');}}
  for(let i=0;i<3;i++){const x=-10+i*9,y=-6-i%2*4;rect(c,x,y,4,3,'#c47e87');rect(c,x+1,y-1,2,2,'#efb8b1');rect(c,x+1,y+1,1,1,'#f2dc9a');}rect(c,-17,1,4,2,'#f0e3c5');rect(c,14,0,5,2,'#ddc9a5');
 }
 c.restore();return true;
}
