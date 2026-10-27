import {realmAsset,realmProp} from './realm-layout.mjs';
import {readWorldDesign,scenesInRegion} from './world-authoring.mjs';
import {spawnAuthoredVillagers} from './villagers.mjs';
import {spawnQuestNpc} from './npc-quests.mjs';

export const authoredSceneKey=(level,scene)=>`${level.id}:${scene.id}`;
export function authoredPropsInRegion(environment,cx,cy,design=readWorldDesign()){
 const placements=scenesInRegion(environment,cx,cy,design);
 return placements.flatMap(({level,scene})=>sceneProps(level,scene,cx,cy));
}
function sceneProps(level,scene,cx,cy){
 const key=authoredSceneKey(level,scene),ax=cx*1600+scene.x,ay=cy*1600+scene.y;
 return scene.props.map((p,index)=>({... (realmAsset(p.kind)?realmProp(p.kind,ax+p.dx,ay+p.dy,index):{}),id:`boundless:${cx}:${cy}:scene:${key}:prop:${index}`,kind:p.kind,x:ax+p.dx,y:ay+p.dy,
  ...(Number.isFinite(p.width)?{width:p.width}:{}),...(Number.isFinite(p.depth)?{depth:p.depth}:{}),...(Number.isFinite(p.height)?{height:p.height}:{}),...(p.shape?{shape:p.shape}:{}),size:p.size||realmAsset(p.kind)?.size||64,authoredSceneId:key}));
}
/** Apply editor-authored scenery and people to the local persistent world only. */
export function applyAuthoredScenes(g,cx,cy,{includeProps=true,includeNpcs=true}={}){
 if(!g.localWorld)return [];
 const placements=scenesInRegion(g.environment,cx,cy);
 for(const {level,scene} of placements){
  const anchor={x:cx*1600+scene.x,y:cy*1600+scene.y},key=authoredSceneKey(level,scene);
  if(includeProps){const present=new Set((g.scenery||[]).map(p=>p.id));for(const prop of sceneProps(level,scene,cx,cy))if(!present.has(prop.id))g.scenery.push(prop);}
  if(!includeNpcs)continue;
  spawnAuthoredVillagers(g,{...scene,levelId:level.id},anchor);
  const keeper=scene.npcs.find(n=>n.id==='rowan');
  if(keeper){
   const exists=(g.questNpcs||[]).some(n=>n.npcId==='rowan');
   if(!exists){const npc=spawnQuestNpc(g);if(npc){npc.x=anchor.x+keeper.x;npc.y=anchor.y+keeper.y;npc.campX=npc.x;npc.campY=npc.y;npc.authoredSceneId=key;}}
   else {const npc=g.questNpcs.find(n=>n.npcId==='rowan');if(npc?.authoredSceneId===key){npc.x=anchor.x+keeper.x;npc.y=anchor.y+keeper.y;npc.campX=npc.x;npc.campY=npc.y;}}
  }
 }
 return placements;
}
