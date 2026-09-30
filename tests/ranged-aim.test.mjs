import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {cleanInput} from '../src/rooms.mjs';
import {playerAction,playerFrame} from '../src/player-motion.mjs';

function setup(equipment) {
  const g=new Game(()=>.5),p=g.addPlayer('keyboard');
  g.start();g.openingBoard=false;g.scenery=[];g.enemies=[];g.house=null;g.terrain.fill('grass');
  Object.assign(p,{x:500,y:500,faceX:1,faceY:0,equipment,inventory:[{type:'arrow',qty:20}],mana:100});
  return {g,p};
}
test('arrows and both wand hands preserve all eight aim directions',()=>{
  for(const equipment of [{hand1:'bow'},{hand1:'wand',hand2:'fire_wand'}])for(let d=0;d<8;d++){
    const {g,p}=setup(equipment),angle=d*Math.PI/4;
    p.faceX=Math.abs(Math.cos(angle))<1e-9?0:Math.cos(angle);p.faceY=Math.abs(Math.sin(angle))<1e-9?0:Math.sin(angle);
    g.attack(p);
    for(const shot of [...g.arrows,...g.spells]){
      const speed=Math.hypot(shot.vx,shot.vy);
      assert.ok(Math.abs(shot.vx/speed-p.faceX)<1e-9);
      assert.ok(Math.abs(shot.vy/speed-p.faceY)<1e-9);
      if(shot.angle!==undefined)assert.ok(Math.abs(shot.angle-Math.atan2(shot.vy,shot.vx))<1e-9);
    }
  }
});
test('wand trigger aiming anchors movement and release fires along current input',()=>{
  for(const equipment of [{hand1:'wand',hand2:'shield'},{hand1:'sword',hand2:'wand'},{hand1:'wand',hand2:'fire_wand'}]){
    const {g,p}=setup(equipment);
    Object.assign(p,{dashTime:.2,slideX:100,slideY:100});
    g.update(.02,{keyboard:{block:true,x:1,attack:true}});
    assert.equal(p.x,500);assert.equal(p.y,500);assert.equal(p.blocking,false);assert.equal(p.dashTime,0);assert.equal(p.slideX,0);
    assert.equal(playerAction(p),'cast');assert.equal(playerFrame(p,0),playerFrame(p,10));
    g.update(.02,{keyboard:{block:true,x:1,aimX:0,aimY:-1}});
    assert.ok(g.spells.length>0);
    for(const shot of g.spells){assert.equal(shot.vx,0);assert.ok(shot.vy<0);}
    assert.equal(p.x,500);assert.equal(p.y,500);
    g.update(.02,{keyboard:{x:1}});assert.equal(p.bowAiming,false);assert.ok(p.x>500);
  }
});
test('network sanitization preserves mouse angle and analog deadzone',()=>{
  const v=cleanInput({aimX:300,aimY:-100});assert.ok(Math.abs(v.aimX/v.aimY+3)<1e-9);
  assert.deepEqual(cleanInput({aimX:0,aimY:-1}),{aimX:0,aimY:-1});
  assert.deepEqual(cleanInput({aimX:.1,aimY:0}),{aimX:.1,aimY:0});
});
test('holding aim ignores off-axis targets when launching a spell',()=>{
  const {g,p}=setup({hand1:'wand'});
  g.enemies=[{id:999,x:590,y:520,hp:100}];p.bowAiming=true;
  g.fireSpell(p);assert.equal(g.spells[0].vx,260);assert.equal(g.spells[0].vy,0);
});
