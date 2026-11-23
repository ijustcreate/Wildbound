import {stumpShape} from './terrain-support.mjs';
const trees=['tree','snow_tree','palm','leafless_tree','grave_forest_tree'];
export function vehicleRollsOver(p){return !!stumpShape(p)||!!(p.falling&&trees.includes(p.kind))||!!(p.fallen&&trees.includes(p.kind))||p.kind==='rock'&&(p.size||64)<=40;}
export function vehicleCoversGround(v,x,y,padding=20){const a=v.heading||0,dx=x-v.x,dy=(y-v.y)/.72;return Math.abs(Math.cos(a)*dx+Math.sin(a)*dy)<(v.w||96)*.5+padding&&Math.abs(-Math.sin(a)*dx+Math.cos(a)*dy)<(v.h||144)*.5+padding;}
export function vehicleSceneryDepth(g,p,depth){if(!vehicleRollsOver(p)&&!['grass','short_grass','tall_grass'].includes(p.kind))return depth;for(const v of g.house?.vehicles||[])if(!(v.sink>=1)&&vehicleCoversGround(v,p.x,p.rootY??p.y))depth=Math.min(depth,v.y-.1);return depth;}
