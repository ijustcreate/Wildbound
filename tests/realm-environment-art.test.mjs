import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {REALMS} from '../src/realm-world.mjs';
import {boardArtBiome} from '../src/board-art.mjs';

test('all three added realms keep their identity on the Wildbound board',()=>{
 for(const realm of REALMS)assert.equal(boardArtBiome({generatedEnvironment:realm,environment:'forest'}),realm);
});

test('new realm selection and inventory paintings are shipped and wired to their map',()=>{
 const css=readFileSync(new URL('../src/inventory-workbench.css',import.meta.url),'utf8');
 const lobby=readFileSync(new URL('../src/playable-lobby.mjs',import.meta.url),'utf8');
 assert.ok(lobby.includes('`../assets/inventory-environment-${env}-v1.png`')&&lobby.includes('realmMapArt'),'map icons load each matching realm painting');
 for(const realm of REALMS){
  const file=new URL(`../assets/inventory-environment-${realm}-v1.png`,import.meta.url);
  assert.ok(existsSync(file),realm+' painting exists');
  const png=PNG.sync.read(readFileSync(file));
  assert.ok(png.width>=1024&&png.height>=1024,realm+' painting retains usable detail');
  assert.ok(css.includes(`data-environment="${realm}"`)&&css.includes(`inventory-environment-${realm}-v1.png`),realm+' inventory uses its painting');
 }
});
