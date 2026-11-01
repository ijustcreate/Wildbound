import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK } from '../../src/creature-packs/constructs.mjs';

const targets=['voodoo_doll','jimothy','mana_golem'];
const directions=[[0,1],[-Math.SQRT1_2,Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[Math.SQRT1_2,-Math.SQRT1_2],[1,0],[Math.SQRT1_2,Math.SQRT1_2]];

test('focused constructs art remains distinct, finite and present across all eight facings',()=>{
  const doll=CREATURE_PACK.subjects.voodoo_doll.defaults().shape;
  const jimothy=CREATURE_PACK.subjects.jimothy.defaults().shape;
  const mana=CREATURE_PACK.subjects.mana_golem.defaults().shape;
  const crystal=CREATURE_PACK.subjects.crystal_golem.defaults().shape;
  assert.ok(doll.headRadius>doll.limbWidth,'rag doll gets a larger sack head and compact limbs');
  assert.ok(jimothy.headRadius>=7,'Jimothy keeps his readable moss crown at game scale');
  assert.ok(mana.bodyWidth<crystal.bodyWidth && mana.headRadius<crystal.headRadius,'arcane vessel stays slimmer than the geode');
  for(const kind of targets){
    const subject=CREATURE_PACK.subjects[kind],model=subject.defaults();
    for(let d=0;d<8;d++){
      const pixels=[];
      const ctx={fillStyle:'#000',fillRect(x,y,w,h){pixels.push([x,y,w,h,this.fillStyle]);}};
      const [faceX,faceY]=directions[d];
      subject.draw(ctx,{kind,x:80,y:80,faceX,faceY,animationAction:'idle'},0,model);
      assert.ok(pixels.length>=24,`${kind}/${d} retains a readable multi-cluster silhouette`);
      for(const [x,y,w,h] of pixels)assert.ok([x,y,w,h].every(Number.isFinite),`${kind}/${d} produces finite pixels`);
    }
  }
});
