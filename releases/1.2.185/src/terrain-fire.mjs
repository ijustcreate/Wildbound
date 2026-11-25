import {meltSnowAt} from './snow-surface.mjs';
import {igniteTallGrassAt} from './tall-grass.mjs';
import {igniteBushAt} from './bush-fire.mjs';

export function heatGround(g,x,y,{trail=false}={}){
 meltSnowAt(g,x,y,trail?7:14);
 if(!trail)igniteBushAt(g,x,y);
 return igniteTallGrassAt(g,x,y,{trail});
}
