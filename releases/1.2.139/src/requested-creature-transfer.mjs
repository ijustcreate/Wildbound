import werewolf from './werewolf-donor-data.mjs';
import scorpion_boss from './scorpion_boss-donor-data.mjs';
import chicken from './chicken-donor-data.mjs';
import squashling from './squashling-donor-data.mjs';
import zebra from './zebra-donor-data.mjs';
import fox from './fox-donor-data.mjs';
import dragon from './dragon-donor-data.mjs';
const data={zebra,fox,dragon,squashling,chicken,werewolf,scorpion_boss},copy=v=>structuredClone(v);
export function requestedCreatureDefaults(model,kind=model.type){
 const donor=data[kind];if(!donor)return model;
 const next=copy(model);next.joints=copy(donor.joints);next.clips={...next.clips,...copy(donor.clips)};
 // Any retained action also needs the transferred rest pose's joint set.
 for(const clip of Object.values(next.clips))for(const key of clip.keys)for(const name of Object.keys(next.joints))key.joints[name]??=[0,0,0];
 next.visibility=Object.fromEntries(Object.keys(next.joints).map(n=>[n,Array.from({length:8},(_,d)=>!n.startsWith('eye')||(![3,4,5].includes(d)&&!(n==='eyeR'&&d===2)&&!(n==='eyeL'&&d===6)))]));
 next.motionDonorRevision=1;next.provenance=copy(donor.provenance);return next;
}
export function upgradeRequestedCreature(model,legacy){
 if(model.motionDonorRevision===1)return copy(model);
 if(JSON.stringify(model.joints)!==JSON.stringify(legacy.joints))return copy(model);
 const next=requestedCreatureDefaults(legacy);
 for(const[key,value]of Object.entries(model))if(!['joints','clips','visibility','provenance'].includes(key))next[key]=copy(value);
 for(const[name,clip]of Object.entries(model.clips||{}))if(JSON.stringify(clip)!==JSON.stringify(legacy.clips[name]))next.clips[name]=copy(clip);
 for(const[name,visible]of Object.entries(model.visibility||{}))if(next.visibility[name])next.visibility[name]=copy(visible);
 next.motionDonorRevision=1;return next;
}
