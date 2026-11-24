import test from 'node:test';
import assert from 'node:assert/strict';
import {DEATH_EATER_MASKS} from '../src/death-eater-masks.mjs';
import {DARK_WIZARD_WARNING,maskWearers,stationaryWizardWarning} from '../src/dark-wizard-reactions.mjs';
import {alleyResidentsFor,drawAlleyResidentActivity,nearbyAlleyResident,openAlleyResidentDialogue,tickAlleyResidents} from '../src/diagon-residents.mjs';
import {NOCTURNE_DARK_WIZARDS} from '../src/nocturne-dark-wizards.mjs';

const mask=Object.keys(DEATH_EATER_MASKS)[0],empty=()=>false;

function scene(blocked=empty,nearStationaryWizard){
 const player={id:'hero',device:'keyboard',hp:30,x:7900,y:5660,equipment:{},inventory:[]};
 const g={players:[player],sky:{elapsed:0},trainTest:{design:{activeRoom:'diagon'},time:0}};
 const tick=(frames=1)=>{
  for(let i=0;i<frames;i++){
   g.trainTest.time+=.05;
   tickAlleyResidents(g,.05,blocked,nearStationaryWizard);
  }
 };
 tick();
 return {g,player,tick,resident:id=>alleyResidentsFor(g).find(n=>n.residentId===id)};
}

test('only a nearby living player wearing one of the three Death Eater masks alarms wizards',()=>{
 const players=Object.keys(DEATH_EATER_MASKS).map(head=>({hp:1,equipment:{head}}));
 const [good]=players;
 assert.deepEqual(maskWearers([
  ...players,{hp:1,inventory:[{type:mask}]},{...good,hp:0},{...good,room:'storage'},
  {...good,trainRide:{}},{...good,controlledFollowerId:'owl'},{...good,jumpHeight:45},
 ]),players);
 const {g,player,tick,resident}=scene();
 const civilian=resident('tamsin'),origin={x:civilian.x,y:civilian.y};
 Object.assign(player,{x:origin.x,y:origin.y+34,inventory:[{type:mask}]});
 tick(5);
 assert.equal(civilian.darkWizardAlarm,undefined);
 assert.equal(player.inventory[0].type,mask);
 const darkBefore=structuredClone(NOCTURNE_DARK_WIZARDS);
 assert.ok(openAlleyResidentDialogue(g,player,civilian));
 player.equipment.head=mask;
 tick(4);
 assert.equal(player.ui,null);
 assert.equal(civilian.movementGait,'run');
 assert.equal(civilian.walking,false);
 assert.ok(civilian.y<origin.y-10);
 assert.notEqual(nearbyAlleyResident(g,player,empty),civilian);
 assert.equal(openAlleyResidentDialogue(g,player,civilian),false);
 const lines=[];
 drawAlleyResidentActivity({save(){},restore(){},strokeText(){},fillText:line=>lines.push(line)},g,()=>true);
 assert.deepEqual(lines,[DARK_WIZARD_WARNING]);
 assert.deepEqual(NOCTURNE_DARK_WIZARDS,darkBefore);
 tick(45);
 const waiting={x:civilian.x,y:civilian.y};
 assert.ok(civilian.darkWizardAlarm);
 tick(20);
 assert.deepEqual([civilian.x,civilian.y],[waiting.x,waiting.y]);
 delete player.equipment.head;
 tick(110);
 assert.equal(civilian.darkWizardAlarm,undefined);
 assert.deepEqual([civilian.x,civilian.y],[origin.x,origin.y]);
 assert.ok(openAlleyResidentDialogue(g,player,civilian));
});

test('park residents steer around obstacles and residents across walls cannot see the mask',()=>{
 let wall=null;
 const blocked=(x,y)=>wall?.(x,y)??false;
 const {player,tick,resident}=scene(blocked);
 const civilian=resident('neville'),x=civilian.x,y=civilian.y;
 player.equipment.head=mask;
 Object.assign(player,{x:x-44,y});
 wall=px=>Math.abs(px-(x-22))<8;
 tick(10);
 assert.equal(civilian.darkWizardAlarm,undefined,'a solid partition hides the mask');
 wall=(px,py)=>px>x+9&&Math.abs(py-y)<19;
 tick(15);
 assert.equal(civilian.movementGait,'run');
 assert.ok(Math.abs(civilian.y-y)>12);
 assert.equal(blocked(civilian.x,civilian.y),false);
});

test('anchored shopkeepers speak once per approach and keep their positions',()=>{
 const merchant={id:'shopkeeper',x:8100,y:4000};
 const {g,player,tick}=scene(empty,p=>Math.hypot(p.x-merchant.x,p.y-merchant.y)<72?merchant:null);
 Object.assign(player,{x:8100,y:4050});
 player.equipment.head=mask;
 tick();
 const warning=()=>stationaryWizardWarning(g.trainTest,g.trainTest.time,()=>true);
 assert.strictEqual(warning(),merchant);
 tick(60);
 assert.equal(warning(),null);
 player.y+=200;
 tick(5);
 player.y=4050;
 tick(5);
 assert.strictEqual(warning(),merchant);
 assert.deepEqual(merchant,{id:'shopkeeper',x:8100,y:4000});
});
