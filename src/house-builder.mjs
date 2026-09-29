import {defaultHouse,houseLibrary,LOW_FURNITURE,furnitureHeight,upgradeHouseFeatures,saveHouseVersion,activateHouse,validateHouse,carveDoor,contains,houseDraft,preserveHouseDraft,flushHouseStorage} from './house-design.mjs';
import {drawFurniture} from './house-render.mjs';
const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const groups=['floors','paths','pools','walls','doors','furniture','trees'];
export class HouseBuilder {
 constructor(){const lib=houseLibrary();this.id=lib.active;this.house=structuredClone((lib.designs.find(d=>d.id===lib.active)||lib.designs[0]).house);this.undo=[];this.redo=[];this.tool='select';this.view={zoom:1,x:800,y:800};const draft=houseDraft();if(draft?.house&&groups.every(k=>Array.isArray(draft.house[k]))){this.id=draft.id;this.house=upgradeHouseFeatures(structuredClone(draft.house));}}
 snapshot(){this.undo.push(JSON.stringify(this.house));if(this.undo.length>60)this.undo.shift();this.redo=[];}
 message(text){this.status.textContent=text;}
 mount(root){this.root=root;root.className='house-builder';root.replaceChildren();
 const toolbar=node('div');toolbar.className='house-toolbar';root.append(toolbar);
 const button=(text,fn)=>{const b=node('button',text);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){this.message('Not applied: '+e.message);}finally{b.disabled=false;}};toolbar.append(b);return b;};
 const versions=node('select');versions.setAttribute('aria-label','Saved house version');for(const d of houseLibrary().designs){const o=node('option',d.house.name);o.value=d.id;o.selected=d.id===this.id;versions.append(o);}versions.onchange=()=>{this.snapshot();this.id=versions.value;this.house=structuredClone(houseLibrary().designs.find(d=>d.id===this.id).house);this.selected=null;this.mount(root);};toolbar.append(versions);
 this.name=node('input');this.name.value=this.house.name;this.name.maxLength=60;this.name.setAttribute('aria-label','House design name');this.name.onchange=()=>{this.snapshot();this.house.name=this.name.value;this.draw();};toolbar.append(this.name);
 const commit=async(asNew=false)=>{
  this.house.name=this.name.value;this.id=saveHouseVersion(this.house,asNew?null:this.id);
  preserveHouseDraft(this.house,this.id);await flushHouseStorage();
  const detail={message:'Saved and active for House expeditions.'};window.dispatchEvent(new CustomEvent('wildbound-house-applied',{detail}));
  this.mount(root);this.message(detail.message);
 };
 button('Save & use in game',()=>commit());
 button('Save as new',()=>commit(true));
 button('Use this version',()=>commit());
 this.saveState=node('strong');this.saveState.className='house-save-state';this.saveState.setAttribute('role','status');toolbar.append(this.saveState);
 button('Undo',()=>{if(!this.undo.length)return;this.redo.push(JSON.stringify(this.house));this.house=JSON.parse(this.undo.pop());this.selected=null;this.mount(root);});
 button('Redo',()=>{if(!this.redo.length)return;this.undo.push(JSON.stringify(this.house));this.house=JSON.parse(this.redo.pop());this.selected=null;this.mount(root);});
 button('New from template',()=>{this.snapshot();this.id=null;this.house=defaultHouse();this.house.name='New house';this.selected=null;this.mount(root);});
 button('Export',()=>{this.house.name=this.name.value;if(!validateHouse(this.house))throw Error('Save a valid layout before exporting.');const a=node('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(this.house,null,2)],{type:'application/json'}));a.download=this.house.name.replace(/[^\w-]/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 const label=node('label','Import house '),file=node('input');file.type='file';file.accept='.json';file.onchange=async()=>{try{const h=JSON.parse(await file.files[0].text());if(!validateHouse(h))throw Error('Invalid layout. Keep the board starting area clear.');this.snapshot();this.house=h;this.id=null;this.selected=null;this.mount(root);this.message('Imported. Save as new to keep this house.');}catch(e){this.message(e.message);}};label.append(file);toolbar.append(label);
 button('Zoom −',()=>this.setZoom(this.view.zoom-.1));
 button('100%',()=>this.resetView());
 button('Zoom +',()=>this.setZoom(this.view.zoom+.1));
 const viewHint=node('span','Wheel: zoom · middle-drag or Shift-drag: pan');viewHint.className='house-view-hint';toolbar.append(viewHint);
 const body=node('div');body.className='house-workspace';root.append(body);this.canvas=node('canvas');this.canvas.width=this.canvas.height=800;this.canvas.setAttribute('aria-label','House map. Select a tool and drag to build; edit precise positions in the inspector.');body.append(this.canvas);
 const side=node('aside');body.append(side);side.append(node('h3','Build your house'));
 const tools=node('select');tools.setAttribute('aria-label','Building tool');for(const t of ['select','erase','floor','wall','fence','door horizontal','door vertical','pool','path','tree','furniture']){const o=node('option',t);o.value=t;o.selected=t===this.tool;tools.append(o);}tools.onchange=()=>this.tool=tools.value;side.append(tools);
 this.furniture=node('select');this.furniture.setAttribute('aria-label','Furniture type');for(const kind of ['sofa','bed','bookcase','table','chair','desk','counter','sink','stove','dresser','rug','plant','mailbox','bench'])this.furniture.append(node('option',kind));side.append(this.furniture);
 side.append(node('p','Drag to place rooms, walls, fences, water and furniture. Doors cut an opening in a wall. Select and drag objects to move them. Drag the gold corner handles to resize. Rotate and duplicate in the inspector.'));
 this.inspector=node('div');side.append(this.inspector);const add=node('button','Add object (edit position below)');add.onclick=()=>this.place({x:1152,y:1152},{x:1216,y:1216});side.append(add);
 side.append(node('p','Gold area: keep clear for the board and party. The blue pool is deep water. Monkeys and skeletons can open doors; animals cannot. Dragons cannot fit through normal doors.'));
 this.status=node('p','Drafts recover automatically. Save & use applies the visible layout to your current House expedition and future House maps.');this.status.role='status';root.append(this.status);
 this.canvas.tabIndex=0;
 const point=e=>{const r=this.canvas.getBoundingClientRect(),scale=.5*this.view.zoom,sx=(e.clientX-r.left)/r.width*this.canvas.width,sy=(e.clientY-r.top)/r.height*this.canvas.height;return {x:(sx-this.canvas.width/2)/scale+this.view.x,y:(sy-this.canvas.height/2)/scale+this.view.y};};
 this.canvas.onwheel=e=>{e.preventDefault();this.zoomAt(e.clientX,e.clientY,e.deltaY<0?.1:-.1);};
 this.canvas.onpointerdown=e=>{if(e.button===1||e.button===2||(e.button===0&&e.shiftKey)){this.panStart(e);this.canvas.focus();try{this.canvas.setPointerCapture(e.pointerId);}catch{}this.canvas.style.cursor='grabbing';return;}if(e.button!==0)return;const p=point(e);this.canvas.focus();try{this.canvas.setPointerCapture(e.pointerId);}catch{}this.pointerStart(p);};
 this.canvas.onpointermove=e=>{if(this.panDrag){this.panMove(e);return;}const p=point(e);if(this.drag)this.pointerMove(p);else this.canvas.style.cursor=this.tool==='select'?(this.handleAt(p)?'nwse-resize':this.hit(p)?'grab':'default'):'crosshair';};
 this.canvas.onpointerup=e=>{if(this.panDrag){this.panEnd(e);return;}this.pointerEnd(point(e));};
 this.canvas.oncontextmenu=e=>e.preventDefault();
 this.canvas.onpointercancel=()=>{if(this.panDrag){this.panEnd();return;}if(this.drag?.changed){this.house=JSON.parse(this.undo.pop());this.selected=null;}this.drag=null;this.from=null;this.inspect();this.draw();};
 this.canvas.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();[...toolbar.querySelectorAll('button')].find(b=>b.textContent===(e.shiftKey?'Redo':'Undo'))?.click();}if(e.key==='Escape')this.canvas.onpointercancel();};
 this.inspect();this.draw();
 }
 bounds(){if(!this.selected)return null;const r=this.selected.item;return this.selected.key==='trees'?{x:r.x-r.size*.4,y:r.y-r.size*.4,w:r.size*.8,h:r.size*.8}:r;}
 hit(p){let found=null;for(const key of groups)for(const item of this.house[key])if(key==='trees'?Math.hypot(item.x-p.x,item.y-p.y)<item.size*.4:contains(item,p.x,p.y))found={key,item};return found;}
 handleAt(p){const r=this.bounds();if(!r)return null;if(p.x>r.x+r.w*.25&&p.x<r.x+r.w*.75&&p.y>r.y+r.h*.25&&p.y<r.y+r.h*.75)return null;const tolerance=10/(.5*this.view.zoom);return [{x:r.x,y:r.y,name:'nw'},{x:r.x+r.w,y:r.y,name:'ne'},{x:r.x,y:r.y+r.h,name:'sw'},{x:r.x+r.w,y:r.y+r.h,name:'se'}].find(h=>Math.hypot(p.x-h.x,p.y-h.y)<tolerance);}
 setZoom(zoom){this.view.zoom=Math.max(.35,Math.min(2.4,Math.round(zoom*100)/100));this.draw();}
 resetView(){this.view={zoom:1,x:800,y:800};this.draw();}
 zoomAt(clientX,clientY,delta){const r=this.canvas.getBoundingClientRect(),before=this.pointAt(clientX,clientY),zoom=Math.max(.35,Math.min(2.4,Math.round((this.view.zoom+delta)*100)/100));if(zoom===this.view.zoom)return;this.view.zoom=zoom;const after=this.pointAt(clientX,clientY);this.view.x+=before.x-after.x;this.view.y+=before.y-after.y;this.draw();}
 pointAt(clientX,clientY){const r=this.canvas.getBoundingClientRect(),scale=.5*this.view.zoom,sx=(clientX-r.left)/r.width*this.canvas.width,sy=(clientY-r.top)/r.height*this.canvas.height;return {x:(sx-this.canvas.width/2)/scale+this.view.x,y:(sy-this.canvas.height/2)/scale+this.view.y};}
 panStart(e){this.panDrag={clientX:e.clientX,clientY:e.clientY,x:this.view.x,y:this.view.y};}
 panMove(e){const d=this.panDrag,r=this.canvas.getBoundingClientRect(),scale=.5*this.view.zoom;this.view.x=d.x-(e.clientX-d.clientX)/r.width*this.canvas.width/scale;this.view.y=d.y-(e.clientY-d.clientY)/r.height*this.canvas.height/scale;this.draw();}
 panEnd(){this.panStart=null;this.panDrag=null;this.canvas.style.cursor='default';}
 pointerStart(p){
  if(this.tool!=='select'){this.from=p;return;}
  const handle=this.handleAt(p);if(!handle)this.selected=this.hit(p);
  this.inspect();this.draw();if(!this.selected)return;
  this.drag={start:p,original:{...this.selected.item},handle:handle?.name,changed:false};this.canvas.style.cursor=handle?'nwse-resize':'grabbing';
 }
 pointerMove(p){const d=this.drag;if(!d||!this.selected)return;const dx=Math.round((p.x-d.start.x)/16)*16,dy=Math.round((p.y-d.start.y)/16)*16;if(!d.changed&&!dx&&!dy)return;if(!d.changed){this.snapshot();d.changed=true;}const r=this.selected.item,o=d.original;
  if(!d.handle){r.x=Math.max(16,Math.min(1584-(r.w||32),o.x+dx));r.y=Math.max(16,Math.min(1584-(r.h||32),o.y+dy));}
  else if(this.selected.key==='trees')r.size=Math.max(32,Math.min(160,o.size+(d.handle.includes('e')?dx:-dx)*2));
  else {let left=o.x,top=o.y,right=o.x+o.w,bottom=o.y+o.h;if(d.handle.includes('w'))left=Math.max(16,Math.min(right-16,o.x+dx));else right=Math.min(1584,Math.max(left+16,o.x+o.w+dx));if(d.handle.includes('n'))top=Math.max(16,Math.min(bottom-16,o.y+dy));else bottom=Math.min(1584,Math.max(top+16,o.y+o.h+dy));Object.assign(r,{x:left,y:top,w:right-left,h:bottom-top});}
  this.inspect();this.draw();this.message('Drag to move · corner handles resize · snapped to 16 pixels · Undo available');
 }
 finishDoor(original){if(this.selected?.key!=='doors')return;const item=this.selected.item;this.house.doors=this.house.doors.filter(d=>d!==item);this.house.walls.push({x:original.x,y:original.y,w:original.w,h:original.h,kind:original.kind==='gate'?'fence':'wall'});carveDoor(this.house,item);}
 pointerEnd(p){if(this.drag){if(this.drag.changed)this.finishDoor(this.drag.original);this.drag=null;this.canvas.style.cursor='grab';this.inspect();this.draw();}else if(this.from){const snap=p=>({x:Math.max(16,Math.min(1536,Math.round(p.x/16)*16)),y:Math.max(16,Math.min(1536,Math.round(p.y/16)*16))});this.place(snap(this.from),snap(p));}this.from=null;}
 place(a,b){
 if(['select','erase'].includes(this.tool)){let found=null;for(const key of groups)for(const item of this.house[key])if(key==='trees'?Math.hypot(item.x-b.x,item.y-b.y)<32:contains(item,b.x,b.y))found={key,item};if(found&&this.tool==='erase'){this.snapshot();this.house[found.key]=this.house[found.key].filter(i=>i!==found.item);found=null;}this.selected=found;this.inspect();this.draw();return;}
 this.snapshot();let r={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.max(16,Math.abs(a.x-b.x)),h:Math.max(16,Math.abs(a.y-b.y))},key;
 if(this.tool==='pool')r.waterType='pool';
 if(this.tool==='tree'){key='trees';r={x:a.x,y:a.y,size:80};}
 else if(this.tool.startsWith('door')){r={x:a.x,y:a.y,w:this.tool.endsWith('horizontal')?64:16,h:this.tool.endsWith('horizontal')?16:64,open:false};carveDoor(this.house,r);key='doors';}
 else {key=({floor:'floors',wall:'walls',fence:'walls',pool:'pools',path:'paths',furniture:'furniture'})[this.tool];if(!key)return;if(['wall','fence'].includes(this.tool)){r.kind=this.tool;if(r.w>=r.h)r.h=16;else r.w=16;}if(this.tool==='furniture')r.kind=this.furniture.value;this.house[key].push(r);}
 if(key==='trees')this.house.trees.push(r);this.selected={key,item:r};this.inspect();this.draw();this.message('Unsaved changes. Save a version to use this layout.');
 }
 inspect(){this.inspector.replaceChildren();if(!this.selected)return;const {item,key}=this.selected;this.inspector.append(node('h4',item.kind||key));for(const k of ['x','y',...(key==='trees'?['size']:['w','h'])]){const l=node('label',k.toUpperCase()),input=node('input');input.type='number';input.min=8;input.max=1584;input.step=16;input.value=item[k];input.onchange=()=>{const value=Number(input.value);if(!Number.isFinite(value))return;this.snapshot();item[k]=value;this.draw();this.message('Unsaved position change.');};l.append(input);this.inspector.append(l);}const del=node('button','Remove selected');del.onclick=()=>{this.snapshot();this.house[key]=this.house[key].filter(i=>i!==item);this.selected=null;this.inspect();this.draw();};this.inspector.append(del);
 if(key==='trees')for(const [property,options] of [['treeType',['auto','oak','birch','pine']],['leafHabit',['auto','evergreen','deciduous']]]){const label=node('label',property==='treeType'?'Tree type':'Leaf habit'),select=node('select');for(const value of options)select.append(new Option(value,value));select.value=item[property]||'auto';select.onchange=()=>{this.snapshot();if(select.value==='auto')delete item[property];else item[property]=select.value;this.draw();this.message('Unsaved tree change.');};label.append(select);this.inspector.append(label);}
 const rotate=node('button','Rotate 90°');rotate.disabled=key==='trees';rotate.onclick=()=>{this.snapshot();const old={...item};[item.w,item.h]=[item.h,item.w];this.finishDoor(old);this.inspect();this.draw();};
 const copy=node('button','Duplicate');copy.onclick=()=>{this.snapshot();const duplicate={...item,x:Math.min(1504,item.x+32),y:Math.min(1504,item.y+32)};if(key==='doors')carveDoor(this.house,duplicate);else this.house[key].push(duplicate);this.selected={key,item:duplicate};this.inspect();this.draw();};this.inspector.append(rotate,copy);
 if(key==='furniture'&&LOW_FURNITURE[item.kind]){const label=node('label','Jumpable surface'),toggle=node('input');toggle.type='checkbox';toggle.checked=furnitureHeight(item)>0;toggle.onchange=()=>{this.snapshot();item.jumpable=toggle.checked;item.surfaceHeight=LOW_FURNITURE[item.kind];this.draw();};label.append(toggle);this.inspector.append(label);}else if(key==='walls'||key==='doors'||item.kind==='bookcase'){this.inspector.append(node('p',item.kind==='window'?'Glass window: break the pane to shoot through. Blocks movement.':'Tall obstacle: cannot jump onto this.'));}

}
 draw(){
 preserveHouseDraft(this.house,this.id);
 if(this.saveState){const lib=houseLibrary(),saved=lib.designs.find(d=>d.id===this.id),dirty=!saved||JSON.stringify(saved.house)!==JSON.stringify(this.house);this.saveState.textContent=dirty?'Draft saved · not applied':lib.active===this.id?'Active layout: '+this.house.name:'Saved · not active';this.saveState.style.color=dirty?'#f3cb79':'#a8d6bb';}
 const c=this.canvas.getContext('2d'),scale=.5*this.view.zoom;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(scale,0,0,scale,this.canvas.width/2-this.view.x*scale,this.canvas.height/2-this.view.y*scale);c.fillStyle='#173c2c';c.fillRect(-this.canvas.width/scale,-this.canvas.height/scale,this.canvas.width*2/scale,this.canvas.height*2/scale);for(const [key,color] of [['floors','#aa8960'],['paths','#928769'],['pools','#256379'],['walls','#bdc7be'],['doors','#b7834d']])for(const r of this.house[key]){c.fillStyle=r.kind==='window'?'#80c4d2':r.kind==='fence'?'#987448':color;c.fillRect(r.x,r.y,r.w,r.h);}for(const f of this.house.furniture)drawFurniture(c,f);for(const t of this.house.trees){c.fillStyle='#61954e';c.beginPath();c.arc(t.x,t.y,t.size*.4,0,7);c.fill();}c.strokeStyle='#ffffff0d';c.lineWidth=1;for(let n=0;n<=1600;n+=32){c.beginPath();c.moveTo(n,0);c.lineTo(n,1600);c.moveTo(0,n);c.lineTo(1600,n);c.stroke();}c.fillStyle='#d8bd4830';c.fillRect(700,700,200,178);c.fillStyle='#f3dfa0';c.font='18px sans-serif';c.textAlign='center';c.fillText('BOARD & PARTY',800,792);if(this.selected){const r=this.bounds();c.strokeStyle='#ffe28c';c.lineWidth=4;c.strokeRect(r.x,r.y,r.w,r.h);const size=8/scale;c.fillStyle='#ffe28c';for(const [x,y] of [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]]){c.fillRect(x-size/2,y-size/2,size,size);c.strokeStyle='#173c2c';c.lineWidth=2;c.strokeRect(x-size/2,y-size/2,size,size);}}}
}
