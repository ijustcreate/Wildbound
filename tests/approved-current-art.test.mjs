import test from 'node:test';
import assert from 'node:assert/strict';
import {hairDrawing} from '../src/hero-hair-native.mjs';
import {HAIR_STYLES} from '../src/appearance.mjs';
import {defaultNativePlayerMotion,drawPlayer,directionVector} from '../src/player-motion.mjs';
import {renderLayers} from '../src/render-order.mjs';
test('Approved artwork retains the current native rig and puts skull beneath hair with old saved layer orders',()=>{
 const model=defaultNativePlayerMotion(),before=JSON.stringify(model);
 const c=new Proxy({fillRect(){}},{get:(o,k)=>o[k]??(()=>{})});
 for(let d=0;d<8;d++){
  model.renderOrder={[d]:['Head and headwear','Body and pelvis','Head shape']};
  const source=JSON.stringify(model),[faceX,faceY]=directionVector(d);
  drawPlayer(c,{appearance:{skin:'#d9ab76',shirt:'#39745b',pants:'#665b87',hair:'long',hairColor:'#593923'},equipment:{},faceX,faceY,animationAction:'idle'},0,model);
  assert.equal(JSON.stringify(model),source);
  const order=renderLayers(model,d);assert.ok(order.indexOf('Head shape')<order.indexOf('Head and headwear'));
 }
 assert.equal(model.nativeHumanoidRevision,1);assert.ok(Object.keys(model.clips).length>=42);assert.ok(before.length>100);
});
test('All approved hairstyle drawings have finite contours in every direction',()=>{
 for(const hair of Object.keys(HAIR_STYLES))for(let d=0;d<8;d++){
  const data=hairDrawing(hair,d);assert.ok(data);
  for(const poly of [...data.crown,...data.front,...data.rear])for(const p of poly)assert.ok(p.every(Number.isFinite));
 }
});
