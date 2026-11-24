import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {waterAt} from '../src/environment.mjs';
import {BAYOU_GOBLIN_HUT} from '../src/bayou-goblin-hut-layout.mjs';
import {ENERGY_SCORCH_LIMIT,energyBladeContact,energyEffectOnLayer} from '../src/energy-blade.mjs';
import {synthesizeEnergyBlade} from '../src/energy-blade-sound.mjs';
import {CUES,SOUND_FILES} from '../src/sound-bank.mjs';

function setup(){
 const g=new Game(()=>.49,{deferWorld:true});g.addPlayer('keyboard','Reed blade tester');g.phase='play';
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const p=g.players[0],x=BAYOU_GOBLIN_HUT.cx,y=BAYOU_GOBLIN_HUT.front+33;
 g.trainTest.preparing=false;g.enemies=[];g.scenery=[];g.persist=()=>{};
 const sounds=[];g.onSound=cue=>sounds.push(cue);
 Object.assign(p,{x,y,faceX:1,faceY:0,equipment:{hand1:'energy_blade_green'}});
 return {g,p,sounds};
}

test('green blade activates, leaves a fitted motion tail and retracts or reignites in Wild Lands',()=>{
 const {g,p,sounds}=setup(),start=p.x;
 for(let i=0;i<18;i++)g.update(.05,{keyboard:{x:1}});
 assert.ok(p.x>start+12);
 assert.equal(p.energyBladeActive,true);
 assert.equal(sounds.filter(cue=>cue==='energyBladeIgnite').length,1);
 assert.ok(g.effects.some(fx=>fx.type==='energyMotionTail'&&fx.color==='#31dc58'&&energyEffectOnLayer(g,fx)));
 p.energyBladeIdle=9.98;g.update(.05);
 assert.equal(p.energyBladeActive,false);
 assert.ok(g.attack(p));
 assert.equal(p.energyBladeActive,true);
 assert.equal(sounds.filter(cue=>cue==='energyBladeIgnite').length,2);
 assert.equal(sounds.filter(cue=>cue==='energyBladeSwing').length,1);
});

test('real contact scorches tall grass and a struck enemy with bounded world marks',()=>{
 const {g,p,sounds}=setup();
 g.update(.05);
 const grass={kind:'tall_grass',x:p.x+43,y:p.y-11,rootY:p.y+14,size:72};
 assert.notEqual(waterAt(g,grass.x,grass.rootY),'water');
 g.scenery=[grass];
 const enemy={id:g.nextId++,kind:'wolf',faction:'enemy',x:p.x+32,y:p.y+2,hp:90,maxHp:90,speed:0,flash:0,faceX:-1,faceY:0};
 g.enemies=[enemy];
 g.resolveMelee(p,0,{damage:1,reach:1,arc:120});
 assert.ok(grass.charred&&grass.grassFire>0);
 assert.ok(enemy.hp<90&&enemy.burning>0);
 assert.ok(g.energyBladeMarks.some(mark=>mark.x===grass.x&&mark.y===grass.rootY));
 assert.ok(g.effects.some(fx=>fx.particle==='blade-spark'));
 assert.ok(sounds.includes('energyBladeHit'));
 const after=enemy.hp;
 for(let i=0;i<15;i++)g.update(.05);
 assert.ok(enemy.hp<after);
 for(let i=0;i<110;i++)energyBladeContact(g,p,{x:p.x+(i%11)*9,y:p.y+Math.floor(i/11)*9});
 assert.ok(g.energyBladeMarks.length<=ENERGY_SCORCH_LIMIT);
 const [mark]=g.energyBladeMarks;
 g.trainTest.design.activeRoom='diagon';
 assert.equal(energyEffectOnLayer(g,mark),false);
});

test('activation, swing and hit emit distinct synthesized waveforms through native SFX cue definitions',()=>{
 const ctx={sampleRate:24000,createBuffer(_channels,length){const data=new Float32Array(length);return {getChannelData:()=>data,length};}};
 const cues=['energyBladeIgnite','energyBladeSwing','energyBladeHit'].map(key=>CUES[key]);
 const results=cues.map(cue=>{
  assert.ok(cue.distance>0&&cue.gain<.22);
  const data=synthesizeEnergyBlade(ctx,cue.synthesis).getChannelData(0);
  assert.ok(data.some(v=>Math.abs(v)>.07));
  assert.ok(data.at(0)===0&&Math.abs(data.at(-1))<.01);
  assert.ok(data.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
  return data.length;
 });
 assert.deepEqual(results,[10320,5760,3361]);
 assert.equal(SOUND_FILES.has(undefined),false);
});
