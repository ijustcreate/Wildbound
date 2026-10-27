import test from 'node:test';
import assert from 'node:assert/strict';
import {GrassWake,vegetationWind,vegetationWindStrength,leafClusterMotion} from '../src/vegetation-motion.mjs';
import {fernAccentGroup} from '../src/fern-art.mjs';
import {boardLightVolumes,BOARD_TABLE} from '../src/board-table-geometry.mjs';
import {groundShadowPolygon} from '../src/world-lighting.mjs';
import {pointLightVisibility} from '../src/realtime-shadows.mjs';
import {createForestUnderstory,FOREST_PROP_ASSETS} from '../src/forest-props.mjs';
import {drawProp} from '../src/environment.mjs';

test('grass wake persists behind a grounded walker, fades, and never mutates actor data',()=>{
 const wake=new GrassWake(),p={id:1,x:100,y:100,hp:10,moving:true};const before=structuredClone(p);
 wake.update([p],0);assert.deepEqual(p,before);
 p.x=130;wake.update([p],.25);p.moving=false;p.x=300;wake.update([p],.5);
 const energy=()=>wake.raster(0,0,512).reduce((n,v,i)=>n+(i%4===0?v:0),0),fresh=energy();assert.ok(fresh>0);
 wake.update([p],2);assert.ok(energy()>0&&energy()<fresh,'the path recovers gradually after departure');
 wake.update([p],4.6);assert.equal(energy(),0);
});
test('wake storage is bounded, teleports do not draw connecting scars, and airborne actors leave no trail',()=>{
 const wake=new GrassWake(),p={id:1,x:0,y:0,hp:10,moving:true};
 for(let i=0;i<1000;i++){p.x=i*5;wake.update([p],i*.001);}assert.ok(wake.points.length<=256);
 const n=wake.points.length;p.x=10000;wake.update([p],1.1);assert.equal(wake.points.length,Math.min(256,n+1));assert.ok(!wake.points.some(p=>p.x>5000&&p.x<10000));
 p.jumpHeight=10;p.x=10100;wake.update([p],1.2);assert.ok(!wake.points.some(p=>p.x===10100));
 const revision=wake.revision;wake.update([p],1.2);assert.equal(wake.revision,revision,'second layer sampling does not advance history');
});
test('shared breeze is stepped and storm strength eases up and down',()=>{
 assert.equal(vegetationWind(100,200,1.001),vegetationWind(100,200,1.01));
 const g={weather:{type:'thunderstorm',duration:45,life:45,intensity:1}};assert.equal(vegetationWindStrength(g),1);
 g.weather.life=40;assert.ok(vegetationWindStrength(g)>3);g.weather.life=.5;assert.ok(vegetationWindStrength(g)<2);
 assert.equal(vegetationWindStrength({}),1);
});

test('leaf fans rustle independently on the artwork grid and storms increase motion within bounds',()=>{
 const calm=[],storm=[];
 for(let t=0;t<8;t+=.1){
  const a=leafClusterMotion(-300,270,t,0),b=leafClusterMotion(-300,270,t,1),s=leafClusterMotion(-300,270,t,0,4);
  calm.push(a);storm.push(s);assert.equal(Math.abs(a.x)%2,0);assert.equal(Math.abs(a.y)%2,0);
  assert.ok(Math.abs(s.x)<=10&&Math.abs(s.y)<=6);
  if(t===0)assert.deepEqual(a,leafClusterMotion(-300,270,.01,0));
 }
 assert.ok(new Set(calm.map(a=>JSON.stringify(a))).size>=4);
 assert.ok(calm.some((a,i)=>JSON.stringify(a)!==JSON.stringify(leafClusterMotion(-300,270,i*.1,1))));
 assert.ok(storm.reduce((n,a)=>n+Math.abs(a.x)+Math.abs(a.y),0)>calm.reduce((n,a)=>n+Math.abs(a.x)+Math.abs(a.y),0));
});
test('decorative fern groups keep plant silhouettes apart and reuse their selection',()=>{
 const cover=[];for(let y=0;y<300;y+=18)for(let x=0;x<300;x+=18)cover.push({kind:'fern',x,y,seed:x+y});
 const group=fernAccentGroup(cover);assert.ok(group.size>5&&group.size<cover.length*.2);assert.equal(fernAccentGroup(cover),group);
 for(const a of group)for(const b of group)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=40);
});
test('high table light projects downward onto the floor and legs block low rays through the open underside',()=>{
 const b=BOARD_TABLE,volumes=boardLightVolumes(b),top=volumes[0];
 const low={x:b.x+b.w/2,y:b.y-40,height:30,radius:280},high={...low,height:70};
 const extent=s=>Math.max(...groundShadowPolygon(s,top).map(p=>p[1]));
 assert.ok(extent(low)>b.y+b.h);assert.ok(extent(high)<extent(low),'a higher light makes a shorter ground projection');
 const side={x:b.x-30,y:b.y+b.h-1,height:10,radius:280},point={x:b.x+20,y:side.y,z:0};
 assert.equal(pointLightVisibility({volumes:[top]},side,point),1,'light can pass beneath the tabletop');
 assert.equal(pointLightVisibility({volumes},side,point),0,'the actual front leg still casts a shadow');
});

test('named woodland props scatter deterministically across signed regions and honor placement exclusions',()=>{
 const allowed=(x,y)=>x< -2400&&y>1700;
 const a=createForestUnderstory(42,-2,1,allowed),b=createForestUnderstory(42,-2,1,allowed);
 assert.deepEqual(a,b);assert.ok(a.length>5&&a.length<80);assert.equal(new Set(a.map(p=>p.id)).size,a.length);
 for(const p of a){assert.ok(FOREST_PROP_ASSETS[p.forestAsset]);assert.ok(p.x>=-3200&&p.x< -1600&&p.y>=1600&&p.y<3200);assert.ok(allowed(p.x,p.y));assert.equal(p.rootY,p.y);}
 assert.deepEqual(createForestUnderstory(42,0,0,()=>false),[]);
});

test('live terrain masks hide understory after a Boundless entrance replaces its grass tile',()=>{
 const g={seed:42,environment:'forest',terrain:Array(2500).fill('grass'),forestLandscape:{routeField:new Float32Array(10000).fill(200)}};
 const p={kind:'forest_understory',forestAsset:'forest_porcini_pair',x:500,y:500,rootY:500,size:48};
 g.terrain[Math.floor(p.y/32)*50+Math.floor(p.x/32)]='path';
 assert.equal(drawProp({},p,0,g),true,'the live paving mask consumes the decorative draw without touching the canvas');
});
