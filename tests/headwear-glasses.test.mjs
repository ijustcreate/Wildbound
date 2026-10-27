import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS} from '../src/items.mjs';
import {FACE_STYLES,DEFAULT_APPEARANCE} from '../src/appearance.mjs';
import {drawFaceAccessories} from '../src/face-accessories.mjs';
import {drawPlayer,defaultPlayerMotion,directionVector} from '../src/player-motion.mjs';
import {drawResolvedHeadwear,headwearStyle} from '../src/resolved-headwear.mjs';
import {gearPalette} from '../src/gear-art.mjs';
import {Profiles} from '../src/profiles.mjs';
import {coveredHairOpening,hairShapes} from '../src/hair-design.mjs';

test('hood hair continues behind the upper opening, while ordinary hat bands keep their fit',()=>{
 for(const id of ['leather_hood','ranger_hood','banshee_hood','ghost_hood']){
  for(const d of [0,1,2,6,7]){
   const top=Math.min(...coveredHairOpening(ITEMS[id],d).map(([,y])=>y));assert.ok(top< -4,id);
   const fringe=hairShapes({...DEFAULT_APPEARANCE,hair:'crop'},d,0,'idle','front').filter(p=>['crown','fringe'].includes(p.id));
   assert.ok(fringe.some(p=>p.points.some(([,y])=>y>=top&&y< -4)),id+' fills above old clipped hair line');
  }
  assert.deepEqual(coveredHairOpening(ITEMS[id],6),coveredHairOpening(ITEMS[id],2).map(([x,y])=>[-x,y]));
  assert.deepEqual(coveredHairOpening(ITEMS[id],4),[]);
 }
 for(const style of ['helmet','cap','brim'])assert.deepEqual(coveredHairOpening({style}),[],style);
});

test('every head item resolves all eight views with four-region art and stable pivots',()=>{
 const hats=Object.entries(ITEMS).filter(([,v])=>v.slot==='head');assert.equal(hats.length,23);
 for(const [id,def]of hats)for(let d=0;d<8;d++){
  const render=(x,y)=>{const out=[];const c={fillRect(...r){out.push([this.fillStyle,...r]);}};assert.equal(drawResolvedHeadwear(c,{x,y},d,headwearStyle(id,def),gearPalette(id),id),true,id);return out;};
  const a=render(0,0),b=render(11,-8);assert.ok(a.length>8,id);
  assert.deepEqual(b,a.map(([color,x,y,w,h])=>[color,x+11,y-8,w,h]),id);
  assert.ok(new Set(a.map(v=>v[0])).size>=2,id);
 }
});
test('glasses are a face option and persist independently of gear',()=>{
 assert.equal(FACE_STYLES.glasses,'Glasses');
 const p=new Profiles();p.save=()=>{};const hero=p.create('Glasses',{...DEFAULT_APPEARANCE,face:'glasses'}),actor={};p.assign(actor,hero);
 actor.equipment.head='moon_helm';p.capture({players:[actor],sharedStash:[]});assert.equal(hero.appearance.face,'glasses');
});
test('glasses render after every helmet, not as covered skin marks',()=>{
 const model=defaultPlayerMotion();
 for(const id of Object.keys(ITEMS).filter(id=>ITEMS[id].slot==='head'))for(const d of [0,1,2,6,7]){
  const [faceX,faceY]=directionVector(d),calls=[],c={fillStyle:'',fillRect(...r){calls.push([this.fillStyle,...r]);}};
  drawPlayer(c,{hp:100,faceX,faceY,equipment:{head:id},appearance:{...DEFAULT_APPEARANCE,face:'glasses'}},0,model);
  const glint=calls.findIndex(v=>v[0]==='#b8dad8');assert.ok(glint>0,`${id} ${d}`);
  assert.ok(calls.slice(0,glint).some(v=>v[0]===gearPalette(id).ink||v[0]==='#54786e'),id);
 }
});
test('glasses leave rear lenses hidden and classic face unchanged',()=>{
 const p={head:{x:0,y:0},eyeL:{x:-2,y:-1},eyeR:{x:2,y:-1}};
 for(const d of [3,4,5]){const colors=[],c={fillRect(){colors.push(this.fillStyle);}};drawFaceAccessories(c,p,d,{face:'glasses'});assert.ok(!colors.includes('#b8dad8'));if(d===4)assert.equal(colors.length,0);}
 assert.equal(drawFaceAccessories({fillRect(){assert.fail();}},p,0,{face:'scar'}),false);
});
