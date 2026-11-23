// World-axis buildings with a real entrance on the side facing the platform.
const buildings=new WeakMap();
export function stationEntrance(s){
 const side=s.doorSide||'south';
 return side==='west'?{side,x:s.x-s.w/2,y:s.y,nx:-1,ny:0}:side==='east'?{side,x:s.x+s.w/2,y:s.y,nx:1,ny:0}:side==='north'?{side,x:s.x,y:s.y-s.h/2,nx:0,ny:-1}:{side,x:s.x,y:s.y+s.h/2,nx:0,ny:1};
}
export function stationAssetHouse(world,local){
 let house=buildings.get(local);if(house)return house;
 const s=world.station,left=s.x-s.w/2,top=s.y-s.h/2,walls=[],entry=stationEntrance(s),id=s.name||'lakewood';
 const add=(name,x,y,w,h,kind='wall')=>{if(w>0&&h>0)walls.push({id:id+':'+name,kind,x,y,w,h});};
 for(const side of ['north','south','west','east']){
  const horizontal=side==='north'||side==='south',length=horizontal?s.w:s.h,base=horizontal?left:top,edge=side==='north'?top:side==='south'?top+s.h-16:side==='west'?left:left+s.w-16;
  const cuts=[];if(side===entry.side)cuts.push({at:length/2-38,length:76,kind:'door'});
  const centers=horizontal?[-s.w*.34,-s.w*.15,s.w*.15,s.w*.34]:[-s.h*.32,s.h*.32];
  for(const center of centers){const at=length/2+center-17;if(at<16||at+34>length-16||cuts.some(q=>at<q.at+q.length+12&&at+34>q.at-12))continue;cuts.push({at,length:34,kind:'window'});}
  cuts.sort((a,b)=>a.at-b.at);let cursor=0;
  const segment=(at,len,kind='wall')=>horizontal?add(side+'-'+at,base+at,edge,len,16,kind):add(side+'-'+at,edge,base+at,16,len,kind);
  for(const cut of cuts){segment(cursor,cut.at-cursor);if(cut.kind==='window')segment(cut.at,cut.length,'window');cursor=cut.at+cut.length;}segment(cursor,length-cursor);
 }
 const furniture=local.furniture.map((f,i)=>({...f,id:id+':furniture-'+i}));
 furniture.push({id:id+':clock',kind:'wall_clock',x:s.x-13,y:top+18,w:26,h:26,wallMounted:true});
 for(const p of s.props||[])if(['trunks','parcels','owl_crate','flower_tub','luggage_cart','lantern','brazier','steam_vent'].includes(p.kind))furniture.push({id:p.id,kind:'crate',x:p.x-22,y:p.y-14,w:44,h:18,stationDecor:p});
 const landing=s.platformLanding||{x:s.x,y:s.platformY},approach={x:Math.min(entry.x,landing.x)-28,y:Math.min(entry.y,landing.y)-28,w:Math.abs(entry.x-landing.x)+56,h:Math.abs(entry.y-landing.y)+56,material:'cement'};
 house={name:s.name||'Lakewood station',floors:[...local.floors.map(f=>({...f})),approach],floorZones:[...local.floorZones.map(f=>({...f})),approach],entrance:entry,walls,doors:[],furniture,vehicles:[],pools:[],destructionRevision:0};buildings.set(local,house);return house;
}
