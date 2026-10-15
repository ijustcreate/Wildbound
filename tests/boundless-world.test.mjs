import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {saveSession,restoreSession} from '../src/session.mjs';
import {BOUNDLESS_MAP_RULES,REGION_CACHE_LIMIT,boundlessRegionPlan,boundlessGeneratedTile,regionPortals,boundlessCacheSize,islandCoastDistance} from '../src/boundless-generation.mjs';
import {initializeBoundlessWorld,boundlessBiomeAt,boundlessTerrainAt,createBoundlessChunk,updateBoundlessWorld} from '../src/boundless-world.mjs';
import {graveyardBlocked,harvestGravestone} from '../src/graveyard-world.mjs';
import {drawGraveyardGround} from '../src/graveyard-art.mjs';
const game=env=>{const g=new Game(()=>.5);g.environment=env;g.mapMode='boundless';g.addPlayer('keyboard','Explorer');g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};return g;};
const tick=(g,n=10)=>{for(let i=0;i<n;i++)updateBoundlessWorld(g,.01);};
const dry=t=>!['water','shallow','quicksand'].includes(t);
test('every destination stays itself across distant/negative regions and discovery orders',()=>{
 for(const env of Object.keys(BOUNDLESS_MAP_RULES)){const g={generatedEnvironment:env,seed:821,mapMode:'boundless'},copy={...g};
  for(const [cx,cy]of [[-3,-2],[4,0],[0,4],[90,-47]]){assert.equal(boundlessBiomeAt(g,cx*1600,cy*1600),env);assert.deepEqual(boundlessRegionPlan(g,cx,cy).terrain,boundlessRegionPlan(copy,cx,cy).terrain);}
 }
});
test('shared entrances are identical and have walkable tiles on both sides, including origin seams',()=>{
 for(const env of ['forest','desert','ice','temple','graveyard','house']){const g=game(env);
  for(const [cx,cy]of [[0,0],[-1,-1],[2,1]]){
   const a=regionPortals(g,cx,cy),east=regionPortals(g,cx+1,cy),south=regionPortals(g,cx,cy+1);
   assert.deepEqual(a.east,east.west);assert.deepEqual(a.south,south.north);
   const tx=Math.floor(a.east.x/32),ty=Math.floor(a.east.y/32);assert.ok(dry(boundlessTerrainAt(g,tx-1,ty)),env);assert.ok(dry(boundlessTerrainAt(g,tx,ty)),env);
   const sx=Math.floor(a.south.x/32),sy=Math.floor(a.south.y/32);assert.ok(dry(boundlessTerrainAt(g,sx,sy-1)),env);assert.ok(dry(boundlessTerrainAt(g,sx,sy)),env);
  }
 }
});
test('beach is a large island with ocean all around, continuous shallows and offshore islands',()=>{
 const g=game('beach');for(const [x,y]of [[5000,1800],[-4200,1800],[800,-1800],[800,5400]])assert.equal(boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32)),'water');
 for(let a=0;a<Math.PI*2;a+=.15){const x=800+Math.cos(a)*330,y=800+Math.sin(a)*330;assert.ok(dry(boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32))));}
 let islands=0;for(let y=-20000;y<20000;y+=256)for(let x=-20000;x<20000;x+=256)if(Math.hypot(x-800,y-1800)>6000&&islandCoastDistance(x,y,g.seed)>100)islands++;assert.ok(islands>20);
 const types=new Set();for(let y=-35;y<150;y++)for(let x=-100;x<130;x++)types.add(boundlessTerrainAt(g,x,y));for(const kind of ['sand','grass','shallow','water'])assert.ok(types.has(kind));
 const ocean=createBoundlessChunk(g,3,-2);assert.equal(ocean.props.length,0,'no trees on open ocean');
});
test('destination fields cluster hazards and native scenery stays on land off routes',()=>{
 for(const env of ['desert','ice','temple','forest','beach']){const g=game(env),chunk=createBoundlessChunk(g,1,1),p=chunk.plan;
  for(const prop of chunk.props){const x=prop.x,y=prop.rootY??prop.y+prop.size*(['tree','snow_tree'].includes(prop.kind)?.35:.19);assert.ok(!['water','shallow','quicksand','ice'].includes(boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32))),env+'/'+prop.kind);}
  if(env==='temple')assert.ok(p.terrain.includes('temple_stone'));
  if(env==='ice')assert.ok(chunk.props.every(s=>['frost_shrub','snow_tree','ice_rock','ice_spire'].includes(s.kind)));
 }
});
test('cemetery paths reach open gates and burial ground features work outside the original board',()=>{
 const g=game('graveyard'),p=g.players[0];p.x=2400;p.y=800;tick(g);const stone=g.scenery.find(s=>s.boundlessRegion==='1,0'&&s.kind==='gravestone');assert.ok(stone);assert.ok(g.graveyard.plots.some(p=>p.id===stone.plotId));assert.ok(graveyardBlocked(g,stone.x,stone.rootY,8));
 const plan=boundlessRegionPlan(g,1,0);for(const route of plan.routes)for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/16);for(let j=0;j<=n;j++)assert.equal(graveyardBlocked(g,a.x+(b.x-a.x)*j/n,a.y+(b.y-a.y)*j/n,8),false,'blocked route');}
 Object.assign(p,{x:stone.x,y:stone.rootY+30-14,faceX:0,faceY:-1});assert.equal(harvestGravestone(g,p,100),true);assert.equal(stone.depleted,true);
 const plot=g.graveyard.plots.find(q=>q.id===stone.plotId);assert.equal(plot.broken,true);
 p.x=10400;p.y=800;tick(g);assert.ok(!g.scenery.some(s=>s.id===stone.id));assert.ok(g.boundlessChunkEdits['1,0']);p.x=2400;tick(g);assert.equal(g.scenery.find(s=>s.id===stone.id).depleted,true);assert.equal(g.graveyard.plots.find(q=>q.id===stone.plotId).broken,true);
 assert.equal(new Set(g.graveyard.plots.map(p=>p.id)).size,g.graveyard.plots.length);
});
test('active and unloaded region edits survive JSON saves, without reviving harvested props',()=>{
 const g=game('forest'),p=g.players[0];p.x=2400;p.y=800;tick(g);const tree=g.scenery.find(s=>s.boundlessRegion==='1,0'&&s.kind==='tree');assert.ok(tree);tree.fallen=true;tree.depleted=true;
 let r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));tick(r);assert.equal(r.scenery.find(s=>s.id===tree.id).fallen,true);
 r.players[0].x=10400;tick(r);r=restoreSession(JSON.parse(JSON.stringify(saveSession(r))));r.players[0].x=2400;tick(r);assert.equal(r.scenery.find(s=>s.id===tree.id).depleted,true);
});
test('travel keeps geometry caches and live regions bounded; ambient rustling does not bloat saves',()=>{
 const g=game('forest'),p=g.players[0];p.x=2400;tick(g);for(const s of g.scenery.filter(s=>s.boundlessRegion))s.rustle=.5;p.x=10400;tick(g);assert.equal(Object.keys(g.boundlessChunkEdits).length,0);
 for(let n=0;n<80;n++){p.x=800+n*1600;p.y=-800;tick(g);assert.ok(g.boundlessLoadedChunks.length<=9);assert.ok(boundlessCacheSize(g)<=REGION_CACHE_LIMIT);}
 assert.equal(Object.keys(g.boundlessChunkEdits).length,0);
});
test('legacy streamed mixtures migrate once while home objects and edited beach tiles remain',()=>{
 const g=game('beach');delete g.boundlessGenerationVersion;g.boundlessLoadedChunks=[];g.scenery.push({id:'boundless:2:0:old',kind:'snow_tree'},{id:'player-custom',kind:'table',x:500,y:500});g.terrain[25*50+25]='wood';assert.equal(initializeBoundlessWorld(g),true);assert.equal(g.terrain[25*50+25],'wood');assert.ok(g.scenery.some(s=>s.id==='player-custom'));assert.ok(!g.scenery.some(s=>s.id==='boundless:2:0:old'));assert.equal(initializeBoundlessWorld(g),false);
});
test('graveyard ground paints negative/distant viewports even before the bounded reveal is finished',()=>{
 const g=game('graveyard');g.bloom=1;const colors=[],rects=[];const c={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(x,y,w,h){colors.push(this.fillStyle);rects.push([x,y,w,h]);}};
 assert.equal(drawGraveyardGround(c,g,{sx:-54,sy:51,ex:-48,ey:57}),true);assert.ok(rects.length>36);assert.ok(rects.some(r=>r[0]<0&&r[1]>1600));assert.ok(!colors.includes('#888a8e'));
});

test('pathfinding routes around obstacles in negative coordinates instead of clamping to the old board',async()=>{
 const {findPath}=await import('../src/navigation.mjs');const wall=(x,y)=>x>-3840&&x< -3800&&y>-3150&&y< -2900;
 const g={mapMode:'boundless',time:0,blocked:wall},e={kind:'skeleton',x:-4000,y:-3000},target={x:-3600,y:-3000};const path=findPath(g,e,target);
 assert.ok(path.length>14);assert.ok(path.every(p=>p.x<0&&p.y<0&&!wall(p.x,p.y)));assert.ok(Math.hypot(path.at(-1).x-target.x,path.at(-1).y-target.y)<32);
});
