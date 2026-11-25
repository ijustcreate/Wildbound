import test from 'node:test';
import assert from 'node:assert/strict';
import {corpsePose,corpseCleanupProgress,drawCorpse,drawCorpseCleanup} from '../src/corpse-pose.mjs';
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

test('Cleanup holds the body, releases floor-level pixels, then leaves no silhouette',()=>{
 const actor={id:12,hp:0,corpseCleanup:true,deathTimer:.5};
 const contact={x:100,y:188};
 const pixels=[],bodyOpacities=[];
 const ctx={globalAlpha:.8,save(){this.savedAlpha=this.globalAlpha;},restore(){this.globalAlpha=this.savedAlpha;},
  fillRect(x,y,w,h){pixels.push({x,y,w,h,alpha:this.globalAlpha});}};
 const draw=()=>drawCorpseCleanup(ctx,actor,contact,48,()=>bodyOpacities.push(ctx.globalAlpha));

 assert.equal(corpseCleanupProgress(actor),0);
 draw();
 assert.deepEqual(bodyOpacities,[.8]);
 assert.equal(pixels.length,0);

 actor.deathTimer=.94;
 draw();
 assert.ok(bodyOpacities[1]>0&&bodyOpacities[1]<.8);
 assert.ok(pixels.length>0&&pixels.every(p=>Math.abs(p.x-contact.x)<25&&Math.abs(p.y-contact.y)<25&&p.alpha>0));
 assert.equal(ctx.globalAlpha,.8);

 actor.deathTimer=1.15;
 draw();
 assert.equal(bodyOpacities.length,2);
 const releasedPixels=pixels.length;

 actor.deathTimer=1.3;
 draw();
 assert.equal(bodyOpacities.length,2);
 assert.equal(pixels.length,releasedPixels);
});

test('The cleanup renderer leaves unmarked actors and living bodies alone',()=>{
 const ctx={globalAlpha:1};
 let draws=0;
 for(const actor of [{hp:0,deathTimer:2},{hp:12,deathTimer:2,corpseCleanup:true}]){
  assert.equal(corpseCleanupProgress(actor),null);
  drawCorpseCleanup(ctx,actor,{x:0,y:0},48,()=>draws++);
 }
 assert.equal(draws,2);
});
