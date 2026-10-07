import test from 'node:test';
import assert from 'node:assert/strict';
import {graveyardWorld,harvestGravestone} from '../src/graveyard-world.mjs';
import {drawGraveyardGround,drawGraveyardProp,drawGraveEmergence,drawGraveyardCritter} from '../src/graveyard-art.mjs';
import {spawnSurfaceEcology,drawGraveyardEcology} from '../src/graveyard-ecology.mjs';

// A strict canvas-command recorder verifies geometry/clipping without browser globals.
function canvas() {
  return {calls:[],depth:0,fillStyle:'',globalAlpha:1,
    save(){this.depth++;this.calls.push(['save']);},restore(){assert.ok(this.depth>0);this.depth--;this.calls.push(['restore']);},
    translate(...args){this.calls.push(['translate',...args]);},scale(...args){this.calls.push(['scale',...args]);},
    rotate(angle){assert.ok(Number.isFinite(angle));this.calls.push(['rotate',angle]);},
    beginPath(){this.calls.push(['begin']);},rect(...args){this.calls.push(['rect',...args]);},clip(){this.calls.push(['clip']);},
    fillRect(...args){assert.ok(args.every(Number.isFinite));assert.ok(args.every(Number.isInteger),'native integer pixels');this.calls.push(['pixel',...args,this.fillStyle]);}};
}
const setup=()=>({...graveyardWorld(75),seed:75,generatedEnvironment:'graveyard',phase:'play',bloom:3,time:0,random:()=>0,enemies:[]});

test('ground honors exclusive tile32 viewport bounds, has varied pixels, and restores context',()=>{
  const g=setup(),c=canvas();assert.equal(drawGraveyardGround(c,g,{sx:22,sy:24,ex:24,ey:26}),true);
  assert.ok(c.calls.some(v=>v[0]==='rect'&&v[1]===704&&v[2]===768&&v[3]===64&&v[4]===64));
  const pixels=c.calls.filter(v=>v[0]==='pixel');assert.ok(pixels.length<100);
  assert.ok(pixels.every(v=>v[1]>=704&&v[1]<768&&v[2]>=768&&v[2]<832));
  assert.ok(new Set(pixels.map(v=>v.at(-1))).size>=4);assert.equal(c.depth,0);
  const c2=canvas();drawGraveyardGround(c2,g,{sx:22,sy:24,ex:24,ey:26});assert.deepEqual(c.calls,c2.calls);
  assert.equal(drawGraveyardGround(c,g,{sx:NaN,sy:0,ex:2,ey:2}),false);
});

test('grave plots and every new prop render with native pixels, including weathering and rubble',()=>{
  const g=setup();
  for(const kind of ['gravestone','cemetery_fence','cemetery_gate','mausoleum','leafless_tree','grave_forest_tree','grave_candles']) {
    const c=canvas(),p=g.scenery.find(p=>p.kind===kind);assert.ok(p,kind);
    assert.equal(drawGraveyardProp(c,p,1,g),true);assert.ok(c.calls.filter(v=>v[0]==='pixel').length>=10,kind);assert.equal(c.depth,0);
  }
  assert.equal(drawGraveyardProp(canvas(),{kind:'rock'},0,g),false);
  const p=g.scenery.find(p=>p.kind==='gravestone'),c=canvas();
  harvestGravestone(g,{x:p.x,y:p.rootY+24,faceX:0,faceY:-1,hp:100},48,78);
  assert.equal(drawGraveyardProp(c,p,2,g),true);assert.equal(c.calls.length,0);
  drawGraveyardGround(c,g,{sx:12,sy:13,ex:16,ey:17});assert.ok(c.calls.some(v=>v.at(-1)==='#2b2928'));
  assert.equal(c.depth,0);
});

test('emergence clips body below the dirt plane, passes a shifted copy and returns handled',()=>{
  const g=setup(),p=g.scenery.find(p=>p.kind==='gravestone');
  harvestGravestone(g,{x:p.x,y:p.rootY+24,faceX:0,faceY:-1,hp:100},48,78);
  const e=g.enemies[0],original=structuredClone(e),c=canvas();let actor=null;
  e.graveEmergence.elapsed=e.graveEmergence.duration*.5;
  const before=structuredClone(e);
  assert.equal(drawGraveEmergence(c,e,1,64,(ctx,a,time,size)=>{
    actor=a;assert.equal(ctx,c);assert.equal(time,1);assert.equal(size,64);assert.ok(c.calls.some(v=>v[0]==='clip'));
    ctx.fillRect(a.x,a.y,4,4);
  }),true);
  assert.equal(actor.y,e.graveEmergence.origin.y+32);assert.notEqual(actor,e);assert.deepEqual(e,before);
  const clip=c.calls.find(v=>v[0]==='rect');assert.equal(clip[2]+clip[4],e.graveEmergence.origin.groundY);
  assert.ok(c.calls.filter(v=>v[0]==='pixel').length<=30);assert.equal(c.depth,0);
  assert.equal(drawGraveEmergence(canvas(),{},0,64),false);
  const c2=canvas();assert.equal(drawGraveEmergence(c2,original,0,64,()=>assert.fail('body still entirely buried')),true);
  assert.equal(c2.depth,0);
});

test('fallback skeleton/zombie emergence has crawling arms and bounded dirt pixels',()=>{
  for(const kind of ['skeleton','zombie']) {
    const c=canvas(),e={kind,x:400,y:500,graveEmergence:{elapsed:1,duration:2.4,origin:{x:400,y:500,groundY:514,plotId:'grave'}}};
    assert.equal(drawGraveEmergence(c,e,2,64),true);assert.equal(c.depth,0);
    assert.ok(c.calls.some(v=>v[0]==='clip'));assert.ok(c.calls.filter(v=>v[0]==='pixel').length<140);
  }
});

test('surface ecology draws moths in air and beetles/cat on ground without enemies',()=>{
  const g=setup(),animals=spawnSurfaceEcology(g),air=canvas(),ground=canvas();
  assert.equal(drawGraveyardEcology(air,g,'air'),true);assert.equal(drawGraveyardEcology(ground,g,'ground'),true);
  assert.equal(air.calls.filter(v=>v[0]==='translate').length,8);
  assert.equal(ground.calls.filter(v=>v[0]==='translate').length,7);
  for(const a of animals){const c=canvas();assert.equal(drawGraveyardCritter(c,a,3),true);assert.equal(c.depth,0);}
  assert.equal(g.enemies.length,0);assert.equal(drawGraveyardEcology(canvas(),g,'wrong'),false);
  g.generatedEnvironment='forest';assert.equal(drawGraveyardEcology(canvas(),g,'air'),false);
});

test('leafless tree felling rotates only clipped upper trunk, then leaves a grounded stump',()=>{
  const g=setup(),p=g.scenery.find(p=>p.kind==='leafless_tree');
  for(const falling of [.2,.7,1.25]) {
    const c=canvas();drawGraveyardProp(c,{...p,falling,fallDirection:-1,depleted:falling>=1.2},2,g);
    const rotate=c.calls.findIndex(v=>v[0]==='rotate');assert.ok(rotate>0);
    assert.ok(c.calls[rotate][1]<0);assert.ok(c.calls.slice(0,rotate).some(v=>v.at(-1)==='#c7bd95'),'cut/rings stay on root before rotation');
    assert.ok(c.calls.slice(rotate).some(v=>v[0]==='clip'),'upper piece is clipped above the cut');
    const clip=c.calls.find(v=>v[0]==='rect');assert.equal(clip[2]+clip[4],-12);
    assert.equal(c.depth,0);
  }
  for(const flags of [{fallen:true,depleted:true},{depleted:true}]) {
    const c=canvas();assert.equal(drawGraveyardProp(c,{...p,...flags},3,g),true);
    assert.ok(c.calls.some(v=>v[0]==='translate'&&v[1]===p.x&&v[2]===p.rootY));
    assert.ok(c.calls.some(v=>v.at(-1)==='#c7bd95'));
    assert.ok(c.calls.filter(v=>v[0]==='pixel').every(v=>v[2]>=-14),'no standing branches after depletion');
    assert.equal(c.calls.some(v=>v[0]==='rotate'),false);assert.equal(c.depth,0);
  }
});
