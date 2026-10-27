import {take} from './items.mjs';
export const SURFACE_PROPS=['recipe_book','cutting_board','fruit_bowl','kettle','mug','plate','candle','vase','bread_board'];
export const SURFACE_FURNITURE=['table','desk','counter','dresser','bookcase','stove'];
const contains=(r,x,y,pad=0)=>x>=r.x-pad&&x<r.x+r.w+pad&&y>=r.y-pad&&y<r.y+r.h+pad;
export function vegetationBlocked(g,x,y,pad=5){return (g.house?.furniture||[]).some(f=>!f.destroyed&&f.kind!=='rug'&&contains(f,x,y,pad))||(g.house?.floors||[]).some(f=>contains(f,x,y));}
export function houseFloorZones(h){
 if(h.floorZones)return h.floorZones;
 if(h.name!=='The Garden Villa'||h.floorplanVersion!==3)return [];
 return [{x:496,y:496,w:240,h:176,material:'checker'},{x:864,y:496,w:240,h:176,material:'carpet'},{x:864,y:688,w:240,h:256,material:'carpet'}];
}
export function furnishSurface(f){
 if(f.surfaceItems)return f.surfaceItems;
 if(f.kind==='stove')return [{kind:'kettle',u:.55,v:.42}];
 if(f.kind==='counter')return [{kind:'cutting_board',u:.5,v:.55},{kind:'fruit_bowl',u:.78,v:.5}];
 if(f.kind==='table')return f.w>=72?[{kind:'recipe_book',u:.3,v:.48},{kind:'fruit_bowl',u:.76,v:.48}]:[{kind:'fruit_bowl',u:.28,v:.45},{kind:'mug',u:.73,v:.55}];
 if(f.kind==='desk')return [{kind:'recipe_book',u:.4,v:.5},{kind:'candle',u:.8,v:.4}];
 return [];
}
export function surfaceAction(g,p){
 const targets=[];
 for(const f of g.house?.furniture||[])if(!f.destroyed)for(const prop of visibleSurfaceItems(g,f)){
  const x=f.x+f.w*(prop.u??.5),y=f.y+f.h*(prop.v??.5),d=Math.hypot(p.x-x,p.y-y);
  if(d<65)targets.push({f,prop,x,y,d});
 }
 return targets.sort((a,b)=>a.d-b.d)[0]||null;
}
export function visibleSurfaceItems(g,f){
 return furnishSurface(f).filter(prop=>f.kind!=='counter'||!(g.house?.furniture||[]).some(appliance=>!appliance.destroyed&&['sink','stove'].includes(appliance.kind)&&contains(appliance,f.x+f.w*(prop.u??.5),f.y+f.h*(prop.v??.5),4)));
}
export function interactHouseSurface(g,p){
 const target=surfaceAction(g,p);if(!target)return false;const {f,prop}=target;
 if(prop.kind==='recipe_book'){
  const complete=(g.house.furniture||[]).some(f=>f.kitchenQuestComplete);
  g.message(complete?'Camp recipe completed. You can still cook broth at the kettle.':'Camp recipe: bring 1 raw meat and 1 sweet fruit to a kettle. Cook broth to restore health and earn 15 gold once.');
 }else if(prop.kind==='kettle'){
  const has=type=>(p.inventory||[]).some(i=>i?.type===type&&i.qty>0);
  if(!has('meat')||!has('fruit')){g.message('Cook broth: needs 1 raw meat and 1 sweet fruit.');return true;}
  const needsHealing=p.hp<(p.maxHp||100),rewarded=(g.house.furniture||[]).some(q=>q.kitchenQuestComplete);
  if(rewarded&&!needsHealing){g.message('You are already healthy. Save the ingredients for later.');return true;}
  take(p.inventory,'meat');take(p.inventory,'fruit');p.hp=Math.min(p.maxHp||100,p.hp+55);
  if(!rewarded){f.kitchenQuestComplete=true;p.coins=(p.coins||0)+15;}
  g.message(rewarded?'Warm broth restores 55 health.':'Camp recipe complete! +15 gold. Warm broth restores 55 health.');g.onSound?.('heal',p);g.persist?.();
 }else if(prop.kind==='cutting_board'||prop.kind==='fruit_bowl'||prop.kind==='bread_board')g.message('Kitchen supplies. Read the recipe book and bring meat and fruit to the kettle.');
 else if(prop.kind==='candle'){f.surfaceItems=structuredClone(furnishSurface(f));const stored=f.surfaceItems.find(q=>q.kind===prop.kind&&q.u===prop.u&&q.v===prop.v);stored.lit=!prop.lit;g.message(stored.lit?'Table candle lit.':'Table candle extinguished.');g.persist?.();}
 else g.message(({mug:'A warm camp mug.',plate:'A place set for a shared meal.',vase:'Fresh flowers from the garden.'})[prop.kind]||'A well-used household item.');
 return true;
}
export function drawSurfaceProp(c,item,x,y){
 const r=(a,b,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
 const kind=item.kind;c.save();r(-7,2,16,3,'#182b2838');
 if(kind==='recipe_book'){r(-8,-6,16,12,'#403b2d');r(-7,-7,14,11,'#e6d5a1');r(-1,-7,2,11,'#988055');for(const a of [-5,3])for(let b=-4;b<3;b+=3)r(a,b,3,1,'#927c58');}
 if(kind==='cutting_board'||kind==='bread_board'){r(-10,-5,20,10,'#765236');r(-9,-6,18,9,'#cda574');r(8,-4,5,4,'#a27d4f');r(-5,-4,9,1,'#e4bc87');if(kind==='bread_board'){r(-4,-6,9,6,'#a96e36');r(-3,-7,7,5,'#e8bd75');r(0,-6,1,3,'#f4dca7');}else{r(-4,-2,9,2,'#a9b8ab');r(5,-1,4,2,'#4d4236');}}
 if(kind==='fruit_bowl'){r(-8,-2,16,7,'#4b5c57');r(-7,-3,14,6,'#a2b9ad');r(-5,-6,5,5,'#c56a40');r(0,-7,5,5,'#d9b94d');r(3,-4,4,4,'#859547');r(-5,2,10,2,'#6e8a80');}
 if(kind==='kettle'){r(-7,-7,14,12,'#273e42');r(-6,-8,11,10,'#8aa4a0');r(-4,-6,3,5,'#d9e0c8');r(-3,-10,7,2,'#273e42');r(6,-6,5,4,'#778e88');r(-10,-6,3,8,'#314a47');r(-8,-8,3,2,'#314a47');}
 if(kind==='mug'){r(-4,-6,8,9,'#587f77');r(-3,-7,6,2,'#e1dfbc');r(-2,-6,4,2,'#594a37');r(4,-5,3,5,'#b5c8b1');}
 if(kind==='plate'){r(-8,-3,16,8,'#879c90');r(-7,-4,14,7,'#e9e0bd');r(-4,-2,8,3,'#bdc7ae');}
 if(kind==='candle'){r(-5,1,10,3,'#8f7747');r(-2,-9,4,11,'#ead7a1');r(-1,-11,2,3,'#493e30');if(item.lit){r(-2,-15,4,5,'#e9a348');r(-1,-15,2,3,'#fff1a1');}}
 if(kind==='vase'){r(-4,-2,8,8,'#548b89');r(-3,-4,6,4,'#b5d2bb');r(-1,-13,2,9,'#597c45');r(-6,-11,6,3,'#8ca05e');r(1,-14,5,3,'#d8b978');}
 c.restore();
}
