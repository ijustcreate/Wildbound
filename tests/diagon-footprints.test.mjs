import test from 'node:test';
import assert from 'node:assert/strict';
import {DIAGON_FOOTFALL_DISTANCE,drawDiagonFootprints,latestDiagonFootfall,tickDiagonFootprints} from '../src/diagon-footprints.mjs';

function fixture(){
 const p={id:1,x:8000,y:4800,hp:30,moving:false};
 const g={trainTest:{design:{activeRoom:'diagon'},time:0},players:[p]};
 const move=(x=0,y=0,time=.05)=>{
  p.x+=x;p.y+=y;p.moving=!!(x||y);g.trainTest.time+=time;tickDiagonFootprints(g);
 };
 move();return {g,p,move};
}

function paint(g,visible=()=>true){
 const pixels=[];
 const c={save(){},restore(){},fillRect(x,y,w,h){pixels.push({x,y,w,h,alpha:this.globalAlpha});}};
 drawDiagonFootprints(c,g,visible);
 return pixels;
}

test('stone footfalls alternate and use walked distance rather than elapsed time',()=>{
 const {g,p,move}=fixture(),stride=DIAGON_FOOTFALL_DISTANCE;
 move(stride-1);assert.equal(latestDiagonFootfall(g,p),null);
 move(1);const left=latestDiagonFootfall(g,p);assert.equal(left.x,8000+stride);
 move(0,0,1);assert.equal(latestDiagonFootfall(g,p),left);
 move(stride);const right=latestDiagonFootfall(g,p);
 assert.equal(right.x,8000+stride*2);assert.equal(left.y-p.y,-(right.y-p.y));
 assert.ok(right.serial>left.serial);assert.ok(paint(g).length>12);
 assert.equal(paint(g,()=>false).length,0);
 move(0,0,8);assert.equal(paint(g).length,0);
});

test('jumping, flying and Portkeys cannot trace lines through the alley',()=>{
 const {g,p,move}=fixture();
 p.jumpHeight=20;move(45);assert.equal(latestDiagonFootfall(g,p),null);
 p.jumpHeight=0;move(0);
 p.broomMount={item:{type:'flying_broom'}};move(45);assert.equal(latestDiagonFootfall(g,p),null);
 delete p.broomMount;move(0);move(DIAGON_FOOTFALL_DISTANCE);
 assert.ok(paint(g).length>0);
 g.portalTransition={serial:1};move(45);assert.equal(paint(g).length,0);
 move(95);assert.equal(latestDiagonFootfall(g,p),null);
 move(DIAGON_FOOTFALL_DISTANCE);assert.ok(paint(g).length>0);
 g.trainTest.design.activeRoom='quidditch-pitch';move(0);
 g.trainTest.design.activeRoom='diagon';move(45);assert.equal(paint(g).length,0);
 assert.deepEqual(Object.keys(g.trainTest),['design','time']);
});

test('long-running movement stays bounded and split views may cull marks independently',()=>{
 const {g,move}=fixture();
 for(let i=0;i<200;i++)move(30,0,.025);
 const all=paint(g),east=paint(g,x=>x>13800),west=paint(g,x=>x<=13800);
 assert.ok(all.length<=168*20);
 assert.ok(east.length>0&&west.length>0);
 assert.equal(all.length,east.length+west.length);
});
