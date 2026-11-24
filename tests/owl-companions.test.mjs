import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {ALLEY_SHOPS,switchAlleyLayer} from '../src/diagon-alley.mjs';
import {mirroredShopPoint} from '../src/diagon-shop-rooms.mjs';
import {companionReserve,renamePet,restoreHunterPet,switchHunterCompanion,tickHunterPets,hurtPet} from '../src/hunter-pets.mjs';
import {BACKPACK_SLOTS,count,freshCharacter,give} from '../src/items.mjs';
import {EMPORIUM_OWLS,PIRATE_PARROT_CAGE} from '../src/owl-emporium.mjs';
import {Profiles} from '../src/profiles.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {tickStationOwls} from '../src/station-owls.mjs';
import {leaveTrainTest,trainInteraction} from '../src/train-test.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

const [snowy,barn,horned]=Object.keys(EMPORIUM_OWLS);
const shop=ALLEY_SHOPS.find(s=>s.id==='eeylops');
function fixture({persistent=true,gold=300,spider=false}={}){
 const g=new Game(()=>.5),owner=g.addPlayer('keyboard','Owl Keeper');
 g.start();g.persist=()=>{};
 owner.coins=gold;
 if(spider)owner.hunterPet=restoreHunterPet({kind:'tarantula',name:'Mario',hp:60});
 assert.ok(enterWildLands(g,{persistent}).ok);
 switchAlleyLayer(g,'diagon');
 const p=g.players[0];
 Object.assign(p,mirroredShopPoint(shop,{x:52,y:14}));
 assert.ok(trainInteraction(g,p));
 assert.equal(p.ui.alleyShop,shop.id);
 return {g,p,owner};
}

function adopt(g,p,type){
 const {index}=merchantRows(g,p).find(row=>row.item.type===type);
 merchantAction(g,p,'select:'+index);
 return merchantAction(g,p,'use');
}

test('Owlery adoptions charge exact gold, preserve Mario, and work with a full backpack',()=>{
 const {g,p}=fixture({spider:true});
 p.inventory=Array.from({length:BACKPACK_SLOTS},()=>({type:'hat',qty:1}));
 for(const [type,owl]of Object.entries(EMPORIUM_OWLS)){
  const before=p.coins;
  assert.ok(adopt(g,p,type));
  assert.equal(p.coins,before-owl.price);
  assert.equal(count(p,type),0,'purchases adopt a companion directly');
  assert.equal(p.hunterPet.name,owl.name);
  assert.equal(p.hunterPet.owlVariant,owl.variant);
 }
 assert.deepEqual(companionReserve(p).map(pet=>pet.name),['Mario','Snowy Owl','Tiny Barn Owl']);
 const gold=p.coins;
 adopt(g,p,snowy);
 assert.match(p.ui.notice,/already have/);
 assert.equal(p.coins,gold);
 assert.ok(switchHunterCompanion(g,p,0));
 assert.equal(p.hunterPet.name,'Mario');
 assert.equal(p.hunterPet.hp,60);
 assert.equal(companionReserve(p).at(-1).owlVariant,EMPORIUM_OWLS[horned].variant);
});

test('an adopted owl flies, fights, and uses the normal rescue timer',()=>{
 const {g,p}=fixture();
 adopt(g,p,barn);p.ui=null;
 const pet=p.hunterPet;
 Object.assign(p,{x:8000,y:5220,faceX:0,faceY:-1});
 tickHunterPets(g,.05);
 const x=pet.x;
 p.x+=110;
 for(let i=0;i<4;i++)tickHunterPets(g,.05);
 assert.ok(pet.x>x&&pet.owlHeight>0);
 const hostile={kind:'skeleton',x:pet.x+17,y:pet.y,hp:100,maxHp:100};
 g.enemies=[hostile];
 tickHunterPets(g,.05);
 assert.ok(hostile.hp<100&&pet.attack>0);
 assert.equal(pet.owlPhase,'attack');
 assert.equal(hostile.killedBy,p.id);

 hurtPet(g,pet,pet.hp);
 assert.equal(pet.downedRemaining,60);
 Object.assign(p,{x:pet.x,y:pet.y});
 for(let i=0;i<34;i++)tickHunterPets(g,.05,{keyboard:{interact:true}});
 assert.ok(pet.hp>0&&pet.downedRemaining===undefined);
});

test('the active owl, custom names, and reserve survive the expedition and character saves',()=>{
 const {g,p}=fixture({spider:true});
 adopt(g,p,snowy);
 assert.ok(renamePet(g,p,'Juniper','#a1b2c3'));
 adopt(g,p,barn);
 const reload=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),active=reload.players[0];
 assert.equal(active.hunterPet.name,'Tiny Barn Owl');
 assert.ok(switchHunterCompanion(reload,active,1));
 assert.equal(active.hunterPet.name,'Juniper');
 assert.equal(active.hunterPet.collar,'#a1b2c3');
 const profiles=new Profiles(),hero=freshCharacter('owl-qa','Owl Keeper');
 profiles.data.heroes.push(hero);active.profileId=hero.id;
 profiles.write=async()=>{};
 profiles.capture(reload);
 const another={};
 profiles.assign(another,JSON.parse(JSON.stringify(profiles.data.heroes[0])));
 assert.equal(another.hunterPet.name,'Juniper');
 assert.deepEqual(companionReserve(another).map(pet=>pet.name),['Mario','Tiny Barn Owl']);
});

test('owl adoption in a preview carries the exact debit and reserve into the original expedition',()=>{
 const {g,p,owner}=fixture({persistent:false,gold:60,spider:true});
 const before=owner.coins;
 adopt(g,p,snowy);
 assert.ok(renamePet(g,p,'Juniper'));
 adopt(g,p,barn);
 assert.match(p.ui.notice,/more gold/);
 assert.equal(owner.hunterPet.name,'Mario');
 assert.equal(owner.coins,before);
 leaveTrainTest(g);
 assert.equal(owner.coins,before-EMPORIUM_OWLS[snowy].price);
 assert.equal(owner.hunterPet.name,'Juniper');
 assert.equal(companionReserve(owner)[0].name,'Mario');
});

test('saved Owlery calls and unclaimed cages migrate without disturbing the rescued station owl',()=>{
 const {g,p}=fixture({spider:true});
 p.npcQuests={owl_emporium:{active:snowy},snowy_owl:{active:true,name:'Snowy Owl',origin:'station-cage'}};
 give(p.inventory,snowy);give(p.inventory,horned);
 const reload=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),active=reload.players[0];
 assert.equal(active.hunterPet.name,'Mario');
 assert.equal(companionReserve(active)[0].name,'Snowy Owl');
 assert.equal(count(active,snowy),0);
 assert.ok(active.npcQuests.snowy_owl.active);
 assert.equal(active.npcQuests.owl_emporium.active,undefined);
 active.ui={panel:'pack',index:active.inventory.findIndex(item=>item?.type===horned)};
 reload.inventoryAction(active,'use');
 assert.equal(active.hunterPet.name,'Great Horned Owl');
 assert.equal(count(active,horned),0);
 tickStationOwls(reload,.05);
 assert.equal(reload.stationOwls.length,1);
 assert.equal(reload.stationOwls[0].owlVariant,undefined);
});

test('the pirate cage calls and recalls one named parrot through the ordinary inventory Use action',()=>{
 const {g,p}=fixture({spider:true});
 assert.ok(!merchantRows(g,p).some(row=>row.item?.type===PIRATE_PARROT_CAGE));
 give(p.inventory,PIRATE_PARROT_CAGE);
 const use=(game,hero)=>{
  hero.ui={panel:'pack',index:hero.inventory.findIndex(item=>item?.type===PIRATE_PARROT_CAGE)};
  game.inventoryAction(hero,'use');
  hero.ui=null;
 };
 use(g,p);
 assert.equal(p.hunterPet.owlVariant,'parrot');
 renamePet(g,p,'Pippin','#86714f');
 use(g,p);
 assert.equal(companionReserve(p).length,1);
 assert.ok(switchHunterCompanion(g,p,0));
 use(g,p);
 assert.equal(p.hunterPet.name,'Pippin');
 tickHunterPets(g,.05);
 hurtPet(g,p.hunterPet,p.hunterPet.hp);
 p.hunterPet.downedRemaining=.04;
 tickHunterPets(g,.05);
 assert.equal(p.hunterPet,null);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0];
 use(restored,hero);
 assert.equal(hero.hunterPet.name,'Pippin');
 assert.equal(hero.hunterPet.collar,'#86714f');
 assert.equal(hero.hunterPet.owlVariant,'parrot');
 assert.equal(count(hero,PIRATE_PARROT_CAGE),1);
});
