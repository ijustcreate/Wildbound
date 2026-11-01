// Equipment sprites contain only pixels that differ from the uncovered actor.
// Their transparent pixels must never replace the underlying character layer.
export function isolateItemSprite(sprite,underlying){
 const result=structuredClone(sprite);result.itemOnly=true;
 result.pixels=result.pixels.map((index,i)=>{if(!index)return 0;const x=result.x+i%result.width,y=result.y+Math.floor(i/result.width),color=result.palette[index];return color===underlying(x,y)?0:index;});
 return result;
}
export const itemArtLayers=(item,direction)=>Object.entries(item?.wornArt?.[direction]||{}).filter(([,sprite])=>sprite?.itemOnly);
