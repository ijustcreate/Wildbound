import butterfly from '../assets/pixel-recipes/diagon-alley/moonvein-butterfly.pixel.json' with {type:'json'};
import rat from '../assets/pixel-recipes/diagon-alley/gloamwhisker-rat.pixel.json' with {type:'json'};
import spider from '../assets/pixel-recipes/diagon-alley/cobble-jumper.pixel.json' with {type:'json'};
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {visitDiagonCritters} from './diagon-critters.mjs';

const sources={moonvein_butterfly:butterfly,gloamwhisker_rat:rat,cobble_jumper:spider};
const compiled=new Map();
const paint=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
function recipe(kind){
 if(!compiled.has(kind))compiled.set(kind,compilePixelRecipe(sources[kind]));
 return compiled.get(kind);
}

function drawCritter(c,a,time){
 const {x,y}=a,air=a.kind==='moonvein_butterfly',lift=a.altitude||0;
 c.save();c.translate(Math.round(x),Math.round(y));
 paint(c,air?-4:-7,0,air?9:15,2,air?'#253b3c40':'#1e293b77');
 c.translate(0,-Math.round(lift));
 if(!air&&a.faceX<0)c.scale(-1,1);
 const clock=a.moving?(time+a.phase)*1000:air?137:0;
 drawPixelRecipe(c,recipe(a.kind),clock);
 if(air&&a.moving&&Math.sin(time*8+a.phase)>.6)paint(c,7,0,1,1,'#b0dfce8a');
 c.restore();
}

export function queueDiagonCritters(c,g,visible,objects){
 visitDiagonCritters(g,animal=>{
  if(!visible(animal.x,animal.y,18,38))return;
  if(animal.kind==='gloamwhisker_rat')objects.push({depth:animal.y,
   paint:()=>paint(c,Math.round(animal.x)-4,Math.round(animal.y)+1,9,1,'#22263160'),
   player:{...animal,sprite:animal.kind,hp:1},size:48});
  else objects.push({depth:animal.y,paint:()=>drawCritter(c,animal,g.time)});
 });
}

export function paintDiagonCritterIcon(c,type){
 const kind=type?.startsWith('caught_')&&type.slice(7);
 if(!kind||!Object.hasOwn(sources,kind))return false;
 const cage=kind==='gloamwhisker_rat';
 if(cage){
  paint(c,3,9,18,12,'#322f33');paint(c,5,6,14,4,'#554747');paint(c,8,4,8,2,'#b49a73');
  paint(c,4,9,16,10,'#524b56');paint(c,5,9,14,1,'#ccb28a');
 }else{
  paint(c,5,7,14,14,'#314a4c');paint(c,6,8,12,12,'#567577');paint(c,7,5,10,3,'#a9966e');
  paint(c,8,5,8,1,'#d2b985');paint(c,6,9,1,9,'#b3c7b7');
  paint(c,8,20,8,1,'#a0baa7');
 }
 c.save();c.translate(12,18);c.scale(cage?.68:.63,cage?.68:.63);
 drawPixelRecipe(c,recipe(kind),0);c.restore();
 if(cage){
  for(const x of [4,8,15,19])paint(c,x,9,1,11,'#a88d67');
  paint(c,3,20,18,2,'#4f433c');paint(c,4,20,16,1,'#b3976c');
 }
 return true;
}
