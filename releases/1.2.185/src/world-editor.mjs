import {REALM_ASSETS} from './realm-layout.mjs';
import {readWorldDesign,writeWorldDesign,worldLevel} from './world-authoring.mjs';
import {generateSceneShadowMaps,decodeHeightPlane,encodeHeightPlane,paintShadowMap,validShadowMaps,buildShadowMask,resampleShadowMaps} from './realtime-shadows.mjs';

const el=(tag,text='')=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const NPCS=[['fern','Fern · seed keeper'],['bram','Bram · sign painter'],['poppy','Poppy · village news'],['milo','Milo · clock mender'],['theo','Theo · apprentice baker'],['wren','Wren · map maker'],['rowan','The Keeper · quest giver']];
export class WorldEditor{
 constructor({openQuests=()=>{}}={}){this.openQuests=openQuests;this.project=readWorldDesign();this.levelId='forest';this.sceneId='heartwood-village';this.section='Overview';}
 mount(root){this.root=root;this.draw();}
 save(message='Saved locally · changes apply to newly visited forest scenes.'){writeWorldDesign(this.project);this.status.textContent=message;}
 button(parent,label,fn,cls=''){const b=el('button',label);b.type='button';if(cls)b.className=cls;b.onclick=fn;parent.append(b);return b;}
 field(parent,label,value,onchange,{type='text',min,max,step}={}){const wrap=el('label',label),input=el('input');input.type=type;input.value=value??'';if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;if(step!==undefined)input.step=step;input.onchange=()=>onchange(type==='number'?Number(input.value):input.value);wrap.append(input);parent.append(wrap);return input;}
 draw(){
  const root=this.root;root.replaceChildren();root.className='world-editor';
  const head=el('header');head.append(el('div','WORLD AUTHORING · EXPLORATION MODE'),el('p','Build persistent, explorable worlds here. These scenes and ecosystems are independent of board encounters.'));root.append(head);
  const bar=el('div');bar.className='world-editor-levels';bar.append(el('strong','LEVELS'));
  for(const level of this.project.levels){const b=this.button(bar,level.name,()=>{this.levelId=level.id;this.sceneId=level.scenes[0]?.id||'';this.draw();});b.setAttribute('aria-pressed',String(level.id===this.levelId));}
  this.button(bar,'＋ Level',()=>this.addLevel());root.append(bar);
  const level=worldLevel(this.project,this.levelId);if(!level)return;
  const tabs=el('nav');for(const name of ['Overview','Scenes','NPCs','Ecology','Shadows']){const b=this.button(tabs,name,()=>{this.section=name;this.draw();});b.setAttribute('aria-pressed',String(name===this.section));}root.append(tabs);
  const panel=el('section');panel.className='world-editor-panel';root.append(panel);
  if(this.section==='Overview')this.overview(panel,level);
  if(this.section==='Scenes')this.scenes(panel,level);
  if(this.section==='NPCs')this.npcs(panel,level);
  if(this.section==='Ecology')this.ecology(panel,level);
  if(this.section==='Shadows')this.shadows(panel,level);
  const footer=el('footer');this.status=el('span','Edits are stored on this device.');footer.append(this.status);
  this.button(footer,'Save world design',()=>this.save());
  this.button(footer,'Edit quest dialogue & stages',()=>this.openQuests(),'world-editor-link');root.append(footer);
  const backup=el('details'),summary=el('summary','Advanced · JSON backup / restore'),area=el('textarea');area.rows=10;area.value=JSON.stringify(this.project,null,2);area.setAttribute('aria-label','World design JSON');backup.append(summary,area);
  this.button(backup,'Apply JSON',()=>{try{const next=JSON.parse(area.value);writeWorldDesign(next);this.project=next;this.draw();this.status.textContent='Valid design restored and saved.';}catch(e){this.status.textContent=e.message;}});root.append(backup);
 }
 addLevel(){const index=this.project.levels.length+1,level={id:`custom-${index}`,name:`New Level ${index}`,environment:'forest',prey:['mother_deer'],predators:['panther'],food:.7,water:.7,scenes:[]};this.project.levels.push(level);this.levelId=level.id;this.section='Overview';this.draw();}
 overview(parent,level){
  parent.append(el('h2',level.name));parent.append(el('p','Level identity, starting area and procedural-world identity. Forest is the starter level; add scenes to author places that stream in as players explore.'));
  this.field(parent,'Level name',level.name,v=>{level.name=v;this.save('Name updated.');});
  const env=el('label','Terrain generator'),select=el('select');for(const value of ['forest','temple','beach','graveyard','ice','desert','swamp','caverns','shadow']){const o=el('option',value[0].toUpperCase()+value.slice(1));o.value=value;select.append(o);}select.value=level.environment;select.onchange=()=>{level.environment=select.value;this.save('Terrain generator updated.');};env.append(select);parent.append(env);
  parent.append(el('p',`Starting scene: ${level.scenes.find(s=>s.initial)?.name||level.scenes[0]?.name||'Not assigned yet'}. Scenes are anchored to streamed world regions and retain stable IDs across visits.`));
  parent.append(el('aside','Ecology systems, scene placements, NPC positions, and dialogue are editable here or in the dedicated tabs. Quest stages and branching dialogue use the existing NPC & quests editor.'));
 }
 scenes(parent,level){
  parent.append(el('h2','Scene templates'),el('p','Scenes are authored in region coordinates, then loaded with that region. The starter village lives in the initial forest region; additional scenes can be placed in any region as the world expands.'));
  const row=el('div');row.className='world-editor-row';const pick=el('select');for(const scene of level.scenes){const o=el('option',scene.name);o.value=scene.id;pick.append(o);}if(level.scenes.some(s=>s.id===this.sceneId))pick.value=this.sceneId;else this.sceneId=level.scenes[0]?.id||'';pick.onchange=()=>{this.sceneId=pick.value;this.draw();};row.append(pick);this.button(row,'＋ Create scene',()=>this.addScene(level));this.button(row,'Remove scene',()=>{level.scenes=level.scenes.filter(s=>s.id!==this.sceneId);this.sceneId=level.scenes[0]?.id||'';this.draw();});parent.append(row);
  const scene=level.scenes.find(s=>s.id===this.sceneId);if(!scene){parent.append(el('p','No scene yet. Create one to begin.'));return;}
  this.field(parent,'Scene name',scene.name,v=>{scene.name=v;this.save('Scene renamed.');});
  const grid=el('div');grid.className='world-editor-grid';this.field(grid,'Region X',scene.regionX,v=>{scene.regionX=v;this.save();},{type:'number',min:-9999,max:9999,step:1});this.field(grid,'Region Y',scene.regionY,v=>{scene.regionY=v;this.save();},{type:'number',min:-9999,max:9999,step:1});this.field(grid,'Anchor X in region',scene.x,v=>{scene.x=v;this.save();},{type:'number',min:0,max:1600,step:16});this.field(grid,'Anchor Y in region',scene.y,v=>{scene.y=v;this.save();},{type:'number',min:0,max:1600,step:16});this.field(grid,'Scene radius',scene.radius,v=>{scene.radius=v;this.save();},{type:'number',min:32,max:800,step:16});parent.append(grid);
  this.field(parent,'Scene purpose',scene.description||'',v=>{scene.description=v;this.save();});
  const initial=el('label','Start the level here');const check=el('input');check.type='checkbox';check.checked=!!scene.initial;check.onchange=()=>{for(const other of level.scenes)other.initial=false;scene.initial=check.checked;this.save('Starting scene updated.');};initial.prepend(check);parent.append(initial);
  parent.append(el('h3','Placed scenery'),el('p','Props are relative to the scene anchor and are generated once per world region.'));
  for(const [i,prop]of scene.props.entries()){const card=el('div');card.className='world-editor-row';const kind=el('select');for(const k of ['forest_ruin','tree','bush','fern','rock','flower',...Object.values(REALM_ASSETS).flatMap(a=>Object.keys(a))]){const o=el('option',k.replaceAll('_',' '));o.value=k;kind.append(o);}kind.value=prop.kind;kind.onchange=()=>{prop.kind=kind.value;this.save();};card.append(kind);this.field(card,'Offset X',prop.dx,v=>{prop.dx=v;this.save();},{type:'number',min:-800,max:800,step:8});this.field(card,'Offset Y',prop.dy,v=>{prop.dy=v;this.save();},{type:'number',min:-800,max:800,step:8});this.button(card,'Remove',()=>{scene.props.splice(i,1);this.draw();});parent.append(card);}
  this.button(parent,'＋ Add scenery prop',()=>{scene.props.push({kind:'tree',dx:0,dy:0});this.draw();});
 }
 addScene(level){let n=1,id;do{id=`scene-${n++}`;}while(level.scenes.some(s=>s.id===id));const scene={id,name:`Scene ${n-1}`,regionX:0,regionY:0,x:800,y:800,radius:180,initial:false,description:'',npcs:[],props:[]};level.scenes.push(scene);this.sceneId=id;this.section='Scenes';this.draw();}
 shadows(parent,level){
  parent.append(el('h2','Realtime shadow assets'),el('p','Paint world-space height layers used by the shared sun-ray marcher. Stable ground height prevents jitter; Detail describes front-facing casters and Back fills hidden geometry. The shadow source is composited before ray tests so overlaps never erase one another.'));
  const row=el('div');row.className='world-editor-row';const pick=el('select');for(const scene of level.scenes){const o=el('option',scene.name);o.value=scene.id;pick.append(o);}if(level.scenes.some(s=>s.id===this.sceneId))pick.value=this.sceneId;else this.sceneId=level.scenes[0]?.id||'';pick.onchange=()=>{this.sceneId=pick.value;this.draw();};row.append(pick);
  const scene=level.scenes.find(s=>s.id===this.sceneId);if(!scene){parent.append(row,el('p','Create a scene first, then author its shadow planes.'));return;}parent.append(row);
  scene.shadowMaps ||= generateSceneShadowMaps(scene);
  if(scene.shadowMaps.width<512||scene.shadowMaps.height<512){scene.shadowMaps=resampleShadowMaps(scene.shadowMaps,512,512);this.save('Existing shadow maps enlarged to high resolution.');}
  let maps=scene.shadowMaps,plane='detail',brush=2,value=160,painting=false;
  const tools=el('div');tools.className='world-editor-row';const layer=el('select');for(const [id,label]of [['ground','Ground · stable base'],['detail','Detail · front height'],['back','Back · hidden geometry']]){const o=el('option',label);o.value=id;layer.append(o);}layer.value=plane;layer.onchange=()=>{plane=layer.value;draw();};tools.append(layer);
  const brushInput=this.field(tools,'Brush radius · pixels',brush,v=>{brush=Math.max(1,Math.min(16,v));},{type:'number',min:1,max:16,step:1});
  const valueInput=this.field(tools,'Height · 0–255',value,v=>{value=Math.max(0,Math.min(255,v));},{type:'number',min:0,max:255,step:1});
  const az=this.field(tools,'Sun direction · degrees',maps.lightAzimuth,v=>{maps.lightAzimuth=((v%360)+360)%360;this.save('Sun direction saved.');},{type:'number',min:0,max:359,step:1});
  const elev=this.field(tools,'Sun elevation',maps.lightElevation,v=>{maps.lightElevation=Math.max(5,Math.min(85,v));this.save('Sun elevation saved.');},{type:'number',min:5,max:85,step:1});parent.append(tools);
  const canvas=el('canvas');canvas.className='shadow-map-painter';canvas.width=maps.width;canvas.height=maps.height;canvas.setAttribute('aria-label',`${plane} height map brush editor`);canvas.title='Click and drag to paint. Right mouse button erases.';
  const preview=el('canvas');preview.className='shadow-map-preview';preview.width=maps.width;preview.height=maps.height;preview.setAttribute('aria-label','Realtime sun-ray shadow preview');parent.append(canvas,preview);
  const info=el('p',`${maps.width} × ${maps.height} world samples · ${maps.cellSize.toFixed(1)} world units/sample · 150-step maximum ray budget`);parent.append(info);
  const buttons=el('div');buttons.className='world-editor-row';this.button(buttons,'Regenerate from scene props',()=>{scene.shadowMaps=generateSceneShadowMaps(scene,maps.width,maps.height);this.save('Height maps regenerated from placed scenery.');this.draw();});
  this.button(buttons,'Clear this layer',()=>{maps={...maps,[plane]:encodeHeightPlane(new Uint8Array(maps.width*maps.height))};scene.shadowMaps=maps;this.save('Height layer cleared.');this.draw();});
  this.button(buttons,'Export height-map JSON',()=>{const blob=new Blob([JSON.stringify({scene:scene.id,shadowMaps:maps},null,2)],{type:'application/json'}),link=el('a');link.href=URL.createObjectURL(blob);link.download=`${scene.id}-shadow-maps.json`;link.click();URL.revokeObjectURL(link.href);});parent.append(buttons);
  const canvasCtx=canvas.getContext('2d',{willReadFrequently:true}),previewCtx=preview.getContext('2d'),draw=()=>{const planeData=decodeHeightPlane(maps[plane],maps.width*maps.height),ground=decodeHeightPlane(maps.ground,maps.width*maps.height),other=decodeHeightPlane(maps[plane==='detail'?'back':'detail'],maps.width*maps.height),img=canvasCtx.createImageData(maps.width,maps.height);for(let i=0;i<planeData.length;i++){const p=i*4,v=planeData[i];img.data[p]=plane==='ground'?Math.min(255,v+25):v;img.data[p+1]=plane==='ground'?Math.min(255,v+50):Math.max(v,Math.floor(ground[i]*.65));img.data[p+2]=plane==='back'?Math.max(v,Math.floor(other[i]*.4)):v;img.data[p+3]=255;}canvasCtx.putImageData(img,0,0);const mask=buildShadowMask(maps),shade=previewCtx.createImageData(maps.width,maps.height);for(let i=0;i<mask.length;i++){const p=i*4;shade.data[p]=0;shade.data[p+1]=0;shade.data[p+2]=0;shade.data[p+3]=mask[i];}previewCtx.putImageData(shade,0,0);};draw();
  const paint=e=>{const rect=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)/rect.width*maps.width),y=Math.floor((e.clientY-rect.top)/rect.height*maps.height);maps=paintShadowMap(maps,plane,[{x,y}],{radius:brush,value:e.buttons===2?0:value});scene.shadowMaps=maps;draw();this.save('Shadow map updated.');};
  canvas.oncontextmenu=e=>e.preventDefault();canvas.onpointerdown=e=>{painting=true;canvas.setPointerCapture(e.pointerId);paint(e);};canvas.onpointermove=e=>{if(painting)paint(e);};canvas.onpointerup=()=>{painting=false;};canvas.onpointercancel=()=>{painting=false;};
  this.field(parent,'Sun-ray sample steps',maps.raySteps,v=>{maps.raySteps=Math.max(1,Math.min(150,v));scene.shadowMaps=maps;this.save();},{type:'number',min:1,max:150,step:1});
  this.field(parent,'Ray height bias',maps.bias,v=>{maps.bias=Math.max(0,Math.min(64,v));scene.shadowMaps=maps;this.save();},{type:'number',min:0,max:64,step:1});
  this.field(parent,'Shadow opacity',maps.darkness,v=>{maps.darkness=Math.max(0,Math.min(.8,v));scene.shadowMaps=maps;this.save();},{type:'number',min:0,max:.8,step:.02});
  parent.append(el('aside','Workflow: generate from placed props → inspect Detail → paint the Back plane where front art hides a blocker → smooth Ground independently → set sun and ray quality → Save world design. Runtime uses one merged caster field and bounds its ray march to this scene asset.'));
  if(!validShadowMaps(maps))parent.append(el('p','Map data is invalid; regenerate this scene’s height maps before saving.'));
 }
 npcs(parent,level){
  parent.append(el('h2','People & quest giver'),el('p','NPCs are positioned relative to their scene. Heartwood begins with three local residents and The Keeper, whose quest is authored in NPC & quests.'));
  const scene=level.scenes.find(s=>s.id===this.sceneId)||level.scenes.find(s=>s.initial)||level.scenes[0];if(!scene){parent.append(el('p','Create a scene first.'));return;}
  const scenePicker=el('label','Scene');const select=el('select');for(const s of level.scenes){const o=el('option',s.name);o.value=s.id;select.append(o);}select.value=scene.id;select.onchange=()=>{this.sceneId=select.value;this.draw();};scenePicker.append(select);parent.append(scenePicker);
  for(const [i,npc]of scene.npcs.entries()){
   const card=el('article');card.className='world-editor-npc';const row=el('div');row.className='world-editor-row';const type=el('select');for(const [id,label]of NPCS){const o=el('option',label);o.value=id;type.append(o);}type.value=npc.id;type.onchange=()=>{npc.id=type.value;this.save();};row.append(type);this.field(row,'Offset X',npc.x,v=>{npc.x=v;this.save();},{type:'number',min:-800,max:800,step:8});this.field(row,'Offset Y',npc.y,v=>{npc.y=v;this.save();},{type:'number',min:-800,max:800,step:8});this.button(row,'Remove',()=>{scene.npcs.splice(i,1);this.draw();});card.append(row);parent.append(card);
  }
  this.button(parent,'＋ Add person',()=>{scene.npcs.push({id:'fern',x:0,y:0});this.draw();});
  if(scene.npcs.some(n=>n.id==='rowan'))this.button(parent,'Open The Keeper quest editor',()=>this.openQuests(),'world-editor-link');
 }
 ecology(parent,level){
  parent.append(el('h2','Forest ecosystem plan'),el('p','These controls define the offline population system: prey and predators replenish by region, predators hunt away from the party, and the world tracks food, water, weather and settlement condition over time.'));
  this.field(parent,'Prey species (comma separated)',level.prey.join(', '),v=>{level.prey=v.split(',').map(x=>x.trim()).filter(Boolean);this.save();});
  this.field(parent,'Predator species (comma separated)',level.predators.join(', '),v=>{level.predators=v.split(',').map(x=>x.trim()).filter(Boolean);this.save();});
  const grid=el('div');grid.className='world-editor-grid';this.field(grid,'Food availability',level.food,v=>{level.food=Math.max(0,Math.min(1,v));this.save();},{type:'number',min:0,max:1,step:.05});this.field(grid,'Water availability',level.water,v=>{level.water=Math.max(0,Math.min(1,v));this.save();},{type:'number',min:0,max:1,step:.05});parent.append(grid);
  for(const [title,desc]of [['Plants & regrowth','Harvestable flora is recorded by region and returns after three in-world days. Scene foliage is fixed and never affects the regional plant count.'],['Wildlife & food web','Prey replenishes to its regional target; predators track prey and hunt only when explorers are not nearby. Active actors stream in/out while dormant populations simulate offline.'],['Weather & water','Regional water, rain, storms and settlement condition advance on the persistent world clock. Values above tune initial conditions per level.']]){const details=el('details'),summary=el('summary',title);details.append(summary,el('p',desc));parent.append(details);}
 }
}
