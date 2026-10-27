import {drawLocationScene,locationPreviewAssets} from './location-scene-preview.mjs';
import {defaultDungeonDecor} from './dungeon-decor.mjs';
import {HouseBuilder} from './house-builder.mjs';
import {EDITABLE_LOCATIONS,locationLibrary,saveLocationDesign,preserveLocationDraft,validateLocationDesign,flushLocationStorage} from './location-designs.mjs';
import {validateHouse} from './house-design.mjs';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;},clone=v=>structuredClone(v);
export async function locationTemplate(id){
 const def=EDITABLE_LOCATIONS.find(l=>l.id===id);if(!def)throw Error('Unknown location');
 if(id==='temple'){const [{templeLayout},{generateWorld},{Game},{seedWildFauna}]=await Promise.all([import('./temple.mjs'),import('./world.mjs'),import('./core.mjs'),import('./wild-fauna.mjs')]);const world=generateWorld(42,'temple',{authored:false}),preview=new Game(()=>.5,{deferWorld:true});Object.assign(preview,world,{seed:42,generatedEnvironment:'temple',environment:'temple',enemies:[],phase:'play',openingBoard:false});seedWildFauna(preview,true);return{version:1,id,name:def.name,type:'house',house:{version:1,name:def.name,...templeLayout({authored:false}),trees:[],scenery:world.scenery,spawnPoints:preview.enemies.map(p=>({...clone(p),size:47})),vehicles:[]}};}
 if(id==='old-well'||id==='mausoleum'){
  const mod=await import(id==='old-well'?'./old-well.mjs':'./mausoleum-crypt.mjs'),s=id==='old-well'?mod.generateWellTunnels(42,{authored:false}):mod.generateMausoleumCrypt(42,{authored:false});
  const markers=[];for(const role of['exit','arrival','chest','coffin'])if(s[role])markers.push({id:role,role,x:s[role].x,y:s[role].y,data:clone(s[role])});
  for(const [i,p]of(s.candles||[]).entries())markers.push({id:'light-'+i,role:'light',x:p.x,y:p.y});
  for(const [i,e]of s.enemies.entries())markers.push({id:'enemy-'+i,role:'enemy',kind:e.kind,x:e.x,y:e.y,hp:e.maxHp,actor:clone(e)});
  markers.push(...defaultDungeonDecor(s,id));return{version:1,id,name:def.name,type:'grid',sceneContentsVersion:2,width:s.width,height:s.height,tile:16,tiles:s.tiles,markers,rooms:s.rooms};
 }
 const width=20,height=15,tiles=Array(width*height).fill(0);
 for(let y=3;y<14;y++)for(let x=2;x<19;x++)tiles[y*width+x]=1;
 const markers=id==='storage'?[{id:'exit',role:'exit',x:160,y:208},...[60,160,260].map((x,index)=>({id:'storage-chest-'+index,role:'storage_chest',index,x,y:94})),{id:'robot',role:'robot',x:65,y:184},{id:'vending',role:'vending',x:255,y:158}]:[{id:'exit',role:'exit',x:160,y:208},{id:'chest',role:'chest',x:160,y:78},...[[32,68],[288,68],[32,174],[288,174]].map(([x,y],i)=>({id:'light-'+i,role:'light',x,y}))];
 if(id==='temple-upper')markers.push({id:'statue-left',role:'prop',kind:'statue',x:70,y:60},{id:'statue-right',role:'prop',kind:'statue',x:236,y:60},{id:'jade-aisle',role:'prop',kind:'jade_aisle',x:160,y:143});return{version:1,id,name:def.name,type:'grid',sceneContentsVersion:2,width,height,tile:16,tiles,markers};
}
export class LocationEditor{
 constructor(id='temple'){this.id=id;this.undo=[];this.redo=[];this.tool='select';this.zoom=1;}
 async mount(root){
  this.root=root;root.className='house-builder';root.replaceChildren();
  const saved=locationLibrary(),template=await locationTemplate(this.id);this.design??=clone(saved.drafts?.[this.id]||saved.layouts[this.id]||template);
  // Enrich only the original empty editor template, preserving authored geometry.
  if(this.id==='temple'&&!this.design.sceneContentsVersion){if(!this.design.house.scenery?.length)this.design.house.scenery=clone(template.house.scenery);if(!this.design.house.furniture.length)this.design.house.furniture=clone(template.house.furniture);this.design.house.spawnPoints??=clone(template.house.spawnPoints);this.design.sceneContentsVersion=1;}
  if(this.design.type==='house'){
   this.design.house.spawnPoints??=clone(template.house.spawnPoints||[]);this.animator??=await locationPreviewAssets();
   const builder=new HouseBuilder({sceneAnimator:this.animator,layout:this.design.house,template:template.house,locationId:this.id,mountPicker:t=>this.addLocationPicker(t),onDraft:h=>preserveLocationDraft({...this.design,house:h}),onSave:async h=>{if(!validateHouse(h))throw Error('Keep the central board area clear.');this.design.house=clone(h);this.design.name=h.name;await saveLocationDesign(this.design);window.dispatchEvent(new CustomEvent('wildbound-location-applied',{detail:{id:this.id}}));}});
   builder.mount(root);return;
  }
  if(!this.design.sceneContentsVersion){for(const m of template.markers.filter(m=>['prop','storage_chest','robot','vending'].includes(m.role)))if(!this.design.markers.some(p=>p.id===m.id))this.design.markers.push(clone(m));this.design.sceneContentsVersion=2;}
  this.animator??=await locationPreviewAssets();
  const toolbar=el('div');toolbar.className='house-toolbar';root.append(toolbar);this.addLocationPicker(toolbar);
  const button=(text,fn)=>{const b=el('button',text);b.onclick=async()=>{try{await fn();}catch(e){this.message(e.message);}};toolbar.append(b);return b;};
  const name=el('input');name.value=this.design.name;name.ariaLabel='Location name';name.maxLength=60;name.onchange=()=>{this.snapshot();this.design.name=name.value;this.draw();};toolbar.append(name);
  button('Save & use in game',async()=>{await saveLocationDesign(this.design);window.dispatchEvent(new CustomEvent('wildbound-location-applied',{detail:{id:this.id}}));this.message('Saved. Applies to new visits; current room progress is preserved.');});
  button('Undo',()=>{if(this.undo.length){this.redo.push(JSON.stringify(this.design));this.design=JSON.parse(this.undo.pop());this.selected=null;this.draw();this.inspect();}});
  button('Redo',()=>{if(this.redo.length){this.undo.push(JSON.stringify(this.design));this.design=JSON.parse(this.redo.pop());this.selected=null;this.draw();this.inspect();}});
  button('Reset draft to template',()=>{this.snapshot();this.design=clone(template);this.selected=null;this.draw();this.inspect();});
  button('Export',()=>{const error=validateLocationDesign(this.design);if(error)throw Error(error);const a=el('a');a.download=this.id+'-layout.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(this.design,null,2)],{type:'application/json'}));a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  const file=el('input');file.type='file';file.accept='.json';file.ariaLabel='Import location layout';file.onchange=async()=>{try{const d=JSON.parse(await file.files[0].text());if(d.id!==this.id)throw Error('Choose the matching location before importing.');const error=validateLocationDesign(d);if(error)throw Error(error);this.snapshot();this.design=d;this.draw();this.inspect();}catch(e){this.message(e.message);}};toolbar.append(file);
  button('Fit scene',()=>{this.zoom=Math.min(952/(this.design.width*16),692/(this.design.height*16))/(['storage','temple-upper'].includes(this.id)?.5:1);this.pan={x:0,y:0};this.draw();});button('100% · house scale',()=>{this.zoom=1;this.pan={x:0,y:0};this.draw();});button('Zoom −',()=>{this.zoom=Math.max(.25,this.zoom-.25);this.draw();});button('Zoom +',()=>{this.zoom=Math.min(4,this.zoom+.25);this.draw();});
  const body=el('div');body.className='house-workspace';root.append(body);this.canvas=el('canvas');this.canvas.width=1000;this.canvas.height=740;this.canvas.ariaLabel=this.design.name+' layout';this.canvas.tabIndex=0;body.append(this.canvas);
  const side=el('aside');side.append(el('h3','Build this location'));body.append(side);
  const tool=el('select');tool.ariaLabel='Location building tool';for(const value of ['select','floor','wall','light','prop','exit',...(this.id==='storage'?[]:['enemy','chest']),...(this.id==='mausoleum'?['coffin','pit']:[])])tool.append(new Option(value,value));tool.value=this.tool;tool.onchange=()=>this.tool=tool.value;side.append(tool);
  this.prop=el('select');this.prop.ariaLabel='Room prop';for(const kind of ['statue','arch','bones','roots','crystal','web','torch','jade_aisle','crypt_web','crypt_chain','crypt_crate','crypt_barrel','crypt_rubble','crypt_altar','crypt_rune','crypt_arch','crypt_door','crypt_obelisk','crypt_abyss_altar'])this.prop.add(new Option(kind,kind));side.append(this.prop);
  this.objects=el('div');this.objects.className='location-object-list';this.objects.style='max-height:260px;overflow:auto;display:grid;gap:4px';side.append(el('h4','Scene contents'),this.objects);
  this.enemy=el('select');this.enemy.ariaLabel='Interior enemy kind';for(const kind of['skeleton','archer','skeleton_wizard','zombie','ghost','spider','bat','crypt_skeleton_boss'])this.enemy.append(new Option(kind,kind));side.append(this.enemy);
  side.append(el('p','Drag to paint floor or walls. Select and drag objects to move them. Edit exact positions below. Exit, chest and coffin markers keep their gameplay roles.'));
  this.inspector=el('div');side.append(this.inspector);this.status=el('p','Draft recovers automatically. Save & use activates the location.');this.status.role='status';root.append(this.status);
  const point=e=>{const r=this.canvas.getBoundingClientRect();return{x:Math.floor(((e.clientX-r.left)/r.width*this.canvas.width-this.offset.x)/this.scale),y:Math.floor(((e.clientY-r.top)/r.height*this.canvas.height-this.offset.y)/this.scale)};};
  this.canvas.onpointerdown=e=>{if(e.button===1||e.shiftKey){this.panning={x:e.clientX,y:e.clientY,pan:{...(this.pan||{x:0,y:0})}};this.canvas.setPointerCapture(e.pointerId);return;}if(e.button!==0)return;this.snapshot();this.painting=true;this.canvas.setPointerCapture(e.pointerId);this.act(point(e));};
  this.canvas.onpointermove=e=>{if(this.panning){const r=this.canvas.getBoundingClientRect();this.pan={x:this.panning.pan.x+(e.clientX-this.panning.x)/r.width*this.canvas.width,y:this.panning.pan.y+(e.clientY-this.panning.y)/r.height*this.canvas.height};this.draw();return;}if(this.painting)this.act(point(e),true);};this.canvas.onpointerup=()=>{this.panning=null;this.painting=false;this.inspect();};
  this.canvas.onwheel=e=>{e.preventDefault();this.zoom=Math.max(.25,Math.min(6,this.zoom*(e.deltaY<0?1.12:1/1.12)));this.draw();};
  this.canvas.onkeydown=e=>{if(e.key==='Delete'&&this.selected){this.snapshot();if(!['storage_chest','robot','vending'].includes(this.selected.role))this.design.markers=this.design.markers.filter(m=>m!==this.selected);this.selected=null;this.draw();this.inspect();}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();[...toolbar.querySelectorAll('button')].find(b=>b.textContent==='Undo').click();}};
  this.draw();this.inspect();
 }
 addLocationPicker(toolbar){const select=el('select');select.ariaLabel='Edit location';select.append(new Option('House','house'));for(const def of EDITABLE_LOCATIONS)select.append(new Option(def.name,def.id));select.value=this.id;select.onchange=async()=>{if(this.design)preserveLocationDraft(this.design);await flushLocationStorage();if(select.value==='house')new HouseBuilder().mount(this.root);else new LocationEditor(select.value).mount(this.root);};toolbar.prepend(select);}
 snapshot(){this.undo.push(JSON.stringify(this.design));if(this.undo.length>60)this.undo.shift();this.redo=[];}
 message(text){if(this.status)this.status.textContent=text;}
 act(p,drag=false){const d=this.design,x=Math.floor(p.x/16),y=Math.floor(p.y/16);if(x<1||y<1||x>=d.width-1||y>=d.height-1)return;
  if(this.tool==='floor'||this.tool==='wall'||this.tool==='pit')d.tiles[y*d.width+x]=this.tool==='floor'?1:this.tool==='pit'?2:0;
  else if(this.tool==='select'){if(!drag)this.selected=d.markers.find(m=>Math.hypot(m.x-p.x,m.y-p.y)<12)||null;else if(this.selected){this.selected.x=x*16+8;this.selected.y=y*16+8;}}
  else if(!drag){const existing=['exit','chest','coffin'].includes(this.tool)&&d.markers.find(m=>m.role===this.tool);if(existing){existing.x=x*16+8;existing.y=y*16+8;this.selected=existing;}else{this.selected={id:this.tool+'-'+Date.now(),role:this.tool,x:x*16+8,y:y*16+8,...(this.tool==='enemy'?{kind:this.enemy.value,hp:60}:this.tool==='prop'?{kind:this.prop.value}:{})};d.markers.push(this.selected);}}
  this.draw();if(!drag)this.inspect();
 }
 inspect(){this.inspector.replaceChildren();const m=this.selected;if(!m)return;this.inspector.append(el('h4',m.role));for(const key of['x','y',...(m.role==='enemy'?['hp']:[])]){const label=el('label',key.toUpperCase()),input=el('input');input.type='number';input.step=key==='hp'?1:8;input.value=m[key]||60;input.onchange=()=>{this.snapshot();m[key]=Number(input.value);this.draw();};label.append(input);this.inspector.append(label);}if(m.role==='enemy'){for(const key of ['speed','damage']){const l=el('label',key),input=el('input');input.type='number';input.min=0;input.value=m.actor?.[key]||0;input.onchange=()=>{this.snapshot();m.actor??={};m.actor[key]=Number(input.value);this.draw();};l.append(input);this.inspector.append(l);}}
  if(m.role==='chest'){const label=el('label','Chest loot (item × quantity, one per line)'),text=el('textarea');text.value=(m.data?.items||[]).filter(Boolean).map(i=>i.type+' '+i.qty).join('\n');text.onchange=()=>{this.snapshot();m.data??={};m.data.items=text.value.split(/\n/).filter(Boolean).map(line=>{const [type,qty]=line.trim().split(/\s+/);return{type,qty:Math.max(1,Number(qty)||1)};});this.draw();};label.append(text);this.inspector.append(label);}
  const del=el('button','Remove selected');del.disabled=['storage_chest','robot','vending'].includes(m.role);del.onclick=()=>{this.snapshot();this.design.markers=this.design.markers.filter(x=>x!==m);this.selected=null;this.inspect();this.draw();};this.inspector.append(del);}
 draw(){const d=this.design,c=this.canvas.getContext('2d');this.scale=this.zoom*(['storage','temple-upper'].includes(d.id)?.5:1);this.offset={x:(1000-d.width*16*this.scale)/2+(this.pan?.x||0),y:(740-d.height*16*this.scale)/2+(this.pan?.y||0)};c.resetTransform();c.fillStyle='#10251e';c.fillRect(0,0,1000,740);c.translate(this.offset.x,this.offset.y);c.scale(this.scale,this.scale);
  c.imageSmoothingEnabled=false;drawLocationScene(c,d,this.animator);
  c.font=12/this.scale+'px sans-serif';c.textAlign='center';for(const m of d.markers)if(['enemy','chest','exit','coffin','robot','vending'].includes(m.role)){c.fillStyle='#10251e';c.fillText(m.kind||m.role,m.x+.8,m.y-19+.8);c.fillStyle=m.role==='enemy'?'#edba93':'#d9e4bc';c.fillText(m.kind||m.role,m.x,m.y-19);}
  for(const m of d.markers)if(m===this.selected){c.strokeStyle='#ffeaa5';c.lineWidth=1/this.scale;c.strokeRect(m.x-12,m.y-16,24,24);}
  if(this.objects){this.objects.replaceChildren();for(const m of d.markers){const b=el('button',(m.kind||m.role)+(m.index!=null?' '+(m.index+1):''));b.style.textAlign='left';b.onclick=()=>{this.selected=m;this.inspect();this.draw();};this.objects.append(b);}}
  preserveLocationDraft(d);const error=validateLocationDesign(d);this.message(error?'Draft · '+error:'Draft saved · all objects reachable');
 }
}
