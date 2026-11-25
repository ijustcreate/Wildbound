import armillary from '../assets/pixel-recipes/diagon-garden/bronze-armillary.pixel.json' with {type:'json'};
import chimes from '../assets/pixel-recipes/diagon-garden/vine-chime-arbor.pixel.json' with {type:'json'};
import lectern from '../assets/pixel-recipes/diagon-garden/slate-field-lectern.pixel.json' with {type:'json'};
import coldFrame from '../assets/pixel-recipes/diagon-garden/glass-cold-frame.pixel.json' with {type:'json'};
import birdbath from '../assets/pixel-recipes/diagon-garden/carved-birdbath.pixel.json' with {type:'json'};
import skep from '../assets/pixel-recipes/diagon-garden/copper-hive-skep.pixel.json' with {type:'json'};
import foxglove from '../assets/pixel-recipes/diagon-garden/violet-foxglove-urn.pixel.json' with {type:'json'};
import aurelia from '../assets/pixel-recipes/diagon-garden/gold-aurelia-urn.pixel.json' with {type:'json'};
import terrarium from '../assets/pixel-recipes/diagon-garden/mistglass-terrarium.pixel.json' with {type:'json'};
import cabinet from '../assets/pixel-recipes/diagon-garden/seed-cabinet.pixel.json' with {type:'json'};
import watering from '../assets/pixel-recipes/diagon-garden/copper-watering-kit.pixel.json' with {type:'json'};
import tea from '../assets/pixel-recipes/diagon-garden/garden-tea-table.pixel.json' with {type:'json'};
import shelter from '../assets/pixel-recipes/diagon-garden/mosaic-cat-shelter.pixel.json' with {type:'json'};
import amethyst from '../assets/pixel-recipes/diagon-garden/curb-amethyst-blooms.pixel.json' with {type:'json'};
import fern from '../assets/pixel-recipes/diagon-garden/copper-sword-fern.pixel.json' with {type:'json'};
import inkcaps from '../assets/pixel-recipes/diagon-garden/nocturne-inkcaps.pixel.json' with {type:'json'};
import silverthorn from '../assets/pixel-recipes/diagon-garden/silver-thorn-pot.pixel.json' with {type:'json'};
import lilies from '../assets/pixel-recipes/diagon-garden/dusk-lilies.pixel.json' with {type:'json'};
import {compilePixelRecipe,pixelRecipeFrameAt} from './pixel-recipe.mjs';
import {spriteToRgba} from './pixels.mjs';
import {shape} from './diagon-shop-brush.mjs';
import {diagonLaneX,nocturneLaneX} from './alley-street-layout.mjs';

const art={armillary,chimes,lectern,coldFrame,birdbath,skep,foxglove,aurelia,terrarium,cabinet,watering,tea,shelter,
 amethyst,fern,inkcaps,silverthorn,lilies};
const footprints={armillary:[12,5],chimes:[19,5],lectern:[12,5],coldFrame:[23,10],birdbath:[12,5],
 skep:[17,7],foxglove:[12,6],aurelia:[12,6],terrarium:[19,7],cabinet:[19,7],watering:[17,6],tea:[15,8],shelter:[20,9],
 amethyst:[9,4],fern:[9,4],inkcaps:[9,4],silverthorn:[10,4],lilies:[9,4]};

function place([id,x,y],district){
 const [w,d]=footprints[id];
 if(district==='diagon')x=diagonLaneX(x);
 if(district==='nocturne'&&x>=8970)x=nocturneLaneX(x);
 return {id,x,y,district,halfWidth:w,halfDepth:d,phase:(x*13+y*19)%1703};
}

// Reading, tending and resting have their own small pockets off the main loop.
export const GARDEN_PROPS=[
 ['armillary',7574,3838],['chimes',7153,3990],['lectern',7345,3821],['coldFrame',7295,3818],
 ['birdbath',7160,3945],['skep',7151,4159],['foxglove',7570,3903],['aurelia',7555,3970],
 ['terrarium',7327,4270],['cabinet',7435,4255],['watering',7269,4265],['tea',7483,3905],['shelter',7144,4263],
].map(row=>place(row,'garden'));

export const ALLEY_BORDER_PROPS=[
 ...[
  ['amethyst',7778,4184],['fern',8223,4201],['lilies',8224,4410],['silverthorn',7777,4514],
  ['amethyst',8222,4720],['fern',7778,4834],['watering',7779,4974],['silverthorn',8220,5077],
  ['lilies',8230,5335],['tea',7782,5437],['foxglove',8225,5478],['fern',7777,5572],
 ].map(row=>place(row,'diagon')),
 ...[
  ['inkcaps',8993,4618],['silverthorn',9193,4821],['inkcaps',8990,4954],['terrarium',9190,5020],
  ['lilies',8579,5284],['inkcaps',8787,5176],['fern',8992,5349],['silverthorn',8990,5514],
  ['inkcaps',9194,5577],
 ].map(row=>place(row,'nocturne')),
];
const props=[...GARDEN_PROPS,...ALLEY_BORDER_PROPS];

export function alleyGardenPropBlocked(x,y,r=0){
 return props.some(prop=>Math.abs(x-prop.x)<prop.halfWidth+r&&Math.abs(y-prop.y)<prop.halfDepth+r);
}

let atlas;
// Pack the native recipe frames into one small surface. Placements only retain
// an art ID and a phase, so repeated fixtures do not duplicate pixel data.
export function prepareAlleyGardenProps(){
 if(atlas||typeof ImageData==='undefined')return;
 const recipes=new Map(),uploads=[],width=384;
 let x=1,y=1,rowHeight=0;
 for(const [id,source] of Object.entries(art)){
  const recipe=compilePixelRecipe(source);
  const frames=(recipe.frames||[recipe]).map(({sprite,duration})=>{
   if(x+sprite.width>=width){x=1;y+=rowHeight+2;rowHeight=0;}
   const cell={atlasX:x,atlasY:y,width:sprite.width,height:sprite.height,x:sprite.x,y:sprite.y};
   uploads.push({sprite,cell});
   x+=sprite.width+2;rowHeight=Math.max(rowHeight,sprite.height);
   return {duration,sprite:cell};
  });
  recipes.set(id,{sprite:frames[0].sprite,frames:recipe.frames?frames:undefined,duration:recipe.duration});
 }
 const height=y+rowHeight+1;
 const surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');
 if(surface.width!==width)surface.width=width;
 if(surface.height!==height)surface.height=height;
 const pixels=surface.getContext('2d');
 for(const {sprite,cell} of uploads){
  pixels.putImageData(new ImageData(spriteToRgba(sprite),sprite.width,sprite.height),cell.atlasX,cell.atlasY);
 }
 atlas={surface,recipes,frameCount:uploads.length};
}

export function alleyGardenPropArtStats(){
 return {recipeCount:atlas?.recipes.size||0,frameCount:atlas?.frameCount||0,
  animatedCount:atlas?[...atlas.recipes.values()].filter(recipe=>recipe.frames?.length>1).length:0,
  rasterPixels:atlas?atlas.surface.width*atlas.surface.height:0};
}

function paintShadow(c,{x,y,halfWidth:w,halfDepth:d}){
 shape(c,'#25383455',[[x-w-3,y],[x-w+2,y-d],[x+w-2,y-d],[x+w+4,y],
  [x+w+1,y+d],[x-w+3,y+d]]);
}

export function paintAlleyGardenProp(c,prop,time){
 prepareAlleyGardenProps();
 if(!atlas)return;
 const recipe=atlas.recipes.get(prop.id);
 const frame=pixelRecipeFrameAt(recipe,time*1000+prop.phase);
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(atlas.surface,frame.atlasX,frame.atlasY,frame.width,frame.height,
  prop.x+frame.x,prop.y+frame.y,frame.width,frame.height);
 c.restore();
}

export function queueAlleyGardenProps(c,time,visible,objects){
 for(const prop of props){
  const source=art[prop.id];
  if(!visible(prop.x,prop.y,source.width/2+5,source.height))continue;
  paintShadow(c,prop);
  objects.push({depth:prop.y+prop.halfDepth,paint:()=>paintAlleyGardenProp(c,prop,time)});
 }
}
