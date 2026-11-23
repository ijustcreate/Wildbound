// Shadow trees share the forest geometry, pixel brush, and canopy animation.
import {drawForestTree,drawTreeTrunk,drawTreeBranches,paintTreeFoliage} from './forest-tree-art.mjs';
export function shadowTreePose(p,y=p.rootY??p.y){return {...p,kind:'tree',treeType:'oak',season:'summer',leafHabit:'evergreen',realmPalette:'shadow',rootY:y,size:p.size*.72};}
const poses=new WeakMap();
export function drawShadowForestTree(c,p,y,time,g,resourceScale=1){
 let pose=poses.get(p);if(!pose){pose=shadowTreePose(p,y);poses.set(p,pose);}
 Object.assign(pose,p,{kind:'tree',treeType:'oak',season:'summer',leafHabit:'evergreen',realmPalette:'shadow',rootY:y,size:p.size*.72*resourceScale});
 drawForestTree(c,pose,time,g);
}
export function paintMoonveilTree({s,r}){
 const pose=shadowTreePose({x:0,y:0,size:128},122);
 const c={fillStyle:'#000000',fillRect(x,y,w,h){r(64+x*1.44,122+y*1.44,w*1.44,h*1.44,this.fillStyle);}};
 drawTreeTrunk(c,pose);drawTreeBranches(c,pose);paintTreeFoliage(c,pose,0,{});
 s.anchorY=122/128;s.occludes=true;s.nativeShadowTree=true;
}
