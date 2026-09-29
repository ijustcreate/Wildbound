import test from 'node:test';
import assert from 'node:assert/strict';
import {structureBlocked} from '../src/expansion.mjs';
import {navigateEnemy} from '../src/navigation.mjs';
import {tickJump} from '../src/jumping.mjs';
import {creatures} from '../src/definitions.mjs';
test('Broken windows allow jumps above the sill in both wall orientations, never intact glass',()=>{
 for(const rect of [{x:300,y:300,w:64,h:16},{x:300,y:300,w:16,h:64}]){
  const pane={...rect,kind:'window',broken:true},g={house:{walls:[pane],doors:[],furniture:[]}};
  const x=rect.x+rect.w/2,y=rect.y+rect.h/2;
  assert.equal(structureBlocked(g,x,y,8,false,0,0),true);
  assert.equal(structureBlocked(g,x,y,8,false,0,9),true);
  assert.equal(structureBlocked(g,x,y,8,false,0,12),false);
  pane.broken=false;assert.equal(structureBlocked(g,x,y,8,false,0,30),true);
  pane.kind='wall';pane.broken=true;assert.equal(structureBlocked(g,x,y,8,false,0,30),true);
 }
});

test('Jump-capable enemy routes through a broken window in both directions',()=>{
 const old=creatures.monkey.behaviors.jump;creatures.monkey.behaviors.jump=true;
 try{for(const reverse of [false,true]){
  const e={kind:'monkey',hp:100,x:reverse?480:336,y:368,speed:110,state:'hunt'};
  const target={x:reverse?336:480,y:368};
  const g={time:0,traps:[],house:{walls:[{kind:'wall',x:400,y:0,w:16,h:320},{kind:'window',broken:true,x:400,y:320,w:16,h:96},{kind:'wall',x:400,y:416,w:16,h:1184}],doors:[],furniture:[]}};
  g.blocked=(x,y,r,flying,_water,doors,offset,elevation)=>structureBlocked(g,x,y,r,doors,offset,elevation);
  g.moveActor=(a,dx,dy)=>{if(g.blocked(a.x+dx,a.y+dy,8,false,false,false,0,(a.jumpHeight||0)+(a.groundHeight||0)))return 0;a.x+=dx;a.y+=dy;return Math.hypot(dx,dy);};
  let jumped=false;
  for(let i=0;i<250;i++){g.time+=.02;tickJump(e,.02,g);navigateEnemy(g,e,target,.02);jumped||=e.jumpHeight>0;}
  assert.ok(jumped);assert.ok(Math.abs(e.x-target.x)<20,JSON.stringify(e));
 }}finally{creatures.monkey.behaviors.jump=old;}
});
