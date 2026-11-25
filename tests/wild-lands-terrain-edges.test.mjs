import test from 'node:test';
import assert from 'node:assert/strict';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {wildLandsGround,wildLandsSurface,wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {nativeWildBiome,nativeWildProps} from '../src/wild-native-biomes.mjs';
import {nativeWaterRuns} from '../src/wild-lands-art.mjs';
import {wildOceanAt} from '../src/wild-water-art.mjs';
import {wildLandsPathAt} from '../src/wild-lands-geography.mjs';
import {buildTrainRoute} from '../src/train-track.mjs';
import {CASTLE_OUTER_BANK,castleOuterBankPoint,castleSurface} from '../src/wild-castle-site.mjs';

test('Wilds markup fills the coastal forest, cemetery edge, and exterior snow around the Overlook',()=>{
 const design=wildLandsDesign();
 const markedGround=[
  [2000,3650,'forest'],[4864,8263,'forest'],[9845,8413,'forest'],
  [2188,6828,'graveyard'],[7375,4810,'ice'],[9000,5500,'ice'],
 ];
 for(const [x,y,biome]of markedGround){
  assert.equal(wildLandsSurfaceAt(design,x,y),'grass',`dry ground at ${x}, ${y}`);
  assert.equal(wildLandsGround(design,x,y),biome);
  assert.equal(nativeWildBiome(design,x,y),biome);
 }
 assert.equal(wildLandsGround(design,8200,6200),'house','the southern maze remains the Overlook');
 assert.equal(wildLandsGround(design,1150,4425),'beach','the open West Beach shore remains sandy');
});

test('The east woodland surrounds a sandy freshwater lake and populates beyond the old map width',()=>{
 const design=wildLandsDesign();
 const t={design,route:buildTrainRoute(design),streamDisabled:true};
 const water=[15580,5680];
 assert.equal(wildLandsSurface(design,...water),'water');
 assert.equal(wildLandsSurfaceAt(design,...water),'water');
 assert.equal(wildOceanAt(...water),false);
 assert.equal(wildLandsSurfaceAt(design,17070,3660),'water','the original Tideglass lagoon stays wet');
 for(const [x,y]of [[15100,5620],[15570,5935]]){
  assert.equal(wildLandsGround(design,x,y),'beach');
  assert.equal(wildLandsSurfaceAt(design,x,y),'grass');
 }
 for(const [x,y]of [[14930,5700],[15480,5000],[16130,5680]]){
  assert.equal(wildLandsGround(design,x,y),'forest');
  assert.equal(wildLandsSurfaceAt(design,x,y),'grass');
 }
 const bounds={left:14500,top:4900,right:16350,bottom:6300};
 const trees=nativeWildProps(t,bounds).filter(prop=>prop.x>16000&&prop.kind==='tree'&&prop._biome==='forest');
 assert.ok(trees.length>0,'native forest fills the extended east chunk');
 assert.ok(trees.every(prop=>wildLandsSurfaceAt(design,prop.x,prop.rootY)==='grass'));
 for(const [x,y]of [[15020,4795],[15520,4928],[15960,4800]]){
  assert.equal(wildLandsSurfaceAt(design,x,y),'grass');
  assert.ok(wildLandsPathAt(x,y),'the existing Tideglass approach remains visible through the woods');
 }

 const tile=nativeWaterRuns(design,15552,5664);
 assert.equal(tile.wet.reduce((area,[,,w,h])=>area+w*h,0),32*32);
 assert.ok(!tile.shallow.length);
 const mask=[5280,5312,5344,5376].map(y=>nativeWaterRuns(design,15328,y));
 assert.ok(mask.some(entry=>entry.shallow.length&&entry.shore.length),'the lake has a waterline and shallows in its native pixel mask');
});

test('Greyhaven’s outer cliff lip agrees with the native water mask around every inlet',()=>{
 const design=wildLandsDesign(),tiles=new Map();
 function wetAt(x,y){
  const tx=Math.floor(x/32)*32,ty=Math.floor(y/32)*32,key=`${tx}:${ty}`;
  if(!tiles.has(key))tiles.set(key,nativeWaterRuns(design,tx,ty));
  return tiles.get(key).wet.some(([left,top,w,h])=>x>=left&&x<left+w&&y>=top&&y<top+h);
 }
 for(let i=0;i<CASTLE_OUTER_BANK.length;i++){
  const dry=castleOuterBankPoint(i,.5,7),wet=castleOuterBankPoint(i,.5,-7);
  assert.equal(castleSurface(dry.x,dry.y),null,`land above edge ${i}`);
  assert.equal(castleSurface(wet.x,wet.y),'water',`water below edge ${i}`);
  assert.equal(wildLandsSurfaceAt(design,dry.x,dry.y),'grass',`dry terrain above edge ${i}`);
  assert.equal(wetAt(dry.x,dry.y),false,`dry mask above edge ${i}`);
  assert.equal(wetAt(wet.x,wet.y),true,`wet mask below edge ${i}`);
 }
});
