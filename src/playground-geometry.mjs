// Shared physical footprints; no renderer, random draws or saved-player changes.
export const playShape=o=>o.kind==='log'?{x:o.x-31,y:o.y-10,w:62,h:20,height:6}:o.kind==='step'?{x:o.x-15,y:o.y-11,w:30,h:22,height:o.height||10}:o.kind==='pot'&&!o.broken?{x:o.x-9,y:o.y-6,w:18,h:12,height:17}:o.kind==='apple_tree'?{x:o.x-7,y:o.y-5,w:14,h:10,height:999}:null;
export const onPlayShape=(o,x,y)=>{const s=playShape(o);return !!s&&x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h;};
export function playgroundSupport(g,a,offset=0){
 if(g?.trainTest||a.room)return 0;
 let height=0;for(const o of g?.playground?.props||[]){const s=playShape(o);if(s&&s.height<999&&onPlayShape(o,a.x,a.y+(a.kind?offset:0)))height=Math.max(height,s.height);}return height;
}
export function playgroundDepth(g,a,depth){
 for(const o of g?.playground?.props||[]){const s=playShape(o);if(s&&s.height<999&&(a.jumpHeight||a.groundHeight||0)>=s.height&&onPlayShape(o,a.x,a.y))depth=Math.max(depth,s.y+s.h+.1);}return depth;
}
