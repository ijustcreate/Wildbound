import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemKind } from '../src/items.mjs';
import { fittedGear, fittedShield, gearPalette } from '../src/gear-art.mjs';
import { directionalHelmet } from '../src/wearable-art.mjs';
import { drawPlayer, defaultPlayerMotion, directionVector, poseAt, projectPoint } from '../src/player-motion.mjs';

function raster(draw) {
  const pixels=new Map();
  const c={fillStyle:'',fillRect(x,y,w,h) {
    assert.ok([x,y,w,h].every(Number.isInteger));
    assert.ok(w>0&&h>0);
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle);
  }};
  draw(c);return pixels;
}

test('Every fitted gear piece follows its joint in eight directions without changing item definitions',()=>{
  const before=JSON.stringify(ITEMS);
  for(const [id,def] of Object.entries(ITEMS)) {
    const kind=itemKind(id);
    if(!['hat','gloves','boots','shoulder_armor','shield'].includes(kind))continue;
    for(let d=0;d<8;d++)for(const side of ['L','R']) {
      const draw=(c,anchor)=>kind==='hat'?directionalHelmet(c,id,anchor,d):kind==='shield'?fittedShield(c,id,anchor,d,false):fittedGear(c,id,anchor,d,side);
      const original=raster(c=>draw(c,{x:0,y:0}));
      const moved=raster(c=>draw(c,{x:9,y:-12}));
      assert.ok(original.size>8,id);
      assert.equal(original.size,moved.size,id);
      for(const [key,color] of original) {
        const [x,y]=key.split(',').map(Number);
        assert.equal(moved.get(`${x+9},${y-12}`),color,id);
        assert.ok(Math.abs(x)<=10&&Math.abs(y)<=12,id);
      }
    }
  }
  assert.equal(JSON.stringify(ITEMS),before);
});

test('Dye changes fitted material while retaining the outline and distinct light/shadow ramps',()=>{
  const p=gearPalette('iron_gauntlets','#c04465');
  assert.equal(p.base,'#c04465');
  assert.equal(new Set([p.ink,p.dark,p.base,p.light,p.shine]).size,5);
  const painted=raster(c=>fittedGear(c,'iron_gauntlets',{x:0,y:0},0,'L','#c04465'));
  assert.ok([...painted.values()].includes(p.base));
  assert.ok([...painted.values()].includes(p.ink));
});

test('Every boot cuff stays on the ankle in both side views through idle and running poses',()=>{
  const model=defaultPlayerMotion();
  for(const [id,def] of Object.entries(ITEMS).filter(([,def])=>def.slot==='feet'))
    for(const direction of [2,6])for(const action of ['idle','run'])for(const frame of [0,2,4,6]) {
      const calls=[];
      const c={fillStyle:'',fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle});}};
      const pose=poseAt(model,action,frame),[faceX,faceY]=directionVector(direction);
      drawPlayer(c,{faceX,faceY,equipment:{feet:id},animationAction:action,playerFrame:frame},0,model,pose);
      const height=def.style==='tall'?7:5,light=gearPalette(id).light;
      for(const side of ['L','R']) {
        const foot=projectPoint(pose['foot'+side],direction);
        assert.ok(calls.some(r=>r.x===Math.round(foot.x)-1&&r.y===Math.round(foot.y)-height+1&&r.w===3&&r.h===1&&r.color===light),`${id} ${direction} ${action} ${frame} ${side}`);
      }
      assert.ok(!calls.some(r=>r.color==='#b39874'),'Base shoe highlight must not protrude through equipped boots');
    }
});
