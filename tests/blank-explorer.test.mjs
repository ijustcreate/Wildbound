import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,rollGear,equip,socketCount} from '../src/items.mjs';
import {victoryRewards} from '../src/victory-chest.mjs';
import {spawnDebugItem} from '../src/game-debug.mjs';
import {Game} from '../src/core.mjs';
import {BLANK_EXPLORER_ITEM,blankExplorerPreview,drawBlankExplorerFace} from '../src/blank-explorer.mjs';
test('blank costume is real zero-stat gear obtainable through the existing dev console',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard');g.persist=()=>{};p.inventory=[];
 const item=ITEMS[BLANK_EXPLORER_ITEM];assert.equal(item.devOnly,true);assert.equal(item.supplyOnly,true);assert.equal(item.armor,0);assert.equal(socketCount(BLANK_EXPLORER_ITEM),0);
 assert.equal(spawnDebugItem(g,p.id,BLANK_EXPLORER_ITEM,1).ok,true);assert.equal(equip(p,0,'chest'),true);assert.equal(p.equipment.chest,BLANK_EXPLORER_ITEM);
});
test('ordinary gear and earned/unearned victory rewards never generate the menu costume',()=>{
 for(const tier of ['common','rare','unique','legendary'])for(let n=0;n<256;n++)assert.notEqual(rollGear(()=>n/256,tier),BLANK_EXPLORER_ITEM);
 for(let n=0;n<64;n++)for(const earned of [null,{score:24,cleared:12,skipped:0}])assert.ok(victoryRewards([{level:1},{level:12}],()=>n/64,earned).every(i=>i.type!==BLANK_EXPLORER_ITEM));
});
test('placeholder previews are isolated records and their question mark disappears behind the head',()=>{
 const a=blankExplorerPreview(),b=blankExplorerPreview();a.appearance.skin='#ff0000';assert.notEqual(a.appearance.skin,b.appearance.skin);assert.equal(b.equipment.chest,BLANK_EXPLORER_ITEM);
 for(let d=0;d<8;d++){const marks=[];drawBlankExplorerFace({fillRect(...r){marks.push(r);}}, {x:0,y:0}, d);assert.equal(marks.length>0,!(d>=3&&d<=5));}
});
