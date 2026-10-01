import test from 'node:test';
import assert from 'node:assert/strict';
import {drawJungleFern,FERN_SIZE,tickFern} from '../src/fern-art.mjs';
import {BOARD_WELL_CLIP,drawBoardMagic} from '../src/board-magic.mjs';
import {DEFAULT_BOARD_SETTINGS} from '../src/board-settings.mjs';

test('Ferns share eight compact sprites and draw once per visible plant',t=>{
  const original=globalThis.document;
  t.after(()=>{if(original===undefined)delete globalThis.document;else globalThis.document=original;});
  let canvases=0,paint=0,draws=0;
  const context={translate(){},scale(){},fillRect(){paint++;}};
  globalThis.document={createElement(){canvases++;return {getContext:()=>context};}};
  const screen={save(){},restore(){},translate(){},transform(){},drawImage(sprite){assert.equal(sprite.width,32);draws++;}};
  for(let i=0;i<800;i++)drawJungleFern(screen,{x:0,y:0,seed:i},1);
  const firstPaint=paint;
  for(let i=0;i<800;i++)drawJungleFern(screen,{x:0,y:0,seed:i},2);
  assert.equal(canvases,8);assert.equal(draws,1600);assert.equal(paint,firstPaint);assert.equal(FERN_SIZE,32);
});
test('Resting ferns stay asleep and distant walkers do not disturb them',()=>{
  const p={x:0,y:0};tickFern(p,[{x:20,y:0,moving:true,hp:100}],.016);
  assert.equal(p.fernX,0);assert.equal(p.fernVX,0);
});
test('Board well clips all fill rectangles inside the artwork rim',()=>{
  let clipped=false;const points=[];
  const c={save(){},restore(){},beginPath(){},moveTo(x,y){if(!clipped)points.push([x,y]);},lineTo(x,y){if(!clipped)points.push([x,y]);},closePath(){},clip(){clipped=true;},createRadialGradient(){return {addColorStop(){}};},fillRect(){assert.ok(clipped);},stroke(){}};
  drawBoardMagic(c,1,DEFAULT_BOARD_SETTINGS);
  assert.deepEqual(points,BOARD_WELL_CLIP);
  for(const [x,y]of points){assert.ok(x>-23&&x<26);assert.ok(y>-22&&y<18);}
});
