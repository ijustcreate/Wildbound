import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {generateWellTunnels} from '../src/old-well.mjs';
import {generateMausoleumCrypt} from '../src/mausoleum-crypt.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function gameWithParty(){
  const game=new Game(()=>.37);
  const owner=game.addPlayer('keyboard','Owner');
  const guest=game.addPlayer('pad:0','Guest');
  game.start();
  game.openingBoard=false;
  game.enemies=[];
  owner.inventory=[];
  guest.inventory=[];
  return {game,owner,guest};
}

function storageEntrance(game,owner){
  const door={id:game.nextId++,x:owner.x,y:owner.y,owner:owner.id,closing:null};
  game.portals.push(door);
  return door;
}

test('a private room drop remains available through a portal close and saved expedition',()=>{
  let {game,owner,guest}=gameWithParty();
  const door=storageEntrance(game,owner);
  assert.ok(game.enterRoom(owner,door));
  owner.inventory=[{type:'sword',qty:1,sockets:['ruby']}];
  game.openInventory(owner);
  game.update(.05,{keyboard:{drop:true}});
  assert.ok(!owner.inventory.some(Boolean));
  assert.equal(game.loot.length,0);
  game.leaveRoom(owner);
  assert.ok(!game.portals.some(portal=>portal.id===door.id));

  game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  [owner,guest]=game.players;
  const guestDoor=storageEntrance(game,guest);
  assert.ok(game.enterRoom(guest,guestDoor));
  game.update(.05,{'pad:0':{loot:true}});
  assert.ok(!guest.inventory.some(Boolean));
  game.leaveRoom(guest);
  const reopened=storageEntrance(game,owner);
  Object.assign(guest,{x:reopened.x,y:reopened.y});
  assert.ok(game.enterRoom(guest,reopened));
  guest.inventory=Array.from({length:32},()=>({type:'sword',qty:1}));
  game.update(.05,{});
  game.update(.05,{'pad:0':{loot:true}});
  assert.equal(guest.inventory.filter(item=>item?.sockets?.includes('ruby')).length,0);
  guest.inventory=[];
  game.update(.05,{});
  game.update(.05,{'pad:0':{loot:true}});
  assert.deepEqual(guest.inventory[0],{type:'sword',qty:1,sockets:['ruby']});
  game.update(.05,{});
  game.update(.05,{'pad:0':{loot:true}});
  assert.equal(guest.inventory.filter(Boolean).length,1);
});

for(const mausoleum of [false,true]){
  test(`${mausoleum?'Mausoleum':'Old Well'} ground exchanges remove exactly one unit and need pickup input`,()=>{
    const {game,owner,guest}=gameWithParty();
    const well=(mausoleum?generateMausoleumCrypt:generateWellTunnels)(42,{authored:false});
    const door={id:game.nextId++,x:owner.x,y:owner.y,oldWell:true,mausoleum,well,autoEnter:false};
    game.portals.push(door);
    Object.assign(guest,{x:door.x,y:door.y});
    assert.ok(game.enterRoom(owner,door));
    assert.ok(game.enterRoom(guest,door));
    owner.inventory=[{type:'fruit',qty:3}];
    game.openInventory(owner);
    game.update(.05,{keyboard:{dropOne:true}});
    assert.equal(owner.inventory[0].qty,2);
    assert.equal(well.drops.length,1);
    assert.equal(well.drops[0].qty,1);
    assert.ok(!guest.inventory.some(Boolean));
    game.update(.05,{'pad:0':{loot:true}});
    assert.deepEqual(guest.inventory[0],{type:'fruit',qty:1});
    assert.equal(well.drops.length,0);
  });
}
