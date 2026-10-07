import test from 'node:test';
import assert from 'node:assert/strict';
import {LOBBY_PROP_ART_BOUNDS,drawLobbyMapTable,drawLobbyDifficultyTotem,drawLobbyDiceTray,drawLobbyExplorerStation} from '../src/lobby-prop-art.mjs';
import {LOBBY_OBJECTS,LobbyState} from '../src/playable-lobby.mjs';
import {LOBBY_FURNITURE,LOBBY_FIXTURES} from '../src/lobby-practice.mjs';

// Integer-pixel probe rejects scaled textures/paths and records final painted pixels.
class PixelProbe {
  constructor() { this.fillStyle='original';this.imageSmoothingEnabled=true;this.tx=0;this.ty=0;this.stack=[];this.calls=[];this.painted=new Map(); }
  save() { this.stack.push([this.fillStyle,this.imageSmoothingEnabled,this.tx,this.ty]); }
  restore() { [this.fillStyle,this.imageSmoothingEnabled,this.tx,this.ty]=this.stack.pop(); }
  translate(x,y) { this.tx+=x;this.ty+=y; }
  fillRect(x,y,w,h) {
    assert.ok([x,y,w,h,this.tx,this.ty].every(Number.isInteger),'Paint stays on the native pixel grid');
    assert.ok(w>0&&h>0);assert.equal(this.imageSmoothingEnabled,false);
    x+=this.tx;y+=this.ty;this.calls.push({x,y,w,h,color:this.fillStyle});
    for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)this.painted.set(px+','+py,this.fillStyle);
  }
  pixel(x,y) { return this.painted.get(x+','+y); }
  signature() { return JSON.stringify([...this.painted]); }
}

function render(draw,value,anchor={x:0,y:0}) { const c=new PixelProbe();draw(c,anchor,value);return c; }

const drawers={environment:drawLobbyMapTable,difficulty:drawLobbyDifficultyTotem,'dice-count':drawLobbyDiceTray,'character-station':drawLobbyExplorerStation};

test('All lobby prop pixels fit their footprints/overhead badge and stop before caption space',()=>{
  for(const [id,draw]of Object.entries(drawers)){
    const o=LOBBY_OBJECTS.find(q=>q.id===id),b=LOBBY_PROP_ART_BOUNDS[id],c=render(draw,undefined,o);
    for(const r of c.calls){
      assert.ok(r.x>=o.x+b.x&&r.y>=o.y+b.y&&r.x+r.w<=o.x+b.x+b.w&&r.y+r.h<=o.y+b.y+b.h,id+' paint outside bounds');
      assert.ok(r.y+r.h<=o.y+30,id+' encroaches on interaction captions');
    }
    assert.equal(c.stack.length,0);assert.equal(c.fillStyle,'original');assert.equal(c.imageSmoothingEnabled,true);
    assert.equal(c.tx,0);assert.equal(c.ty,0);
  }
});

test('Shared fixtures retain real interaction anchors, including the shifted-right totem',()=>{
  assert.deepEqual(LOBBY_OBJECTS.find(q=>q.id==='difficulty'),{id:'difficulty',name:'Difficulty totem',x:955,y:165});
  const lobby=new LobbyState(),p={id:1};lobby.sync([p]);const member=lobby.members.get(p.id);member.spawned=true;
  for(const id of Object.keys(drawers)){
    const o=LOBBY_OBJECTS.find(q=>q.id===id),fixture=[...LOBBY_FIXTURES,...LOBBY_FURNITURE].find(q=>q.id===id);
    assert.ok(o.x>=fixture.x&&o.x<=fixture.x+fixture.w&&o.y>=fixture.y&&o.y<=fixture.y+fixture.h);
    Object.assign(member,{x:o.x,y:o.y});assert.equal(lobby.nearest(p),o);
    const art=LOBBY_PROP_ART_BOUNDS[id];
    if(id!=='difficulty'){assert.equal(art.x,fixture.x-o.x);assert.equal(art.w,fixture.w);}
  }
});

test('Map parchment distinguishes all seven terrains while retaining survey route and compass',()=>{
  const maps=['random','forest','desert','ice','house','temple','beach'];
  const signatures=maps.map(value=>{
    const c=render(drawLobbyMapTable,value);
    const colors=new Set([...c.painted].filter(([key])=>{const [x,y]=key.split(',').map(Number);return x>-26&&x<24&&y>-26&&y<-7;}).map(([,color])=>color));
    assert.ok(colors.size>=6,value+' chart lacks survey detail');
    assert.ok([...c.painted.values()].includes('#922e32'),value+' destination marker missing');
    return c.signature();
  });
  assert.equal(new Set(signatures).size,7);
  assert.equal(render(drawLobbyMapTable,'unknown').signature(),render(drawLobbyMapTable,'random').signature());
});

test('One/two-die selection paints the correct number of separated ivory dice over felt',()=>{
  const ivory=new Set(['#f6edcf','#fff6dc','#e5d6b4','#d2c3a1','#aa9570','#b9a47e']);
  function countDice(c){
    const remaining=new Set([...c.painted].filter(([,color])=>ivory.has(color)).map(([key])=>key));
    let count=0;
    while(remaining.size){
      const next=[remaining.values().next().value];remaining.delete(next[0]);let area=0;
      while(next.length){const [x,y]=next.pop().split(',').map(Number);area++;
        for(const key of [(x-1)+','+y,(x+1)+','+y,x+','+(y-1),x+','+(y+1)])if(remaining.delete(key))next.push(key);}
      if(area>100)count++;
    }
    return count;
  }
  for(const count of [1,2,'1','2']){
    const c=render(drawLobbyDiceTray,count);assert.equal(countDice(c),Number(count));
    assert.ok([...c.painted.values()].includes('#3e735b'),'Visible green felt missing');
  }
  assert.equal(countDice(render(drawLobbyDiceTray,'unknown')),2);
});

test('Carved totem sockets indicate one, two and three difficulty tiers without text',()=>{
  const signatures=[];
  for(const [i,value]of ['gentle','adventure','wild'].entries()){
    const c=render(drawLobbyDifficultyTotem,value),light=c.pixel(-11,-46);
    const sockets=[-11,-2,7].filter(x=>c.pixel(x,-8)===light);
    assert.equal(sockets.length,i+1);signatures.push(c.signature());
  }
  assert.equal(new Set(signatures).size,3);
  assert.equal(render(drawLobbyDifficultyTotem,'unknown').signature(),render(drawLobbyDifficultyTotem,'adventure').signature());
});

test('Native art is deterministic, restores caller state, and handles fractional anchors uniformly',()=>{
  for(const draw of Object.values(drawers)){
    assert.equal(render(draw).signature(),render(draw).signature());
    assert.equal(render(draw,undefined,{x:40.3,y:50.7}).signature(),render(draw,undefined,{x:40,y:51}).signature());
    const c=new PixelProbe();c.fillRect=()=>{throw Error('probe failure');};
    assert.throws(()=>draw(c,{x:40,y:51}),/probe failure/);
    assert.equal(c.fillStyle,'original');assert.equal(c.imageSmoothingEnabled,true);assert.equal(c.stack.length,0);
  }
});
