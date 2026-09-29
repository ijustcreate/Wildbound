import test from 'node:test';
import assert from 'node:assert/strict';
import {corpsePose,drawCorpse} from '../src/corpse-pose.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
test('Corpses settle horizontally regardless of previous facing, movement or jump',()=>{
 for(const kind of ['lion','tiger','skeleton','monkey','wolf','bat'])for(let i=0;i<8;i++){
  const a={kind,faceX:Math.cos(i*Math.PI/4),faceY:Math.sin(i*Math.PI/4),jumpHeight:25,groundHeight:10,moving:true,hp:0};
  const model=rigSubject(kind)?.data,p=corpsePose(a,model);
  assert.equal(p.jumpHeight,0);assert.equal(p.groundHeight,0);assert.equal(p.moving,false);
  assert.ok(p.faceY===0||p.faceX===0);assert.equal(a.jumpHeight,25);
  const clip=model?.clips?.[p.animationAction];assert.equal(p.playerFrame,clip&&p.animationAction!=='idle'?clip.length-1:0);
 }
});
test('Floor projection has no rotation and anchors to the receiving surface',()=>{
 const calls=[],ctx={globalAlpha:1,save(){},restore(){},translate(...v){calls.push(['translate',...v]);},scale(...v){calls.push(['scale',...v]);},rotate(){throw Error('Corpse must not rotate');}};
 drawCorpse(ctx,{deathTimer:2},null,{x:100,y:188},48,()=>{});
 assert.deepEqual(calls,[['translate',100,188],['scale',1.08,.38]]);assert.ok(ctx.globalAlpha<1);
});
