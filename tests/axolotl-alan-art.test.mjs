import test from 'node:test';import assert from 'node:assert/strict';
import {axolotlPose,drawAxolotl,AXOLOTL_RIG} from '../src/axolotl.mjs';
import {FAUNA_SPRITES,hasCustomOlmArt} from '../src/realm-life.mjs';
import {drawAlan,defaultAlanMotion} from '../src/alan-motion.mjs';
import {renderLayers} from '../src/render-order.mjs';
import {directionVector} from '../src/player-motion.mjs';
const pen=()=>new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true}});
test('Approved axolotl uses distance-driven feet, gentle independent idle motion, and preserves painted sprites',()=>{
 assert.equal(AXOLOTL_RIG.views.length,8);const a={moving:true,travelDistance:0},still=axolotlPose(a,0),later=axolotlPose(a,4),walk=axolotlPose({...a,travelDistance:9},4);
 assert.deepEqual(still.foreFootL,later.foreFootL,'Elapsed time alone cannot slide moving feet');assert.notDeepEqual(walk.foreFootL,later.foreFootL);assert.notDeepEqual(still.tailTip,later.tailTip);
 const library=structuredClone(FAUNA_SPRITES);assert.equal(hasCustomOlmArt(library),false);library.olm_body_3=structuredClone(library.olm_body_3);library.olm_body_3.pixels[0]=1;assert.equal(hasCustomOlmArt(library),true);
 for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),p=drawAxolotl(pen(),{...a,faceX,faceY},1);assert.ok(Object.values(p).flat().every(Number.isFinite));}
});
test('Alan cloak follows the body in rear views and stays behind it in front views, including saved bad orders',()=>{
 const model=defaultAlanMotion();model.renderOrder={0:['Body and pelvis','Cape'],4:['Cape','Body and pelvis']};
 for(const d of [0,1,2,3,4,5,6,7]){const [faceX,faceY]=directionVector(d);drawAlan(pen(),{kind:'alan',hp:100,faceX,faceY},1,model);const list=renderLayers(model,d);assert.ok(list.includes('Cape'));assert.equal(list.indexOf('Cape')<list.indexOf('Body and pelvis'),![3,4,5].includes(d));}
});
