import test from 'node:test';
import assert from 'node:assert/strict';
import {HAIR_RECIPES,FACIAL_HAIR_STYLES,hairShapes,hairPalette,resolveHairDesign,facialHairStyle,drawFacialHair} from '../src/hair-design.mjs';
import {HAIR_STYLES,DEFAULT_APPEARANCE} from '../src/appearance.mjs';
import {defaultSkeletonMotion,upgradeSkeletonToNative,validateSkeletonMotion,SKELETON_KINDS} from '../src/skeleton-motion.mjs';
import {defaultPlayerMotion,defaultNativePlayerMotion} from '../src/player-motion.mjs';
test('every non-bald hairstyle uses the editable native contract in eight views',()=>{
 assert.deepEqual(Object.keys(HAIR_RECIPES).sort(),Object.keys(HAIR_STYLES).filter(id=>id!=='none').sort());
 for(const hair of Object.keys(HAIR_RECIPES))for(let d=0;d<8;d++)for(const action of ['idle','run','death']){
  const shapes=hairShapes({...DEFAULT_APPEARANCE,hair},d,2,action);
  assert.ok(shapes.length);assert.ok(shapes.every(p=>p.points.every(q=>q.every(Number.isFinite))));
  assert.ok(shapes.every(p=>Object.hasOwn(hairPalette(),p.tone)));
 }
 const look={hair:'long',hairDesign:{part:'right',volume:99,length:-2,fringe:'open'}};
 assert.deepEqual(resolveHairDesign(look),{fringe:'open',length:0,volume:2,part:1});
 assert.notDeepEqual(hairShapes({hair:'long'},3),hairShapes({hair:'long'},4));
});
test('the crop silhouette rounds its crown and tucks in at both temples',()=>{
 const crown=hairShapes({hair:'crop'},0).find(part=>part.id==='crown'&&part.tone==='ink');
 const at=y=>Math.max(...crown.points.filter(point=>point[1]===y).map(point=>Math.abs(point[0])));
 assert.ok(at(-1)<at(-3.2));
 assert.ok(crown.points.some(([x,y])=>x<0&&y<-6));
});
test('facial hair is independent of face details, preserves old saves and is hidden from behind',()=>{
 assert.equal(facialHairStyle({face:'beard'}),'fullbeard');assert.equal(facialHairStyle({face:'beard',facialHair:'none'}),'none');
 for(const facialHair of Object.keys(FACIAL_HAIR_STYLES))for(let d=0;d<8;d++){
  let count=0;drawFacialHair({fillRect(...args){assert.ok(args.every(Number.isFinite));count++;}},{x:0,y:0},{face:'freckles',hairColor:'#593923',facialHair},d);
  if(d>=3&&d<=5||facialHair==='none')assert.equal(count,0);else assert.ok(count>0);
 }
});
test('skeletons share the new rest rig and preserve customized rest geometry',()=>{
 const native=defaultNativePlayerMotion();
 for(const kind of SKELETON_KINDS){const m=defaultSkeletonMotion(kind);assert.ok(validateSkeletonMotion(kind,m));if(kind!=='krampus'){assert.deepEqual(Object.keys(m.joints),Object.keys(native.joints));assert.deepEqual(m.joints,native.joints);assert.equal(m.nativeSkeletonRevision,3);}}
 const custom=defaultPlayerMotion();custom.type='skeleton';custom.skeleton=true;custom.joints.head.position[2]+=1;
 assert.equal(upgradeSkeletonToNative(custom),custom);
});
