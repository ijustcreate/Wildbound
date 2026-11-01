import {propLightGeometry} from './world-lighting.mjs';
const fields=['x','y','rootY','size','kind','width','depth','height','shadowHeight','shadowShape','radiusX','radiusY','fallen','falling','depleted','destroyed','cut','lightBlocker','lightHeight','lightGeometry'];
const caches=new WeakMap();
// Compare primitive state without allocating a serialized full-world signature.
// Static arrays retain identity until a harvest, editor change or region load.
export function scenePropCasters(game){
 let entry=caches.get(game);if(!entry){entry={props:new WeakMap(),list:[],revision:0};caches.set(game,entry);}
 const list=[];let changed=false;
 for(const p of game.scenery){
  if(['tall_grass','short_grass','grass','fern','flower','forest_understory'].includes(p.kind))continue;
  let slot=entry.props.get(p);
  let stale=!slot;
  if(slot)for(let i=0;i<fields.length;i++)if(slot.values[i]!==p[fields[i]]){stale=true;break;}
  if(stale){
   const geometry=propLightGeometry(p),wide=geometry.tree||/bush|shrub|rock|boulder|ruin/.test(p.kind),size=p.size||48;
   const caster=p.depleted||p.destroyed||p.fallen||p.cut||!geometry.volumes.length?null:{x:geometry.x,y:geometry.y,
    shadowShape:p.shadowShape||(geometry.tree?'tree':p.kind),shadowHeight:p.shadowHeight||geometry.height,
    radiusX:p.radiusX||Math.max(6,size*(wide?.42:.28)),radiusY:p.radiusY||Math.max(5,size*(wide?.32:.22))};
   slot={values:fields.map(n=>p[n]),caster};entry.props.set(p,slot);changed=true;
  }
  if(slot.caster)list.push(slot.caster);
 }
 const identical=list.length===entry.list.length&&list.every((p,i)=>{const old=entry.list[i];return p===old||['x','y','shadowShape','shadowHeight','radiusX','radiusY'].every(k=>p[k]===old[k]);});
 if(!identical){entry.list=list;entry.source=game.scenery;entry.length=game.scenery.length;entry.revision++;}
 return {casters:entry.list,revision:entry.revision};
}
