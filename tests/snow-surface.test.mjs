import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickTracks} from '../src/environment.mjs';
import {drawSnowMelt,snowGroundAt} from '../src/snow-surface.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {HOGSMEADE_BUILDINGS,HOGSMEADE_SHACK,hogsmeadeDoor} from '../src/hogsmeade-layout.mjs';
import {nativeWildTile} from '../src/wild-native-biomes.mjs';
import {railwayStations} from '../src/railway-station.mjs';

function countMelt(game){
 let pixels=0;
 const canvas={globalAlpha:1,save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(x,y,w,h){pixels+=w*h;}};
 drawSnowMelt(canvas,game);
 return pixels;
}

test('native Wild Lands snow records grounded boots and paws and fire bolts leave a temporary melt',()=>{
 const game=new Game(()=>.5,{deferWorld:true});
 game.addPlayer('keyboard','Frostmere explorer');
 assert.equal(enterWildLands(game).ok,true);
 const train=game.trainTest,player=game.players[0];
 let site=null;
 for(let y=4940;y<5630&&!site;y+=40)for(let x=8120;x<9650&&!site;x+=40){
  if([0,20,40,60].every(dx=>snowGroundAt(game,x+dx,y)&&!game.blocked(x+dx,y,8,false,false)))site={x,y};
 }
 assert.ok(site,'Find a generated, walkable strip of thick snow');
 Object.assign(player,site);
 for(let i=0;i<12;i++)game.update(.04,{keyboard:{x:1}});
 assert.ok(train.footprints.some(f=>f.snow&&!f.animal),'real movement tick leaves boots');
 assert.equal(game.footprints?.length||0,0,'the other world keeps its own footprints');

 const enemy={id:'test-wolf',kind:'wolf',x:site.x,y:site.y-14,hp:20};
 game.enemies=[enemy];tickTracks(game);
 enemy.x+=20;tickTracks(game);
 assert.ok(train.footprints.some(f=>f.snow&&f.animal));
 const count=train.footprints.length;
 enemy.jumpHeight=13;enemy.x+=20;tickTracks(game);
 assert.equal(train.footprints.length,count,'airborne feet do not press the snow');

 game.spells=[{...site,fire:true,vx:120,vy:0,life:1,remaining:50,size:5}];
 game.tickProjectiles(.1);
 assert.ok(countMelt(game)>0,'real fire projectile produces wet surface pixels');
 assert.equal(snowGroundAt(game,site.x,site.y),true,'melting does not replace the collision terrain');
 game.time+=12;
 assert.equal(countMelt(game),0,'snow cover returns as the surface cools');
});

test('walking and fire leave no thick-snow marks on Classic bare ice',()=>{
 const game=new Game(()=>.5,{deferWorld:true}),player=game.addPlayer('keyboard','Winter explorer');
 game.generatedEnvironment='ice';game.terrain=Array(2500).fill('ice');game.time=1;game.scenery=[];
 Object.assign(player,{x:600,y:620});tickTracks(game);
 player.x+=20;tickTracks(game);
 assert.equal(game.footprints.length,0);
 game.spells=[{x:600,y:620,fire:true,vx:120,vy:0,life:1,remaining:50,size:5}];
 game.tickProjectiles(.1);
 assert.equal(countMelt(game),0);
});

test('Wild Lands snow stops at the Hogsmeade cutaway floors',()=>{
 const game=new Game(()=>.5,{deferWorld:true});
 const player=game.addPlayer('keyboard','Hogsmeade explorer');
 assert.equal(enterWildLands(game).ok,true);
 const [inn]=HOGSMEADE_BUILDINGS;
 const innDoor=hogsmeadeDoor(inn);
 assert.equal(snowGroundAt(game,innDoor.x,innDoor.y-12),false);
 assert.equal(snowGroundAt(game,innDoor.x,innDoor.y+8),true);
 assert.equal(snowGroundAt(game,innDoor.x,innDoor.y+1),true);
 assert.equal(snowGroundAt(game,innDoor.x,innDoor.y+1,4),false);
 assert.equal(snowGroundAt(game,innDoor.x,innDoor.y+8,4),true);

 Object.assign(player,{x:HOGSMEADE_SHACK.x,y:HOGSMEADE_SHACK.y});
 tickTracks(game);
 player.x+=20;
 tickTracks(game);
 assert.equal(game.trainTest.footprints.length,0);
});

test('Frostmere station flooring covers its underlying snow',()=>{
 const game=new Game(()=>.5,{deferWorld:true});
 game.addPlayer('keyboard','Frostmere traveler');
 assert.equal(enterWildLands(game).ok,true);
 const train=game.trainTest;
 const {x,y}=railwayStations(train.design).find(world=>world.station.visualId==='ice').station;
 assert.equal(nativeWildTile(train,x,y),'snow');
 assert.equal(snowGroundAt(game,x,y),false);
});

test('Classic house floors cover the snow tiles underneath them',()=>{
 const game=new Game(()=>.5,{deferWorld:true});
 game.generatedEnvironment='ice';
 game.terrain=Array(2500).fill('snow');
 game.house={floors:[{x:600,y:616,w:48,h:36}]};
 assert.equal(snowGroundAt(game,620,620),false);
 assert.equal(snowGroundAt(game,620,615),true);
 assert.equal(snowGroundAt(game,620,615,4),false);
 assert.equal(snowGroundAt(game,620,611,4),true);
});
