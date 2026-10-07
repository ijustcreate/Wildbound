import {applyDefinitions} from './src/definitions.mjs';
import {registerCryptGearArt} from './src/crypt-gear.mjs';

async function readJson(url){
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error('The current character artwork could not be loaded. Please refresh.');
 return response.json();
}
export async function prepareRuntime(assets){
 const [rigs,snapshot]=await Promise.all([readJson('./authored/rigs.json'),readJson('./snapshot.json'),assets.load()]);
 applyDefinitions(rigs,[],{},{spriteOverrides:false});
 registerCryptGearArt();
 for(const label of document.querySelectorAll('[data-game-version]'))label.textContent=`Game ${snapshot.version}`;
 return snapshot;
}
