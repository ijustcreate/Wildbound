import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {graveyardWorld,graveyardBlocked,CEMETERY_SMALL_GATES,upgradeCemeteryFeatures} from '../src/graveyard-world.mjs';
import {spawnMausoleumEvent} from '../src/mausoleum-crypt.mjs';
import {pickPumpkin,carvePumpkin,hasCarvingKnife} from '../src/pumpkins.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {ITEMS,count} from '../src/items.mjs';
import {pumpkinHeadgear} from '../src/pumpkin-art.mjs';
import {drawGraveyardProp} from '../src/graveyard-art.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const setup=()=>{const g=new Game(()=>.5);g.environment='graveyard';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.enemies=[];p.inventory=Array(24).fill(null);return {g,p};};
test('graveyard forest tree species and seed variants render stable distinct silhouettes',()=>{
 const signature=p=>{const pixels=[],ctx={fillStyle:'#000',save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},fillRect(x,y,w,h){pixels.push([Math.round(x),Math.round(y),Math.round(w),Math.round(h),this.fillStyle]);}};drawGraveyardProp(ctx,p,0);return JSON.stringify(pixels);};
 const base={kind:'grave_forest_tree',graveyard:true,procedural:true,x:500,y:500,rootY:500,size:120,graveyardFootprint:{x:489,y:492,w:22,h:16}};
 const trees=['oak','birch','pine','deadwood','willow'].map((treeType,variant)=>({...base,treeType,variant}));
 assert.ok(trees.every(p=>signature(p)===signature(p)),'same tree seed produces identical art');
 assert.equal(new Set(trees.map(signature)).size,trees.length,'each forest type has its own canopy silhouette');
 assert.deepEqual(new Set(trees.map(p=>JSON.stringify(p.graveyardFootprint))),new Set([JSON.stringify(base.graveyardFootprint)]),'visual variety does not change collision footprints');
});
test('closed mausoleum threshold is solid, only an opened door gains an approach',()=>{
 const {g,p}=setup(),s=g.scenery.find(s=>s.kind==='mausoleum');
 for(const x of [s.x-20,s.x,s.x+20])for(const y of [s.y-9,s.y-5,s.y])assert.equal(graveyardBlocked(g,x,y,8),true);
 Object.assign(p,{x:s.x,y:s.y+28});spawnMausoleumEvent(g);assert.equal(s.doorOpen,true);
 assert.equal(graveyardBlocked(g,s.x,s.y-5,8),false);
 assert.equal(graveyardBlocked(g,s.x-55,s.y-5,8),true);assert.equal(graveyardBlocked(g,s.x,s.y-30,8),true);
});
test('both side gates and the rear gate have real walkable gaps with solid posts',()=>{
 for(const seed of [0,75,991]){
  const g={...graveyardWorld(seed),generatedEnvironment:'graveyard',phase:'play'};
  assert.equal(g.scenery.filter(s=>s.kind==='cemetery_gate').length,4);
  for(const gate of CEMETERY_SMALL_GATES){
   const v=gate.orientation==='vertical';
   for(let n=-60;n<=60;n+=4)assert.equal(graveyardBlocked(g,gate.x+(v?n:0),gate.y+(v?0:n),10),false,gate.id+':'+n);
   const p=g.scenery.find(s=>s.gateId===gate.id);for(const r of p.blockers)assert.equal(graveyardBlocked(g,r.x+5,r.y+5,0),true);
  }
 }
});
test('pumpkin picking is one-time, range checked and preserves crops when backpack is full',()=>{
 const {g,p}=setup(),c=g.scenery.find(s=>s.kind==='pumpkin_crop');assert.equal(g.scenery.filter(s=>s.kind==='pumpkin_crop').length,12);
 assert.equal(pickPumpkin(g,p),false);Object.assign(p,{x:c.x,y:c.y-14});p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
 assert.equal(pickPumpkin(g,p),true);assert.equal(c.picked,false);p.inventory[0]=null;assert.equal(pickPumpkin(g,p),true);
 assert.equal(c.picked,true);assert.equal(count(p,'pumpkin'),1);
 // Remaining plants are beyond reach; repeat cannot duplicate this crop.
 g.scenery=[c];assert.equal(pickPumpkin(g,p),false);assert.equal(count(p,'pumpkin'),1);
});
test('Carve appears only for a backpack pumpkin with an equipped knife in either hand',()=>{
 const {g,p}=setup();p.inventory[0]={type:'pumpkin',qty:2};g.openInventory(p);
 const primary=()=>inventoryToolbar(g,p,['A','B','X','Y']).options[0];assert.notEqual(primary().label,'Carve');
 p.inventory[1]={type:'dagger',qty:1};assert.equal(hasCarvingKnife(p),false);
 for(const hand of ['hand1','hand2']){p.equipment={};p.equipment[hand]='starter_dagger';assert.equal(primary().label,'Carve');assert.equal(primary().action,'carve');}
 p.equipment={hand1:'sword'};assert.notEqual(primary().label,'Carve');assert.equal(carvePumpkin(g,p,0),false);
 p.equipment={hand1:'dagger'};g.inventoryAction(p,'use');assert.equal(count(p,'pumpkin'),1);assert.equal(count(p,'jack_o_lantern'),1);assert.equal(p.equipment.hand1,'dagger');
});
test('carving is atomic at full capacity and single pumpkin can reuse its freed slot',()=>{
 const {g,p}=setup();g.openInventory(p);p.equipment.hand1='dagger';p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));p.inventory[0]={type:'pumpkin',qty:2};
 const before=structuredClone(p.inventory);assert.equal(carvePumpkin(g,p,0),false);assert.deepEqual(p.inventory,before);
 p.inventory[0].qty=1;assert.equal(carvePumpkin(g,p,0),true);assert.equal(count(p,'jack_o_lantern'),1);assert.equal(count(p,'pumpkin'),0);
 const idx=p.inventory.findIndex(i=>i?.type==='jack_o_lantern');p.ui.index=idx;g.inventoryAction(p,'equip');assert.equal(p.equipment.head,'jack_o_lantern');assert.equal(ITEMS.jack_o_lantern.armor,2);
 p.ui.panel='gear';p.ui.index=0;g.inventoryAction(p,'drop');assert.ok(g.loot.some(l=>l.type==='jack_o_lantern'&&l.manualPickup));assert.notEqual(p.equipment.head,'jack_o_lantern');
});
test('owning controller can carve while another player input cannot touch the backpack',()=>{
 const {g,p}=setup();p.device='pad:0';g.openInventory(p);p.inventory[0]={type:'pumpkin',qty:2};p.equipment.hand2='dagger';
 g.update(.016,{'pad:1':{use:true}});assert.equal(count(p,'jack_o_lantern'),0);
 g.update(.016,{'pad:0':{use:true}});assert.equal(count(p,'jack_o_lantern'),1);assert.equal(count(p,'pumpkin'),1);
});
test('fitted pumpkin turns in eight views and its fiery front eyes animate',()=>{
 const record=()=>({pixels:[],fillStyle:'',fillRect(x,y,w,h){this.pixels.push([x,y,w,h,this.fillStyle]);}});
 for(let d=0;d<8;d++){
  const c=record();assert.equal(pumpkinHeadgear(c,'jack_o_lantern',{x:10,y:10},d,.1),true);
  const width=Math.max(...c.pixels.map(v=>v[0]+v[2]))-Math.min(...c.pixels.map(v=>v[0]));
  const height=Math.max(...c.pixels.map(v=>v[1]+v[3]))-Math.min(...c.pixels.map(v=>v[1]));
  assert.ok(width>=11&&width<=15,'head-sized width');assert.ok(height<=13,'no oversized stalk');
  assert.equal(c.pixels.some(v=>v[4]==='#fff1a1'),!(d>=3&&d<=5));
 }
 const a=record(),b=record();pumpkinHeadgear(a,'jack_o_lantern',{x:0,y:0},0,.1);pumpkinHeadgear(b,'jack_o_lantern',{x:0,y:0},0,.4);assert.notDeepEqual(a.pixels,b.pixels);
});
test('old expedition upgrade preserves opened crypts and harvested crops through save/reload',()=>{
 const {g,p}=setup(),c=g.scenery.find(s=>s.kind==='pumpkin_crop');Object.assign(p,{x:c.x,y:c.y-14});pickPumpkin(g,p);
 const s=g.scenery.find(s=>s.kind==='mausoleum');Object.assign(p,{x:s.x,y:s.y+30});spawnMausoleumEvent(g);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.scenery.find(s=>s.id===c.id).picked,true);assert.equal(restored.scenery.find(x=>x.id===s.id).doorOpen,true);
 const old={...graveyardWorld(2),generatedEnvironment:'graveyard',phase:'play'};delete old.graveyard.featuresVersion;
 old.scenery=old.scenery.filter(s=>!s.small&&s.kind!=='pumpkin_crop');old.scenery.find(s=>s.kind==='mausoleum').doorOpen=true;
 assert.equal(upgradeCemeteryFeatures(old),true);assert.equal(old.scenery.filter(s=>s.small).length,3);assert.equal(old.scenery.filter(s=>s.kind==='pumpkin_crop').length,12);assert.ok(old.scenery.find(s=>s.kind==='mausoleum').doorOpen);
 assert.equal(upgradeCemeteryFeatures(old),false);
});
