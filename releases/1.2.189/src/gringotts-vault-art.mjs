import housingSpec from '../assets/pixel-recipes/gringotts-vault-housing.pixel.json' with {type:'json'};
import doorSpec from '../assets/pixel-recipes/gringotts-vault-door.pixel.json' with {type:'json'};
import {compilePixelRecipe} from './pixel-recipe.mjs';
import {drawPixelRecipe} from './pixel-recipe-canvas.mjs';
import {block as b, shape as p, line as l} from './diagon-shop-brush.mjs';
import {portalVisualSample} from './portal-art.mjs';

const housing=compilePixelRecipe(housingSpec);
const door=compilePixelRecipe(doorSpec);
const opening=[[-18,-5],[-18,-35],[-16,-44],[-11,-50],[-6,-53],[6,-53],
 [11,-50],[16,-44],[18,-35],[18,-5]];
const portalRamp=['#152526','#203d3d','#355e59','#58998a','#8dd8b9','#d2f2d2'];
const brass=['#41362d','#74583e','#b88d55','#dfbf7d','#f1dca2'];
const ease=t=>{
 const u=Math.max(0,Math.min(1,t));
 return u*u*(3-2*u);
};

function paintPortal(c,time,openness){
 if(openness<=0)return;
 const {rim,spiral,particles}=portalVisualSample({},time);
 c.save();
 c.globalAlpha*=openness;
 p(c,portalRamp[0],opening);
 p(c,portalRamp[1],[[-17,-6],[-17,-36],[-13,-46],[-6,-51],[7,-51],
  [14,-45],[17,-36],[17,-6],[13,-6],[13,-34],[9,-44],[4,-48],
  [-4,-48],[-9,-44],[-13,-34],[-13,-6]]);
 const pulse=Math.floor(time*10);
 for(const [i,point] of spiral.entries()){
  const accent=(i+pulse)%17<4;
  const color=point.u>.72?portalRamp[3]:point.u>.46?portalRamp[2]:portalRamp[1];
  b(c,point.x*.86,-29+(point.y+29)*.56,accent?2:1,1,accent?portalRamp[4]:color);
 }
 for(const [i,point] of rim.entries()){
  const shine=Math.sin(i*.36-time*4)>.62;
  b(c,point.x*.88,-29+(point.y+29)*.57,shine?2:1,1,portalRamp[shine?4:2]);
 }
 for(const [i,point] of particles.entries()){
  if(Math.abs(point.x)>18||point.alpha<.48)continue;
  b(c,point.x*.85,-28+(point.y+18)*.59,1,1,portalRamp[i%5===0?5:3]);
 }
 b(c,-15,-5,30,1,portalRamp[3]);
 b(c,-12,-4,25,1,portalRamp[2]);
 b(c,-8,-4,14,1,portalRamp[4]);
 c.restore();
}

function paintWheel(c,turn){
 const x=21,y=-28;
 p(c,brass[0],[[x-4,y-9],[x+4,y-9],[x+9,y-4],[x+9,y+4],
  [x+4,y+9],[x-4,y+9],[x-9,y+4],[x-9,y-4]]);
 p(c,brass[2],[[x-4,y-8],[x+3,y-8],[x+8,y-3],[x+8,y+3],
  [x+3,y+8],[x-3,y+8],[x-8,y+3],[x-8,y-3]]);
 p(c,'#495451',[[x-3,y-6],[x+3,y-6],[x+6,y-3],[x+6,y+3],
  [x+3,y+6],[x-3,y+6],[x-6,y+3],[x-6,y-3]]);
 l(c,brass[4],x-8,y-3,x-3,y-8);
 l(c,brass[1],x+3,y+8,x+8,y+3);
 for(let spoke=0;spoke<4;spoke++){
  const angle=turn*Math.PI*.75+spoke*Math.PI/2+Math.PI/4;
  const dx=Math.cos(angle),dy=Math.sin(angle);
  l(c,brass[0],x,y,x+dx*7,y+dy*7,3);
  l(c,brass[3],x,y,x+dx*6,y+dy*6);
 }
 b(c,x-2,y-2,5,5,brass[0]);
 b(c,x-2,y-2,4,3,brass[3]);
 b(c,x,y-1,1,3,brass[1]);
}

export function paintGringottsVault(c,time=0,progress=0){
 const unlock=ease(progress/.28);
 const swing=ease((progress-.28)/.72);
 drawPixelRecipe(c,housing,0);
 paintPortal(c,time,ease((swing-.06)/.72));

 // The bolts withdraw before the slab swings inward on the left hinge.
 const width=Math.cos(swing*Math.PI*.48);
 c.save();
 c.transform(width,-.045*swing,0,1,-21,0);
 drawPixelRecipe(c,door,0);
 if(swing<.88)paintWheel(c,unlock);
 c.restore();
 const bolt=Math.round((1-unlock)*5);
 if(bolt>0){
  for(const y of [-37,-28,-19]){
   b(c,18,y,bolt+1,3,brass[0]);
   b(c,18,y,bolt,1,brass[2]);
  }
 }
 if(swing>0){
  b(c,-21,-48,Math.max(1,Math.round(3*swing)),39,'#343e3c');
  b(c,-20,-43,1,6,brass[2]);
  b(c,-20,-19,1,6,brass[1]);
 }
}
