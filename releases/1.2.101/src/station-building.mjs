// Native house assets are shared by collision, damage and station rendering.
const buildings=new WeakMap();
export function stationAssetHouse(world,local){
 let house=buildings.get(local);if(house)return house;const s=world.station,t=world._stationContext,angle=t?.angle||0;
 const point=(x,y)=>t?{x:t.x+Math.cos(angle)*(x-t.x)-Math.sin(angle)*(y-t.y),y:t.y+Math.sin(angle)*(x-t.x)+Math.cos(angle)*(y-t.y)}:{x,y};
 const rect=b=>{const p=[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].map(([x,y])=>point(x,y));return {...b,x:Math.min(...p.map(p=>p.x)),y:Math.min(...p.map(p=>p.y)),w:Math.max(...p.map(p=>p.x))-Math.min(...p.map(p=>p.x)),h:Math.max(...p.map(p=>p.y))-Math.min(...p.map(p=>p.y))};};
 const left=s.x-s.w/2,top=s.y-s.h/2,walls=[],add=(id,x,y,w,h,kind='wall')=>walls.push(rect({id:(s.name||'lakewood')+':'+id,kind,x,y,w,h}));let cursor=left;
 for(const [i,dx]of[-150,-64,64,150].entries()){const x=s.x+dx-19;if(x>cursor)add('back-'+i,cursor,top,x-cursor,16);add('window-'+i,x,top,38,16,'window');cursor=x+38;}if(cursor<left+s.w)add('back-last',cursor,top,left+s.w-cursor,16);
 add('left',left,top+16,16,s.h-16);add('right',left+s.w-16,top+16,16,s.h-16);add('front-left',left,top+s.h-16,s.w/2-38,16);add('front-right',s.x+38,top+s.h-16,s.w/2-38,16);
 const furniture=local.furniture.map((f,i)=>rect({...f,id:(s.name||'lakewood')+':furniture-'+i}));furniture.push(rect({id:(s.name||'lakewood')+':clock',kind:'wall_clock',x:s.x-13,y:top+18,w:26,h:26,wallMounted:true}));
 for(const p of s.props||[])if(['trunks','parcels','owl_crate','flower_tub','luggage_cart','lantern','brazier','steam_vent'].includes(p.kind)){const f=rect({id:p.id,kind:'crate',x:p.x-22,y:p.y-14,w:44,h:18,stationDecor:p});furniture.push(f);}
 house={name:s.name||'Lakewood station',floors:local.floors.map(rect),floorZones:local.floorZones.map(rect),walls,doors:[],furniture,vehicles:[],pools:[],destructionRevision:0};buildings.set(local,house);return house;
}
