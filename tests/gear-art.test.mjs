import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemKind } from '../src/items.mjs';
import { fittedGear, fittedShield, gearPalette, bootFrame, withBootPose } from '../src/gear-art.mjs';
import { directionalHelmet } from '../src/wearable-art.mjs';
import { renderLayers } from '../src/render-order.mjs';
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

test('Shields turn edge-on in profile and show different rear straps',()=>{
 const front=raster(c=>fittedShield(c,'shield',{x:0,y:0},0,false));
 const rear=raster(c=>fittedShield(c,'shield',{x:0,y:0},4,false));
 const profile=raster(c=>fittedShield(c,'shield',{x:0,y:0},2,false));
 assert.notDeepEqual(front,rear);
 assert.ok(profile.size<front.size*.6);
 assert.ok([...profile.keys()].every(k=>Math.abs(Number(k.split(',')[0]))<=1));
});

test('Held items depth-sort independently of arms and relics are not worn in all eight views',()=>{
 const model=defaultPlayerMotion(),pose=poseAt(model,'idle',0);
 const relic=Object.keys(ITEMS).find(id=>ITEMS[id].relic);
 for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d);
  drawPlayer({fillStyle:'',fillRect(){}},{faceX,faceY,equipment:{hand1:'wand',hand2:'shield'},inventory:[{type:relic}]},0,model,pose);
  const layers=renderLayers(model,d),body=layers.indexOf('Body and pelvis');
  for(const side of ['L','R']){
   const depth=projectPoint(pose['hand'+side],d).depth+.6;
   assert.equal(layers.indexOf('Held item '+side)>body,depth>projectPoint(pose.chest,d).depth);
  }
  assert.ok(!layers.some(id=>id.includes('relic')));
  const paint=inventory=>{const pixels=[];drawPlayer({fillStyle:'',fillRect(...args){pixels.push([this.fillStyle,...args]);}},{faceX,faceY,equipment:{},inventory},0,model,pose);return pixels;};
  assert.deepEqual(paint([{type:relic}]),paint([]));
 }
});

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

test('Gloves have a readable cuff, palm and finger highlights around the hand anchor',()=>{
  const painted=raster(c=>fittedGear(c,'iron_gauntlets',{x:0,y:0},0,'R'));
  assert.ok(painted.size>=24&&painted.size<=40);
  assert.ok([...painted.values()].includes(gearPalette('iron_gauntlets').trim));
  assert.ok([...painted.keys()].some(key=>Number(key.split(',')[1])<=-2));
});

test('Boot soles extend from the ankle with a directional toe instead of a floating patch',()=>{
  for(const direction of [0,2,6])for(const side of ['L','R']) {
    const painted=raster(c=>fittedGear(c,'boots',{x:0,y:0},direction,side));
    assert.ok(painted.size>=35);
    assert.ok([...painted.keys()].some(key=>Number(key.split(',')[1])>=2));
  }
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
        const foot=projectPoint(pose['foot'+side],direction),knee=projectPoint(pose['knee'+side],direction);
        const {cos,sin}=bootFrame(foot,knee),y=-height+1.5;
        const cx=Math.round(foot.x)+.5*cos-y*sin,cy=Math.round(foot.y)+.5*sin+y*cos;
        assert.ok(calls.some(r=>r.color===light&&Math.hypot(r.x+r.w/2-cx,r.y+r.h/2-cy)<2),`${id} ${direction} ${action} ${frame} ${side}`);
      }
      assert.ok(!calls.some(r=>r.color==='#b39874'),'Base shoe highlight must not protrude through equipped boots');
    }
});

test('Boot frame follows both leaning shins and safely handles collapsed joints',()=>{
 const ankle={x:0,y:0};
 for(const knee of [{x:-6,y:-8},{x:6,y:-8},{x:8,y:0}]){
  const {cos,sin}=bootFrame(ankle,knee),length=Math.hypot(knee.x,knee.y);
  assert.ok(Math.abs(sin*length-knee.x)<1e-8);
  assert.ok(Math.abs(-cos*length-knee.y)<1e-8);
 }
 assert.deepEqual(bootFrame(ankle,ankle),{cos:1,sin:0});
 const straight=raster(c=>withBootPose(c,ankle,{x:0,y:-10},()=>fittedGear(c,'boots',ankle,2,'L')));
 const bent=raster(c=>withBootPose(c,ankle,{x:6,y:-8},()=>fittedGear(c,'boots',ankle,2,'L')));
 assert.notDeepEqual(bent,straight);
});
