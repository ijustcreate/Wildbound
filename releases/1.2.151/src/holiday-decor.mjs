export const CHRISTMAS_SURPRISES=Object.freeze(['toy_train','hot_chocolate','santa_hat','christmas_bell','boomerang','ice_wand','healing_wand']);
const overlaps=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;
// Additions only, on the current house clone. Never replace a saved floorplan or move authored furniture.
export function ensureHouseChristmas(h){
 if(!h||h.temple||!Array.isArray(h.floors)||!Array.isArray(h.furniture))return h;
 const clear=r=>h.floors.some(f=>r.x>=f.x+4&&r.y>=f.y+4&&r.x+r.w<=f.x+f.w-4&&r.y+r.h<=f.y+f.h-4)&&
  ![...(h.walls||[]),...(h.doors||[]),...(h.pools||[]),...h.furniture.filter(f=>!['rug','ceiling_light','wall_clock'].includes(f.kind))].some(f=>!f.destroyed&&overlaps(r,f,5));
 let tree=h.furniture.find(f=>f.kind==='christmas_tree');
 if(!tree){for(const [x,y]of [[650,770],[620,790],[650,850],[584,884]]){
  const candidate={kind:'christmas_tree',holidayDecor:'tree',x,y,w:44,h:28};
  const gift={x:x+24,y:y+43,w:20,h:16};
  if(clear(candidate)&&clear(gift)){tree=candidate;h.furniture.push(tree);break;}
 }}
 if(tree&&!tree.destroyed&&!h.furniture.some(f=>f.holidayDecor==='tree-gift')){
  const gift={kind:'wrapped_gift',holidayDecor:'tree-gift',x:tree.x+24,y:tree.y+43,w:20,h:16,opened:false};
  if(clear(gift))h.furniture.push(gift);
 }
 return h;
}
export function unwrapChristmasGift(g,p,gift){
 if(!gift||gift.kind!=='wrapped_gift'||gift.opened||gift.destroyed||p.hp<=0||p.room||p.ui||p.stun>0||p.frozen>0||p.sleeping>0||p.consumeInput||!g.house?.furniture?.includes(gift)||typeof g.dropLoot!=='function')return false;
 const x=gift.x+gift.w/2,y=gift.y+gift.h;
 if(Math.hypot(p.x-Math.max(gift.x,Math.min(p.x,gift.x+gift.w)),p.y-Math.max(gift.y,Math.min(p.y,gift.y+gift.h)))>=44)return false;
 const roll=Math.max(0,Math.min(.999999,Number(g.random?.())||0)),type=CHRISTMAS_SURPRISES[Math.floor(roll*CHRISTMAS_SURPRISES.length)];
 gift.opened=true;gift.surpriseType=type;
 g.dropLoot(x,y+14,type,1,'Christmas surprise',true);
 g.effects??=[];g.effects.push({x,y:y-10,life:.9,color:'#efcf7d',text:'A Christmas surprise!'});
 g.onSound?.('loot',p);g.message?.('A surprise is unwrapped! Collect it with Interact.');g.persist?.();return true;
}
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
// Radial boughs overlap in depth: one dark perimeter, broad left light and a
// continuous right shadow. Keep the 44x28 support footprint and gift anchor.
export function drawChristmasTree(c,f){
 c.save();c.translate(Math.round(f.x+f.w/2),Math.round(f.y+f.h));
 polygon(c,[[-24,0],[-18,-5],[15,-6],[26,-1],[20,5],[-15,7]],'#14282055');
 // Foreshortened red planter, visible trunk and inset soil.
 polygon(c,[[-12,-8],[12,-8],[10,3],[6,6],[-7,6],[-10,3]],'#482e31');
 polygon(c,[[-10,-7],[10,-7],[8,3],[4,4],[-7,3]],'#a44840');
 polygon(c,[[-9,-6],[-4,-6],[-4,3],[-7,2]],'#cd6950');
 polygon(c,[[5,-6],[10,-7],[8,3],[4,4]],'#713b35');
 polygon(c,[[-13,-9],[-8,-12],[8,-12],[13,-9],[9,-6],[-9,-6]],'#cfac65');
 polygon(c,[[-9,-9],[-5,-11],[6,-11],[9,-9],[5,-8],[-5,-8]],'#44392d');
 r(c,-4,-23,8,14,'#543d2b');r(c,-3,-22,3,13,'#a17b45');
 const outline=[[-26,-20],[-22,-26],[-18,-34],[-21,-35],[-17,-41],[-13,-51],[-16,-52],[-12,-59],[-8,-68],[-10,-69],[-5,-77],[0,-85],[5,-78],[9,-70],[7,-68],[13,-58],[15,-52],[12,-50],[19,-38],[21,-34],[18,-32],[24,-24],[26,-19],[22,-15],[15,-13],[9,-14],[3,-11],[-4,-12],[-10,-14],[-17,-14],[-23,-16]];
 polygon(c,outline,'#19382e');
 // Lowest bough has a rounded front edge, rather than a flat triangle base.
 polygon(c,[[-23,-21],[-15,-37],[-5,-45],[7,-43],[17,-32],[23,-21],[19,-18],[12,-16],[7,-17],[1,-14],[-5,-15],[-11,-17],[-17,-17]],'#34754e');
 polygon(c,[[4,-43],[17,-32],[23,-21],[19,-18],[12,-16],[7,-17],[1,-14],[4,-22],[0,-29]],'#24533e');
 polygon(c,[[-21,-23],[-15,-35],[-7,-39],[-10,-31],[-7,-26],[-12,-23],[-13,-19],[-18,-20]],'#65905b');
 polygon(c,[[-17,-17],[-10,-18],[-4,-16],[2,-16],[8,-19],[13,-18],[21,-21],[19,-17],[12,-15],[7,-16],[1,-13],[-5,-14],[-11,-16]],'#204b39');
 // Middle and crown overlap the lower tier; shadows turn under each bough.
 polygon(c,[[-19,-36],[-12,-51],[-5,-61],[4,-62],[12,-50],[18,-36],[12,-32],[7,-33],[0,-29],[-7,-31],[-13,-32]],'#34754e');
 polygon(c,[[3,-61],[12,-50],[18,-36],[12,-32],[7,-33],[0,-29],[3,-39],[-1,-44]],'#24533e');
 polygon(c,[[-16,-38],[-11,-49],[-5,-55],[-7,-46],[-5,-42],[-10,-38],[-11,-35]],'#65905b');
 polygon(c,[[-14,-34],[-7,-33],[0,-31],[7,-35],[12,-34],[17,-37],[12,-31],[7,-32],[0,-28],[-7,-30]],'#204b39');
 polygon(c,[[-13,-53],[-7,-66],[-2,-73],[3,-72],[8,-64],[13,-53],[7,-50],[2,-47],[-4,-48],[-9,-50]],'#3e7c50');
 polygon(c,[[1,-73],[8,-64],[13,-53],[7,-50],[2,-47],[3,-55],[-1,-61]],'#28573f');
 polygon(c,[[-10,-55],[-6,-64],[-2,-69],[-4,-60],[-3,-56],[-7,-53]],'#73975f');
 polygon(c,[[-9,-51],[-4,-50],[2,-49],[7,-52],[11,-54],[7,-49],[2,-46],[-4,-47]],'#204b39');
 polygon(c,[[-8,-69],[-3,-77],[0,-82],[4,-76],[7,-70],[3,-67],[-2,-66],[-5,-68]],'#3e7c50');
 polygon(c,[[1,-80],[4,-76],[7,-70],[3,-67],[-1,-66],[1,-72]],'#28573f');
 polygon(c,[[-5,-72],[-2,-77],[-1,-73],[-3,-69],[-5,-70]],'#73975f');
 // Garlands describe bowed arcs around the crown; ends recede into shadow.
 for(const [x,y,w,col]of [[-9,-58,4,'#a88b4e'],[-6,-56,4,'#d4b86b'],[-2,-54,4,'#e5cb82'],[2,-54,4,'#d4b86b'],[6,-56,3,'#a88b4e'],[-15,-40,4,'#a88b4e'],[-12,-38,5,'#d4b86b'],[-8,-36,5,'#e5cb82'],[-4,-35,5,'#e5cb82'],[0,-35,5,'#d4b86b'],[4,-36,5,'#b69958'],[9,-38,4,'#8d7847'],[-19,-24,4,'#a88b4e'],[-15,-22,5,'#d4b86b'],[-11,-20,6,'#e5cb82'],[-5,-19,6,'#e5cb82'],[1,-19,6,'#d4b86b'],[7,-20,5,'#b69958'],[12,-22,5,'#8d7847']])r(c,x,y,w,2,col);
 for(const [x,y,col,shadow]of [[0,-73,'#dfb863','#a78043'],[-6,-61,'#cd5c4d','#843c38'],[5,-44,'#dfb863','#a78043'],[-10,-44,'#cd5c4d','#843c38'],[-14,-28,'#66a69a','#3c7168'],[0,-25,'#cd5c4d','#843c38'],[15,-29,'#cd5c4d','#843c38']]){
  r(c,x-1,y-4,2,2,'#c2a562');polygon(c,[[x-2,y-2],[x+1,y-3],[x+3,y-1],[x+3,y+2],[x,y+4],[x-3,y+2],[x-3,y-1]],'#203e32');r(c,x-2,y-1,4,4,col);r(c,x+1,y,2,3,shadow);r(c,x-1,y-1,2,1,'#f4d998');
 }
 polygon(c,[[0,-92],[2,-87],[7,-87],[3,-84],[4,-79],[0,-82],[-4,-79],[-3,-84],[-7,-87],[-2,-87]],'#b48a45');
 polygon(c,[[0,-92],[1,-86],[6,-87],[2,-84],[0,-83],[-3,-80],[-2,-85],[-6,-87],[-1,-87]],'#efcc7e');r(c,-1,-88,2,4,'#fff0b5');c.restore();
}
drawChristmasTree.artRevision=2;
export function drawChristmasGift(c,f){
 c.save();c.translate(Math.round(f.x),Math.round(f.y));const w=f.w,h=f.h;
 if(f.opened){polygon(c,[[-4,h-2],[w*.25,h-7],[w*.5,h-3],[w+5,h-7],[w+2,h+2]],'#a83d42');r(c,w*.35,h-5,3,7,'#e2c076');r(c,0,h-1,w,2,'#592e36');}
 else{r(c,0,-3,w,h+3,'#4b2b31');r(c,1,-4,w-2,h+2,'#ad3d43');r(c,2,-4,5,h+1,'#d16655');r(c,0,-5,w,3,'#d76556');r(c,w*.45,-4,3,h+3,'#e7c575');r(c,0,h*.3,w,3,'#e7c575');polygon(c,[[w*.5,-5],[w*.2,-10],[w*.15,-5],[w*.5,-3],[w*.85,-6],[w*.8,-11]],'#e7c575');r(c,w*.45,-7,4,4,'#ffdf91');}
 c.restore();
}
// Mounted in the locomotive's own y/z front plane; hidden when that face turns away.
export function drawTrainWreath(p,car){
 if(Math.sin(car.a)<=.05)return;
 const x=car.length*.4+16.5,z=32,R=12,inner=6.5,point=(a,r)=>[x,Math.cos(a)*r,z+Math.sin(a)*r];
 for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;p.poly([point(a,R+(i%2)),point(b,R+((i+1)%2)),point(b,inner),point(a,inner)],i<8?'#447951':'#28583e');}
 const outside=Array.from({length:17},(_,i)=>point(i*Math.PI/8,R+(i%2)));p.line(outside,'#1d3d32',1.3);
 for(const [y,dz]of [[-8,4],[7,6],[9,-4],[-7,-5]])p.poly([[x+.3,y-1,z+dz-1],[x+.3,y+2,z+dz-1],[x+.3,y+2,z+dz+2],[x+.3,y-1,z+dz+2]],'#cd5347');
 p.poly([[x+.5,-1,z-9],[x+.5,-8,z-6],[x+.5,-7,z-13],[x+.5,0,z-11],[x+.5,7,z-13],[x+.5,8,z-6]],'#c34b43');
 p.poly([[x+.6,-2,z-9],[x+.6,2,z-9],[x+.6,2,z-12],[x+.6,-2,z-12]],'#ebc67a');
}
