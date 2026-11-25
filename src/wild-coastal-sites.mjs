import {MERMAID_LAGOON,mermaidLagoonBlocked,mermaidLagoonGround,mermaidLagoonIntersects,mermaidLagoonSurface} from './wild-mermaid-lagoon.mjs';
import {SKULL_ROCK,skullRockBlocked,skullRockGround,skullRockIntersects,skullRockSurface} from './wild-skull-rock.mjs';

export const WILD_COASTAL_SITES=Object.freeze([MERMAID_LAGOON,SKULL_ROCK]);

export function coastalSiteSurface(x,y){
 return mermaidLagoonSurface(x,y)??skullRockSurface(x,y);
}

export function coastalSiteGround(x,y){
 const ground=mermaidLagoonGround(x,y);
 if(ground==='sand')return 'beach';
 if(ground==='grass')return 'forest';
 if(ground==='stone')return 'tideglass';
 return skullRockGround(x,y);
}

export function coastalSiteIntersects(left,top,right,bottom){
 return mermaidLagoonIntersects(left,top,right,bottom)||skullRockIntersects(left,top,right,bottom);
}

export function coastalSiteBlocked(x,y,radius){
 return mermaidLagoonBlocked(x,y,radius)||skullRockBlocked(x,y,radius);
}
