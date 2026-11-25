import {Assets} from '../src/assets.mjs';
import {initializeTacticalEnemy} from '../src/combat-tactics-state.mjs';
import {Game} from '../src/core.mjs';
import {CAMERA_DEFAULTS,saveCameraSettings} from '../src/multiplayer-camera.mjs';
import {FrameMetrics} from '../src/performance.mjs';
import {stopRailwayStream} from '../src/railway-stream.mjs';
import {Renderer} from '../src/render.mjs';
import {trainCars,trainWorld} from '../src/train-track.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

const STEP=1/60;
const WORLD_SEED=42;
const SCENE_SEED=123;
const ENEMY_COUNT=24;
const WARM_FRAMES=60;
const FOREST_SPOTS=[[260,340],[1280,1170],[260,1170],[1280,340]];
const RAIL_SPOTS=[[0,0],[6900,4320],[3600,5550],[11800,3000]];
const ENEMY_KINDS=['skeleton','archer','monkey','lion'];

export const benchmarkCatalog=['train-travel','heavy-weather','crowded-fight'].flatMap(scenario=>
  [2,3,4].map(players=>({id:`${scenario}-${players}`,scenario,players})));

function seededRandom() {
  let seed=SCENE_SEED;
  return ()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
}

function createGame(assets,scene) {
  const game=new Game(seededRandom());
  game.seed=WORLD_SEED;
  game.environment='forest';
  for(let i=0;i<scene.players;i++)game.addPlayer(i?`pad:${i}`:'keyboard',`P${i+1}`);
  game.start();
  Object.assign(game,{openingBoard:false,phase:'play',bloom:3,time:22,persist:()=>{},
    onSound:()=>{},spriteLibrary:assets.library,weather:null});
  game.enemies=[];
  for(const player of game.players)player.invulnerable=999;
  if(scene.scenario==='train-travel') {
    const outcome=enterWildLands(game);
    if(!outcome.ok)throw Error(outcome.message);
    game.trainTest.noticeUntil=0;
  }
  return game;
}

function startTravel(game) {
  const train=game.trainTest;
  const driver=game.players[0];
  const cab=trainCars(train)[0];
  const ride={car:0,x:0,y:0,driving:true};
  Object.assign(driver,trainWorld(cab,ride.x,ride.y),{trainRide:ride});
  Object.assign(train,{engine:true,driver:driver.id,throttle:.7,speed:train.design.maxSpeed*.7});
}

function populateFight(game) {
  for(let i=0;i<ENEMY_COUNT;i++) {
    const player=game.players[i%game.players.length];
    const kind=ENEMY_KINDS[i%ENEMY_KINDS.length];
    const radius=35+Math.floor(i/game.players.length)*12;
    const angle=i*2.4;
    const enemy={id:1000+i,kind,sprite:kind,x:player.x+Math.cos(angle)*radius,
      y:player.y+Math.sin(angle)*radius,hp:200,maxHp:200,speed:55,damage:8,
      state:'hunt',timer:0,cooldown:i*.07,faceX:1,faceY:0,temperament:'bold',tacticTime:1};
    game.configureCreature(enemy,false);
    initializeTacticalEnemy(enemy);
    game.enemies.push(enemy);
  }
}

function activateScenario(game,scenario) {
  const spots=game.trainTest?RAIL_SPOTS:FOREST_SPOTS;
  game.players.forEach((player,index)=>{
    if(!game.trainTest||index)Object.assign(player,{x:spots[index][0],y:spots[index][1]});
  });
  if(game.trainTest)startTravel(game);
  if(scenario==='heavy-weather')game.weather={type:'monsoon',life:100};
  if(scenario==='crowded-fight')populateFight(game);
}

function scriptedInput(game,scenario,step) {
  if(scenario!=='crowded-fight')return {};
  return Object.fromEntries(game.players.map((player,index)=>[player.device,{
    attack:(step+index*9)%34===0,
    aimX:Math.cos(step*.035+index),aimY:Math.sin(step*.035+index),
  }]));
}

function sleep(ms) {
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function nextFrame(raf,timeoutMs) {
  return new Promise(resolve=>{
    const request=raf(now=>{
      clearTimeout(timer);
      resolve(now);
    });
    const timer=setTimeout(()=>{
      cancelAnimationFrame(request);
      resolve(null);
    },timeoutMs);
  });
}

function createMetrics() {
  const metrics=new FrameMetrics();
  metrics.enabled=true;
  return metrics;
}

function sceneState(game,renderer) {
  const train=game.trainTest;
  return {
    views:renderer.splitViews?.length||1,
    positions:game.players.map(({x,y,trainRide})=>({x,y,trainCar:trainRide?.car??null})),
    enemies:game.enemies.length,weather:game.weather?.type??null,scenery:game.scenery.length,
    train:train?{route:train.route.id,distance:train.distance,speed:train.speed,
      mapPreparing:!!train.preparing,workerQueue:train.terrainStream?.queue.size??null,
      workerErrors:[...(train.terrainStream?.errors||[])]}:null,
  };
}

export async function createGameplayBenchmark() {
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=()=>0;
  const assets=new Assets();
  await assets.load();
  for(const child of document.body.children)child.style.display='none';
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh';
  document.body.append(canvas);
  const caption=document.createElement('div');
  caption.style.cssText='position:fixed;top:8px;left:8px;padding:8px;background:#102724ed;color:#d2e4db;font:13px monospace;pointer-events:none';
  caption.textContent='Wildbound gameplay benchmark · muted';
  document.body.append(caption);

  async function probeCadence() {
    const metrics=createMetrics();
    let previous=await nextFrame(raf,1500);
    const started=performance.now();
    while(previous!==null&&metrics.samples.frame?.length!==16&&performance.now()-started<2200) {
      const now=await nextFrame(raf,750);
      if(now!==null)metrics.record('frame',now-previous);
      previous=now;
    }
    const frameMs=metrics.stats('frame');
    const hz=frameMs?1000/frameMs.mean:null;
    const visible=document.visibilityState==='visible';
    const available=visible&&frameMs?.count===16&&hz>=10;
    return {available:Boolean(available),visible,hz,frameMs,reason:available?null:
      'Foreground requestAnimationFrame delivery was unavailable or throttled; average FPS is unavailable.'};
  }

  async function measure(scene,{visible=false,frames=120}={}) {
    caption.textContent=`Wildbound benchmark · ${scene.id} · muted`;
    const transitions=[];
    let game,renderer,step=0;
    const zoom=scene.scenario==='train-travel'?.65:1.35;
    saveCameraSettings({...CAMERA_DEFAULTS,minZoom:zoom,maxZoom:zoom});
    const setupStarted=performance.now();
    try {
      game=createGame(assets,scene);
      renderer=new Renderer(canvas,assets);
      renderer.setDynamicShadows(true);
      transitions.push({id:'setup',elapsedMs:performance.now()-setupStarted});

      async function transition(id,change) {
        const start=performance.now();
        change();
        renderer.draw(game,STEP);
        const cpuMs=performance.now()-start;
        const delivered=visible?await nextFrame(raf,5000):null;
        transitions.push({id,cpuMs,paintCallbackMs:delivered===null?null:performance.now()-start,
          views:renderer.splitViews?.length||1});
      }

      await transition('first-world-draw',()=>{});
      await transition('start-scenario-and-open-split-views',()=>activateScenario(game,scene.scenario));
      const firstScenarioState=sceneState(game,renderer);
      const waitStarted=performance.now();
      while(game.trainTest?.preparing&&performance.now()-waitStarted<90000) {
        await sleep(8);
        renderer.draw(game,STEP);
      }
      if(game.trainTest?.preparing)throw Error(`${scene.id} terrain preparation timed out`);
      if(game.trainTest)transitions.push({id:'railway-terrain-ready',elapsedMs:performance.now()-waitStarted});

      const fixedUpdate=()=>game.update(STEP,scriptedInput(game,scene.scenario,step++));
      const warmStarted=performance.now();
      for(let i=0;i<WARM_FRAMES;i++) {
        fixedUpdate();
        renderer.draw(game,STEP);
        await sleep(0);
      }
      transitions.push({id:'warm-scenario',frames:WARM_FRAMES,elapsedMs:performance.now()-warmStarted});
      const before=sceneState(game,renderer);
      if(before.views!==scene.players)throw Error(`${scene.id} expected ${scene.players} active views, got ${before.views}`);

      const metrics=createMetrics();
      let previous=visible?await nextFrame(raf,5000):null;
      let unavailableReason=visible&&previous===null?'No foreground frame before the sample.':null;
      const started=performance.now();
      for(let i=0;i<frames;i++) {
        metrics.measure('cpu',()=>{
          metrics.measure('simulation',fixedUpdate);
          metrics.measure('draw',()=>renderer.draw(game,STEP));
        });
        if(previous===null) {
          await sleep(0);
        } else {
          const now=await nextFrame(raf,5000);
          if(now===null)unavailableReason='Foreground frame delivery stopped during the sample.';
          else metrics.record('frame',now-previous);
          previous=now;
        }
      }
      const elapsedMs=performance.now()-started;
      const after=sceneState(game,renderer);
      if(after.views!==scene.players)throw Error(`${scene.id} lost a split view while sampling`);
      if(game.trainTest&&(!(after.train.distance>before.train.distance)||after.train.workerErrors.length)) {
        throw Error(`${scene.id} did not complete real railway travel or its terrain worker reported errors`);
      }
      if(scene.scenario==='heavy-weather'&&after.weather!=='monsoon')throw Error(`${scene.id} monsoon ended during sampling`);
      if(scene.scenario==='crowded-fight'&&before.enemies<ENEMY_COUNT/2)throw Error(`${scene.id} lost the crowded fight during warmup`);
      const frameMs=metrics.stats('frame');
      if(visible&&(document.visibilityState!=='visible'||frameMs?.mean>=900||frameMs?.count!==frames)) {
        unavailableReason||='Foreground frame delivery was interrupted or throttled during sampling.';
      }
      const measuredFrameMs=unavailableReason?null:frameMs;
      return {...scene,frames,elapsedMs,canvas:{width:canvas.width,height:canvas.height},
        seeds:{world:WORLD_SEED,random:SCENE_SEED},
        shadowSettings:{dynamicShadows:renderer.dynamicShadows},cameraZoom:zoom,
        firstScenarioState,before,after,transitions,
        averageFps:measuredFrameMs?1000/measuredFrameMs.mean:null,frameMs:measuredFrameMs,
        unavailableReason,simulationMs:metrics.stats('simulation'),drawMs:metrics.stats('draw'),
        cpuMs:metrics.stats('cpu')};
    } finally {
      if(game?.trainTest)stopRailwayStream(game.trainTest);
      renderer?.clearSplitRenderers();
      for(const grass of [renderer?.grassField,renderer?.railwayGrass]) {
        const gl=grass?.gl;
        grass?.dispose();
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      }
    }
  }

  return {probeCadence,measure};
}
