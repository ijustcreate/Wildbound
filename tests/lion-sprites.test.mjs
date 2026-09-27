import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLionMotion,drawLion,upgradeLionMotion} from '../src/lion-motion.mjs';
import {captureLayers,releaseLayers,boneSprites,renderLayers} from '../src/render-order.mjs';
const context=()=>({fillStyle:'',fillRect(){}});
test('Lion east view draws body before separate named mane and face layers',()=>{
  const model=defaultLionMotion();drawLion(context(),{faceX:1,faceY:0,animationAction:'run',playerFrame:0},0,model);
  const order=renderLayers(model,6);assert.ok(order.indexOf('Body')<order.indexOf('Mane'));assert.ok(order.indexOf('Mane')<order.indexOf('Face'));
});
test('Selected lion head exposes editable mane and face sprites, with edits isolated per view',()=>{
  const model=defaultLionMotion(),c=context(),actor={faceX:1,faceY:0,animationAction:'run',playerFrame:0};
  captureLayers(model);drawLion(c,actor,0,model);releaseLayers(model);
  const sprites=boneSprites(model,6,'head');assert.deepEqual(sprites.map(p=>p.id),['Mane','Face']);assert.ok(sprites.every(p=>p.sprite.pixels.some(Boolean)));
  model.boneSprites={Mane:{6:{width:1,height:1,x:0,y:0,palette:['transparent','#123456'],pixels:[1]}}};
  const colors=[];c.fillRect=function(){colors.push(this.fillStyle);};drawLion(c,actor,0,model);assert.ok(colors.includes('#123456'));
  colors.length=0;drawLion(c,{...actor,faceX:0,faceY:1},0,model);assert.ok(!colors.includes('#123456'));
});
test('Existing numbered lion layer orders migrate to named layers',()=>{const model=defaultLionMotion();model.renderOrder={6:['Layer 7','Layer 8']};assert.deepEqual(upgradeLionMotion(model).renderOrder[6],['Body','Mane','Face']);});
