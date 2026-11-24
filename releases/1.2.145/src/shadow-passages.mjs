import {beginPassageTravel} from './house-worlds.mjs';
import {passageLanding} from './shadow-passage-landing.mjs';
export function ensureShadowExit(g){
 const s=g.realmState;if(g.generatedEnvironment!=='shadow'||!s)return null;
 if(!s.enchantedExit){const landing=passageLanding(g,{x:(s.originX||0)+800,y:(s.originY||0)+1050});if(!landing)return null;s.enchantedExit={x:landing.x,y:landing.y};}
 const id=`shadow-passage:${s.seed}:${s.originX||0}:${s.originY||0}`;
 let door=(g.portals||[]).find(p=>p.linkId===id&&p.passageSide==='shadow');
 if(!door){door={id,linkId:id,shadowPassage:true,passageSide:'shadow',x:s.enchantedExit.x,y:s.enchantedExit.y,color:'#c6a2ed',autoEnter:false,closing:null};(g.portals??=[]).push(door);}return door;
}
export function interactShadowPassage(g,p){
 if(p.room||p.ui||p.hp<=0||g.worldTravel||g.phase!=='play')return false;
 const door=(g.portals||[]).find(d=>d.shadowPassage&&Math.hypot(d.x-p.x,d.y-p.y)<58);
 return !!door&&beginPassageTravel(g,door);
}
