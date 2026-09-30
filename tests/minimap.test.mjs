import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/core.mjs';
const {Renderer}=await import('../src/render.mjs');

function render(players){
 const marks=[];let path;
 const ctx={save(){},restore(){},beginPath(){path=null;},arc(x,y,r){path={kind:'dot',x,y,r};},ellipse(x,y){path={kind:'room',x,y};},fill(){marks.push({...path,color:this.fillStyle});},stroke(){marks.push({...path,stroke:this.strokeStyle});},fillRect(x,y,w,h){marks.push({kind:'rect',x,y,w,h,color:this.fillStyle});},strokeRect(){},fillText(){}};
 const game={players,enemies:[],loot:[],portals:[{x:800,y:800}],explored:new Set(),time:1,ping:{x:800,y:800,until:2,color:'#ff0000'}};
 Renderer.prototype.minimap.call({age:1},ctx,game,400,300);return marks;
}
test('Living heroes draw party-colored minimap dots at their world coordinates',()=>{
 const marks=render([{x:800,y:800,hp:10,color:'#123abc'},{x:0,y:1600,hp:20,color:'#ff8822'}]);
 const dots=marks.filter(m=>m.kind==='dot'&&m.color);
 assert.deepEqual(dots.map(m=>[m.x,m.y,m.color]),[[353.5,202.5,'#123abc'],[321,235,'#ff8822']]);
 assert.ok(dots.every(m=>m.r>=2));
 assert.ok(marks.findIndex(m=>m.stroke==='#ff0000')<marks.findIndex(m=>m.color==='#123abc'));
 assert.equal(marks.at(-1).stroke,'#f0fff3');
});
test('Room and downed markers remain distinct; missing party color has a fallback',()=>{
 const marks=render([{x:100,y:100,hp:0},{x:200,y:200,hp:10,room:'portal'},{x:300,y:300,hp:10}]);
 assert.ok(marks.some(m=>m.kind==='rect'&&m.color==='#ffdda4'));
 assert.ok(marks.some(m=>m.kind==='room'&&m.stroke==='#cc81ff'));
 assert.ok(marks.some(m=>m.kind==='dot'&&m.color==='#75e6c6'));
});
