import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS} from '../src/items.mjs';
import {gearPalette} from '../src/gear-art.mjs';
import {drawResolvedHeadwear,headwearStyle} from '../src/resolved-headwear.mjs';
import {drawGhostEyes} from '../src/ghost-art.mjs';

function raster(id,d){const out=new Map(),c={fillRect(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)out.set(`${xx},${yy}`,this.fillStyle);}};
 drawResolvedHeadwear(c,{x:0,y:0},d,headwearStyle(id,ITEMS[id]),gearPalette(id),id);return out;}
const areaBelow=(pixels,y)=>[...pixels.keys()].filter(k=>Number(k.split(',')[1])>=y).length;

test('annotation: jungle mask becomes a thin plate in profile and exposes only its edge from behind',()=>{
 assert.ok(areaBelow(raster('jungle_mask',2),-2)<areaBelow(raster('jungle_mask',0),-2)*.5);
 assert.ok(areaBelow(raster('jungle_mask',3),-2)<areaBelow(raster('jungle_mask',2),-2));
});
test('annotation: rear hood folds form a V and face openings stay empty',()=>{
 for(const id of ['leather_hood','ranger_hood','banshee_hood','reaper_hood']){
  const rear=raster(id,4),p=gearPalette(id);assert.equal(rear.get('0,-1'),p.dark,id);
  assert.ok(rear.has('0,5'),id); // pointed lower silhouette
  if(id!=='reaper_hood')assert.ok(!raster(id,0).has('0,0'),id);
 }
});
test('annotation: front pumpkin has carved triangular eyes and rear pumpkin has no face',()=>{
 const front=raster('jack_o_lantern',0),back=raster('jack_o_lantern',4),p=gearPalette('jack_o_lantern');
 assert.equal(front.get('-2,-3'),p.ink);assert.notEqual(back.get('-2,-3'),p.ink);
 assert.ok([...front.values()].includes('#ffdc71'));assert.ok(![...back.values()].includes('#ffdc71'));
});
test('annotation: ghost face is dark, eyes are small, and halo leaves hair intact',()=>{
 assert.equal(raster('ghost_hood',0).get('0,0'),'#101a1c');
 assert.notEqual(raster('ghost_hood',4).get('0,0'),'#101a1c');
 assert.equal(ITEMS.halo.coversHair,false);
 const fills=[],p={eyeL:{x:-2,y:0},eyeR:{x:2,y:0}},c={fillRect(...r){fills.push([this.fillStyle,...r]);}};
 drawGhostEyes(c,p,0,0,{hp:100});assert.ok(fills.every(([,x,y,w,h])=>w<=1&&h<=2));
 assert.ok(fills.some(([color])=>color==='#ffffff'));
});
test('annotation: horn roots turn between front and profile instead of deleting the far horn',()=>{
 for(const id of ['imp_horns','succubus_horns']){
  const front=raster(id,0),profile=raster(id,2);assert.notDeepEqual(front,profile);
  const xs=[...profile.keys()].map(k=>Number(k.split(',')[0]));assert.ok(Math.max(...xs)-Math.min(...xs)>=4,id);
  assert.ok(front.size>profile.size,id);
 }
});
test('succubus horns join the forehead below the hair crown in all eight views',()=>{
 for(let d=0;d<8;d++){
  const pixels=raster('succubus_horns',d),ys=[...pixels.keys()].map(k=>Number(k.split(',')[1]));
  assert.ok(Math.max(...ys)>=-4,'Brow root is connected in view '+d);
  assert.ok(Math.min(...ys)>=-11,'Horns do not float above the crown in view '+d);
 }
});
