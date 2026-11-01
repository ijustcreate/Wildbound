import {swampNoise} from './swamp-terrain.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const distance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);};
export function swampIslands(seed){
 const islands=[{x:800,y:800,r:232}];
 for(const [i,[x,y]]of [[270,260],[650,220],[1040,230],[1380,330],[1300,660],[1370,1020],[1240,1380],[890,1370],[530,1330],[230,1320],[230,980],[220,620],[520,480],[520,1060]].entries())islands.push({x:x+(hash(seed,i)-.5)*96,y:y+(hash(i,seed+31)-.5)*96,r:92+hash(seed+91,i)*50});
 // A spanning tree creates branches and dead ends; two additional loops provide alternatives.
 const reached=new Set([0]),links=[];
 while(reached.size<islands.length){let best=null,d=Infinity;for(const a of reached)for(let b=1;b<islands.length;b++)if(!reached.has(b)){const s=Math.hypot(islands[a].x-islands[b].x,islands[a].y-islands[b].y)*(1+hash(a+seed,b)*.18);if(s<d){d=s;best=[a,b];}}links.push(best);reached.add(best[1]);}
 for(const pair of [[2,3],[10,11]])if(!links.some(([a,b])=>a===pair[0]&&b===pair[1]||a===pair[1]&&b===pair[0]))links.push(pair);
 const routes=links.map(([a,b],i)=>{const p=islands[a],q=islands[b],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),bend=(hash(seed,i+403)-.5)*120;return [p,{x:(p.x+q.x)/2-dy/len*bend,y:(p.y+q.y)/2+dx/len*bend},q];});
 return {islands,links,routes};
}
export function swampRouteDistance(layout,x,y){return Math.min(...layout.routes.flatMap(points=>points.slice(1).map((p,i)=>distance(x,y,points[i],p))));}
export function swampTile(layout,seed,x,y){
 const edge=Math.min(x,y,1600-x,1600-y);
 if(edge<38)return 'water';
 const rough=(swampNoise(x/93+seed%97,y/93)-.5)*54+(swampNoise(x/31,y/31)-.5)*12;
 const land=Math.min(...layout.islands.map((p,i)=>Math.hypot((x-p.x)*(i?1.06:1),(y-p.y)*(i?.93:1))-p.r));
 const vertical=Math.abs(Math.sin((x+70*Math.sin(y/167+seed*.01))/205+seed*.03))*130;
 const horizontal=Math.abs(Math.sin((y+95*Math.sin(x/210))/290+seed*.013))*160;
 const channel=Math.min(vertical,horizontal);
 if(Math.hypot(x-800,y-800)<232)return 'marsh_grass';
 // Channels carve through the island field instead of being clipped into isolated pools.
 if(channel>66&&land<rough)return 'marsh_grass';
 if(channel>53&&land<rough+22)return 'mud';
 let tile=channel<30?'water':'shallow';
 // Winding shallow shelves connect every island. No roads are stamped over wetlands.
 if(tile==='water'&&swampRouteDistance(layout,x,y)<47)tile='shallow';
 return tile;
}
