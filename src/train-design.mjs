export const TRAIN_DESIGN_KEY='wildbound-railway-library-v2',TRAIN_DRAFT_KEY='wildbound-railway-draft-v2';
export const TRAIN_VIEWS=['South','Southwest','West','Northwest','North','Northeast','East','Southeast'];
export const TRAIN_PARTS=['chassis','wheels','body','furniture','machinery','trim','roof'];
const clone=v=>structuredClone(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function defaultTrainDesign(){
 const nodes=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return{id:'rail-'+i,x:3200+2200*Math.cos(a),y:2200+1300*Math.sin(a),z:0};});
 return {version:2,name:'Scarlet woodland railway',width:6400,height:4400,river:{x:3200,width:230},nodes,routes:[{id:'main',name:'Main oval',nodes:nodes.map(n=>n.id)}],activeRoute:'main',maxSpeed:170,acceleration:18,brakePower:40,gauge:52,spawnDistance:2000,paint:{body:'#9b3546',lining:'#d8b66e',roof:'#34424b',wood:'#ad8055',seats:'#a44250',glass:'#9dc7c6'},cars:[{id:'locomotive',kind:'engine',length:250,width:96},{id:'tender',kind:'tender',length:112,width:96},{id:'compartments',kind:'compartments',length:320,width:100},{id:'saloon',kind:'seats',length:320,width:100}],scenery:defaultRailwayScenery(),interiors:{},art:{}};
}
export function defaultInterior(car){
 const L=car.length,W=car.width,out=[],add=(id,kind,x,y,w,h,extra={})=>out.push({id,kind,x,y,w,h,...extra});
 if(car.kind==='seats'){for(let x=-L/2+53,i=0;x<L/2-32;x+=43,i++)for(const side of[-1,1])add('bench-'+i+'-'+side,'seat',x,side*(W/2-23),27,27,{facing:side<0?1:3});}
 if(car.kind==='compartments'){
  const start=-L/2+35,end=L/2-35,count=4,span=(end-start)/count;
  for(let i=0;i<count;i++){const x=start+i*span;add('partition-'+i,'wall',x,-10,5,W-30);add('door-'+i,'door',x+span/2,W/2-23,22,5,{open:false});for(const side of[-1,1])add('divider-'+i+'-'+side,'wall',x+span/2+side*(span/4+5.5),W/2-23,span/2-11,5);for(const dx of[-span*.25,span*.25])add('sofa-'+i+'-'+dx,'seat',x+span/2+dx,-W*.22,22,34,{facing:dx<0?0:2});add('table-'+i,'table',x+span/2,-W*.25,14,22);}
 }
 if(car.kind==='engine'){add('controls','console',-L*.34,-W*.23,25,18);add('firebox','firebox',-L*.12,0,22,36);add('cab-bulkhead','wall',-L*.06,0,6,W-18);}
 return out;
}
export function trainInterior(d,car){return d.interiors[car.id]||defaultInterior(car);}
export function validateTrainDesign(raw){
 if(!raw||raw.version!==2)throw Error('Choose a version 2 railway design.');
 const d=clone(raw),finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
 if(typeof d.name!=='string'||d.name.length>80)throw Error('Railway name must be at most 80 characters.');
 if(!finite(d.width,3000,16000)||!finite(d.height,3000,16000))throw Error('Map bounds must be 3000–16000 pixels.');
 if(!d.river||!finite(d.river.x,300,d.width-300)||!finite(d.river.width,80,700))throw Error('River is outside the map.');
 if(!Array.isArray(d.nodes)||d.nodes.length<4||d.nodes.length>128)throw Error('Use 4–128 track control points.');
 const ids=new Set();for(const n of d.nodes){if(typeof n.id!=='string'||ids.has(n.id)||![n.x,n.y,n.z].every(Number.isFinite)||n.x<100||n.y<100||n.x>d.width-100||n.y>d.height-100||n.z<0||n.z>160)throw Error('Invalid or duplicate track point.');ids.add(n.id);}
 if(!Array.isArray(d.routes)||!d.routes.length||d.routes.length>12)throw Error('Use 1–12 railway routes.');
 const routes=new Set();for(const r of d.routes){if(typeof r.id!=='string'||routes.has(r.id)||typeof r.name!=='string'||!Array.isArray(r.nodes)||r.nodes.length<4||r.nodes.length>128||new Set(r.nodes).size!==r.nodes.length||r.nodes.some(id=>!ids.has(id)))throw Error('Each route needs at least four different existing track points.');routes.add(r.id);}
 if(!routes.has(d.activeRoute))throw Error('Choose an existing active route.');
 for(const k of ['maxSpeed','acceleration','brakePower','gauge','spawnDistance'])if(!Number.isFinite(d[k]))throw Error('Invalid train tuning.');
 d.maxSpeed=clamp(d.maxSpeed,30,240);d.acceleration=clamp(d.acceleration,5,50);d.brakePower=clamp(d.brakePower,15,120);d.gauge=clamp(d.gauge,42,64);
 if(!Array.isArray(d.cars)||d.cars.length!==4||d.cars.map(c=>c.kind).join(',')!=='engine,tender,compartments,seats')throw Error('Keep an engine, coal tender, compartment coach and seated coach.');
 const carIds=new Set();for(const c of d.cars){if(typeof c.id!=='string'||carIds.has(c.id)||!finite(c.length,c.kind==='tender'?80:200,440)||!finite(c.width,86,130))throw Error('Invalid carriage dimensions.');carIds.add(c.id);}
 for(const key of ['body','lining','roof','wood','seats','glass'])if(!/^#[0-9a-f]{6}$/i.test(d.paint?.[key]))throw Error('Choose six digit paint colors.');
 d.scenery??=defaultRailwayScenery();if(!Array.isArray(d.scenery)||d.scenery.length>2000||d.scenery.some(o=>!o||typeof o.id!=='string'||!['tree','bush','rock'].includes(o.kind)||!finite(o.x,20,d.width-20)||!finite(o.y,20,d.height-20)||!finite(o.size,24,180)))throw Error('Invalid railway scenery.');
 d.interiors??={};d.art??={};
 for(const c of d.cars){const items=d.interiors[c.id];if(items!==undefined){if(!Array.isArray(items)||items.length>120)throw Error('Too many interior objects.');const seen=new Set();for(const o of items){if(typeof o.id!=='string'||seen.has(o.id)||!['seat','wall','door','table','console','firebox','lamp'].includes(o.kind)||![o.x,o.y,o.w,o.h].every(Number.isFinite)||o.w<2||o.h<2||Math.abs(o.x)+o.w/2>c.length/2||Math.abs(o.y)+o.h/2>c.width/2||o.facing!==undefined&&!finite(o.facing,0,3))throw Error('Interior objects must fit inside their carriage.');seen.add(o.id);}}}
 if(Object.keys(d.art).length>224)throw Error('Too many artwork overrides.');for(const [key,s]of Object.entries(d.art)){if(!/^(engine|tender|compartments|seats):(chassis|wheels|body|furniture|machinery|roof|trim):[0-7]$/.test(key)||!s||!finite(s.width,1,600)||!finite(s.height,1,300)||!Array.isArray(s.pixels)||s.pixels.length!==s.width*s.height||!Array.isArray(s.palette)||s.palette.length>4096||s.pixels.some(n=>!Number.isInteger(n)||n<0||n>=s.palette.length)||s.palette.some(v=>v!=='transparent'&&!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)))throw Error('Invalid pixel artwork.');}
 return d;
}
export function readTrainLibrary(storage=globalThis.localStorage){try{const l=JSON.parse(storage?.getItem(TRAIN_DESIGN_KEY));if(l?.version===2&&Array.isArray(l.designs)&&l.designs.length){l.designs=l.designs.filter(v=>{try{v.design=validateTrainDesign(unpackTrainDesign(v.design));return typeof v.id==='string';}catch{return false;}});if(l.designs.length)return l;}}catch{}return {version:2,active:'default',designs:[{id:'default',design:defaultTrainDesign()}]};}
export function readTrainDesign(storage=globalThis.localStorage){const l=readTrainLibrary(storage);return clone(l.designs.find(v=>v.id===l.active)?.design||l.designs[0].design);}
export function saveTrainDesign(design,{asNew=false,id:requestedId,storage=globalThis.localStorage}={}){const d=validateTrainDesign(design),l=readTrainLibrary(storage);let id=asNew||requestedId===null?'railway-'+Date.now():requestedId||l.active;let record=l.designs.find(v=>v.id===id);if(!record){if(l.designs.length>=20)throw Error('Export or reuse a saved version; the railway library holds 20 versions.');l.designs.push(record={id,design:d});}record.design=d;l.active=id;storage?.setItem(TRAIN_DESIGN_KEY,JSON.stringify({...l,designs:l.designs.map(v=>({...v,design:packTrainDesign(v.design)}))}));storage?.removeItem(TRAIN_DRAFT_KEY);return id;}
export function preserveTrainDraft(d,storage=globalThis.localStorage){storage?.setItem(TRAIN_DRAFT_KEY,JSON.stringify(packTrainDesign(d)));}
export function readTrainDraft(storage=globalThis.localStorage){try{const d=JSON.parse(storage?.getItem(TRAIN_DRAFT_KEY));if(d)return validateTrainDesign(unpackTrainDesign(d));}catch{}return null;}
// Compact transparent part sprites before storing/exporting all eight directions.
export function packTrainDesign(raw){const d=structuredClone(raw);for(const s of Object.values(d.art||{})){const runs=[];for(let i=0;i<s.pixels.length;){const value=s.pixels[i];let n=1;while(i+n<s.pixels.length&&s.pixels[i+n]===value&&n<65535)n++;runs.push(n,value);i+=n;}s.runs=runs;delete s.pixels;}return d;}
export function unpackTrainDesign(raw){const d=structuredClone(raw);for(const s of Object.values(d.art||{})){if(s.runs){if(!Array.isArray(s.runs)||s.runs.length>400000||!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width<1||s.width>600||s.height<1||s.height>300)throw Error('Invalid compressed artwork.');const pixels=[];for(let i=0;i<s.runs.length;i+=2){const n=s.runs[i],value=s.runs[i+1];if(!Number.isInteger(n)||n<1||n>65535||!Number.isInteger(value)||value<0||pixels.length+n>s.width*s.height)throw Error('Invalid pixel run.');for(let j=0;j<n;j++)pixels.push(value);}if(pixels.length!==s.width*s.height)throw Error('Incomplete pixel artwork.');s.pixels=pixels;delete s.runs;}}return d;}

export function defaultRailwayScenery(){const out=[];for(let y=120;y<4300;y+=190)for(let x=110;x<6300;x+=180){const seed=Math.abs(Math.sin(x*7.32+y*2.17)),px=x+seed*100,py=y+Math.abs(Math.cos(x*3+y*7))*75;if(Math.abs(px-3200)<180||Math.abs(Math.hypot((px-3200)/2200,(py-2200)/1300)-1)<.12)continue;out.push({id:'rail-tree-'+out.length,kind:'tree',x:px,y:py,size:86+seed*38});}return out;}
