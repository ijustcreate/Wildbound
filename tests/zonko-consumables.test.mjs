import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {give} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {FIREWORK_RISE_SECONDS,FLAMING_FOOTPRINTS,ZONKO_FIREWORK,zonkoGroundMarks,zonkoGroundScorchable} from '../src/zonko-consumables.mjs';

function setup(){
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard','Rowan'),q=g.addPlayer('pad:0','Rook'),cues=[];
 g.persist=()=>{};g.onSound=name=>{if(name.startsWith('zonko'))cues.push(name);};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 Object.assign(p,{x:8450,y:7560});Object.assign(q,{x:8380,y:7540});
 return {g,p,q,cues};
}
function use(g,p,type){
 g.openInventory(p);p.ui.panel='pack';p.ui.index=p.inventory.findIndex(i=>i?.type===type);
 assert.ok(p.ui.index>=0);
 const button=inventoryToolbar(g,p,[]).options.find(o=>o.id==='use');
 assert.equal(button.action,'use');assert.equal(button.reason,'');
 g.inventoryAction(p,'use');
}
const quantity=(p,type)=>p.inventory.find(i=>i?.type===type)?.qty||0;
function step(g,n,inputs={}){for(let i=0;i<n;i++)g.update(.05,inputs);}

test('A Whizz-Bang inventory Use launches before bursting once and clears its one-shot effect',()=>{
 const {g,p,q,cues}=setup();
 assert.ok(give(p.inventory,ZONKO_FIREWORK,2));
 use(g,p,ZONKO_FIREWORK);
 const rocket=g.effects.find(fx=>fx.zonkoFirework);
 assert.equal(rocket.owner,p.id);assert.equal(quantity(p,ZONKO_FIREWORK),1);
 assert.deepEqual(cues,['zonkoFireworkLaunch']);assert.equal(p.ui,null);
 use(g,p,ZONKO_FIREWORK);
 assert.match(p.ui.notice,/finish first/);assert.equal(quantity(p,ZONKO_FIREWORK),1);p.ui=null;
 step(g,Math.floor(FIREWORK_RISE_SECONDS/.05)-1);
 assert.equal(rocket.burst,undefined);assert.deepEqual(cues,['zonkoFireworkLaunch']);
 step(g,5);
 assert.equal(rocket.burst,true);assert.deepEqual(cues,['zonkoFireworkLaunch','zonkoFireworkBurst']);
 assert.equal(q.hp,q.maxHp);
 step(g,57);
 assert.ok(!g.effects.some(fx=>fx.zonkoFirework));
 assert.deepEqual(cues,['zonkoFireworkLaunch','zonkoFireworkBurst']);
});

test('Flaming Footprints lasts 60 simulation seconds per hero and leaves inert fading marks on grass',()=>{
 const {g,p,q}=setup();
 assert.ok(give(p.inventory,FLAMING_FOOTPRINTS));
 use(g,p,FLAMING_FOOTPRINTS);
 assert.match(p.ui.notice,/60 seconds/);assert.equal(p.field.flamingFootprints,60);
 assert.equal(quantity(p,FLAMING_FOOTPRINTS),0);p.ui=null;
 assert.equal(zonkoGroundScorchable(g,p),true);
 assert.equal(zonkoGroundScorchable(g,{x:8050,y:7120}),false,'Homestead floor');
 step(g,21,{keyboard:{x:1},'pad:0':{y:1}});
 const marks=zonkoGroundMarks(g);
 assert.ok(marks.flames.length>=3&&marks.scorch.length>=3);
 assert.ok([...marks.flames,...marks.scorch].every(mark=>mark.owner===p.id));
 assert.ok(marks.scorch.every(mark=>zonkoGroundScorchable(g,mark)));
 assert.equal(q.field.flamingFootprints,undefined);
 assert.ok(!g.firePatches?.length&&!g.grassBurnDirty&&!g.scenery.some(o=>o.burning));
 step(g,30);
 assert.equal(zonkoGroundMarks(g).flames.length,0);
 assert.ok(zonkoGroundMarks(g).scorch.length>0);
 const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),owner=saved.players[0];
 assert.equal(owner.field.flamingFootprints,p.field.flamingFootprints);
 const remaining=owner.field.flamingFootprints;
 saved.tickHeroVitals(owner,remaining-.1);assert.ok(owner.field.flamingFootprints>.09);
 saved.tickHeroVitals(owner,.1);assert.equal(owner.field.flamingFootprints,undefined);
 g.time+=33;assert.equal(zonkoGroundMarks(g).scorch.length,0);
});
