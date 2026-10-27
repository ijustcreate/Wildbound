import {Game} from './core.mjs';
import {createHouseWorld} from './house-worlds.mjs';
self.onmessage=({data})=>{try{self.postMessage(createHouseWorld(Game,data));}catch(error){self.postMessage({error:String(error.stack||error)});}};
