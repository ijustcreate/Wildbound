// Additive, deterministic understory. Existing authored objects and terrain stay exact.
export const SHADOW_THICKET_VERSION=1,SHADOW_THICKET_BUDGET=224;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function dressShadowThickets(g,terrainAt,pathDistance){
 const s=g.realmState;if(!s||s.env!=='shadow'||s.underworldAuthored||s.shadowThicketVersion>=SHADOW_THICKET_VERSION)return 0;
 const ox=s.originX||0,oy=s.originY||0,seed=s.seed??g.seed??0,props=g.scenery;
 const tile=(x,y)=>terrainAt?terrainAt(Math.floor(x/32),Math.floor(y/32)):g.terrain?.[Math.floor((y-oy)/32)*50+Math.floor((x-ox)/32)];
 const local=props.filter(p=>p.x>=ox&&p.x<ox+1600&&(p.rootY??p.y)>=oy&&(p.rootY??p.y)<oy+1600);
 const hosts=local.filter(p=>!p.shadowThicket&&!p.distant&&!p.depleted&&!p.fallen&&['wither_tree','ashen_log','hollow_stump','root_arch','veil_stone','underworld_columns','moonwell','thorn_shrine'].includes(p.kind)).sort((a,b)=>(a.kind==='wither_tree'?0:1)-(b.kind==='wither_tree'?0:1));
 const added=[];
 const plant=(kind,x,y,size,host,layer)=>{
  if(added.length>=SHADOW_THICKET_BUDGET)return;
  const radius=size*.38;
  if(x<ox+35||x>ox+1565||y<oy+35||y>oy+1565||Math.hypot(x-ox-800,(y-oy-816)*1.1)<230+radius)return;
  if(pathDistance(s,x,y)<44+radius)return;
  if((s.enchantedPOIs||[]).some(p=>Math.hypot(x-p.x,(y-p.y)*1.15)<p.radius+radius))return;
  if(s.enchantedExit&&Math.hypot(x-s.enchantedExit.x,y-s.enchantedExit.y)<84+radius)return;
  if([[0,0],[-radius*.6,0],[radius*.6,0],[0,-radius*.6],[0,radius*.6]].some(([dx,dy])=>tile(x+dx,y+dy)!=='shadow_soil'))return;
  if(local.some(p=>Math.hypot(p.x-x,(p.rootY??p.y)-y)<(p.shadowThicket?12:9)))return;
  const p={id:`shadow-thicket:${ox}:${oy}:${added.length}`,kind,x,y:y-size*.19,rootY:y,size,realm:true,procedural:true,underworldDressing:true,enchantedRule:'layered-thicket',shadowThicket:true,thicketHost:host.id,thicketLayer:layer,collisionWidth:0,collisionDepth:0};
  props.push(p);local.push(p);added.push(p);
 };
 for(const [i,host]of hosts.entries()){
  if(added.length>=SHADOW_THICKET_BUDGET)break;
  const y=host.rootY??host.y,flip=hash(seed,i)>.5?-1:1,jitter=(n)=>(hash(seed+i*17,n)-.5)*10;
  // Taller bramble masses behind the roots, side fronds, then low front flowers/fungi.
  const bed=[['thorn_fan',-33,-13,64,'back'],['thorn_fan',30,-9,60,'back'],['thorn_fan',1,-33,54,'back'],['witch_fern',-48,12,49,'middle'],['witch_fern',44,19,46,'middle'],['mooncap_cluster',-24,26,36,'front'],['shadow_bloom',22,32,37,'front'],['echo_fungus',3,15,34,'front']];
  for(const [j,[kind,dx,dy,size,layer]]of bed.entries())plant(kind,host.x+dx*flip+jitter(j),y+dy+jitter(j+20),size*(.92+hash(i+j,seed)*.16),host,layer);
  if(i%4===0)plant('star_shards',host.x+flip*56,y+34,28,host,'accent');
  if(i%7===0)plant('wisp_lantern',host.x-flip*62,y-12,44,host,'accent');
 }
 s.shadowThicketVersion=SHADOW_THICKET_VERSION;s.shadowThicketCount=added.length;return added.length;
}
