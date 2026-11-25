import {SplitScreenMotion,drawSplitSeams} from './split-screen-motion.mjs';
import {CAMERA_DEFAULTS,MultiplayerCamera,cameraFit,cameraSettings,normalizeCameraSettings,saveCameraSettings} from './multiplayer-camera.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const smoothPreview=v=>{v=Math.max(0,Math.min(1,v||0));return v*v*(3-2*v);};
const colors=['#80dfc2','#f5bc72','#b4a1ff','#ec88af'];
export class CameraEditor {
 mount(root){
  this.stop();this.root=root;root.className='camera-editor';this.settings={...cameraSettings()};this.policy=new MultiplayerCamera();this.motion=new SplitScreenMotion();this.count=4;this.near();
  root.append(el('h3','Multiplayer camera'),el('p','Stay together in one view. At the zoom-out limit, distant groups get their own cameras. Regroup to merge. Maximum four views.'));
  const layout=el('div');layout.className='camera-editor-layout';const controls=el('section'),preview=el('section');layout.append(controls,preview);root.append(layout);
  const status=this.status=el('p','Saved settings apply to multiplayer exploration and train travel on this device.');status.setAttribute('role','status');
  const fields=[['Automatic splitting','enabled'],['Dynamic divider','dynamicSplit'],['Reduced motion','reducedMotion'],['Divider response','seamResponse',5,22,.5],['Pulse strength','seamPulse',0,1,.05],['Split reveal (seconds)','splitDuration',.5,1.1,.05],['Regroup fade (seconds)','mergeFade',.2,1,.05],['Zoom-out limit (minimum zoom)','minZoom',.25,2,.05],['Closest view (maximum zoom)','maxZoom',.5,3,.05],['Player margin (world pixels)','padding',24,150,1],['Merge distance ratio','mergeRatio',.5,.95,.01],['Regroup wait (seconds)','mergeDelay',0,3,.1],['Camera follow speed','followSpeed',1,15,.5],['Divider width','divider',1,8,1],['Two-view layout','twoLayout',['auto','vertical','horizontal']],['Three-view layout','threeLayout',['wide','tall']]];
  for(const [label,key,min,max,step] of fields){const row=el('label',label),input=el(Array.isArray(min)?'select':'input');input.dataset.cameraSetting=key;
   if(Array.isArray(min)){for(const value of min)input.append(new Option(({auto:'Automatic',vertical:'Side by side',horizontal:'Stacked',wide:'Wide top + two below',tall:'Tall left + two right'})[value],value));input.value=this.settings[key];}
   else if(['enabled','dynamicSplit','reducedMotion'].includes(key)){input.type='checkbox';input.checked=this.settings[key];}
   else{input.type='number';input.min=min;input.max=max;input.step=step;input.value=this.settings[key];}
   input.onchange=()=>{this.settings=normalizeCameraSettings({...this.settings,[key]:['enabled','dynamicSplit','reducedMotion'].includes(key)?input.checked:input.tagName==='SELECT'?input.value:Number(input.value)});for(const field of controls.querySelectorAll('input[type=number]'))field.value=this.settings[field.dataset.cameraSetting];this.policy=new MultiplayerCamera();status.textContent='Preview changed. Save camera settings to use these in the game.';};row.append(input);controls.append(row);
  }
  const actions=el('div');actions.className='camera-actions';const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;actions.append(b);};
  button('Save camera settings',()=>{try{this.settings=saveCameraSettings(this.settings);status.textContent='Camera settings saved. The game uses them immediately.';}catch(e){status.textContent='Could not save: '+e.message;}});
  button('Reset preview defaults',()=>{this.settings={...CAMERA_DEFAULTS};for(const input of controls.querySelectorAll('[data-camera-setting]')){const v=this.settings[input.dataset.cameraSetting];if(input.type==='checkbox')input.checked=v;else input.value=v;}this.policy=new MultiplayerCamera();status.textContent='Defaults previewed. Save to apply.';});controls.append(actions,status,el('p','Higher minimum zoom keeps characters larger and splits sooner. A lower merge ratio requires players to regroup more closely. Dynamic dividers rotate with the party. Wider means farther apart; quicker pulses mean changing separation. Static layout choices apply when Dynamic divider is off. Portals cut only the traveler’s view.'));
  const toolbar=el('div');toolbar.className='camera-actions';const count=el('select');count.ariaLabel='Preview player count';for(const n of [2,3,4])count.append(new Option(n+' players',n));count.value=4;count.onchange=()=>{this.count=Number(count.value);this.policy=new MultiplayerCamera();};toolbar.append(count);
  for(const [label,fn]of [['Gather',()=>this.near()],['Spread apart',()=>this.spread()]]){const b=el('button',label);b.type='button';b.onclick=()=>{fn();this.policy=new MultiplayerCamera();};toolbar.append(b);}preview.append(toolbar,el('p','Drag the colored players on the map to test split and merge behavior.'));
  this.map=el('canvas');this.map.width=800;this.map.height=400;this.map.ariaLabel='Drag players to test camera distance';this.map.style.touchAction='none';preview.append(this.map,el('p','Live camera layout'));
  this.canvas=el('canvas');this.canvas.width=800;this.canvas.height=480;preview.append(this.canvas);this.readout=el('output');preview.append(this.readout);
  let dragging=null;const point=e=>{const r=this.map.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1600,y:(e.clientY-r.top)/r.height*800};};
  this.map.onpointerdown=e=>{const q=point(e);dragging=this.players.slice(0,this.count).find(p=>Math.hypot(p.x-q.x,p.y-q.y)<70);if(dragging)this.map.setPointerCapture(e.pointerId);};
  this.map.onpointermove=e=>{if(dragging){const q=point(e);dragging.x=Math.max(25,Math.min(1575,q.x));dragging.y=Math.max(25,Math.min(775,q.y));}};this.map.onpointerup=this.map.onpointercancel=()=>dragging=null;
  let last=performance.now();const frame=now=>{if(!root.isConnected||!root.closest('dialog')?.open){this.frame=null;return;}this.draw(Math.min(.1,(now-last)/1000));last=now;this.frame=requestAnimationFrame(frame);};this.draw(0);this.frame=requestAnimationFrame(frame);
 }
 near(){this.players=colors.map((color,i)=>({id:i+1,name:'P'+(i+1),color,x:760+i*24,y:390+(i%2)*24}));}
 spread(){this.players=colors.map((color,i)=>({id:i+1,name:'P'+(i+1),color,x:i%2?1400:200,y:i<2?140:660}));}
 stop(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=null;}
 draw(dt){
  const players=this.players.slice(0,this.count),s=this.settings,rawViews=this.policy.update(players,400,240,dt,s),map=this.map.getContext('2d'),ctx=this.canvas.getContext('2d');
  this.motion.tick(players,dt);const animated=rawViews.length>1?this.motion.layout(rawViews,400,240,dt,s):{cells:rawViews,seams:[]},views=animated.cells;
   if(views.length>1){this.policy.availableBounds=s.dynamicSplit?new Map(views.map(v=>[v.key,{w:v.safe,h:v.safe}])):null;const amount=smoothPreview(this.policy.mergeProgress),shared=cameraFit(players,400,240,s);if(amount>0)for(const v of views){const joined={x:shared.x+(v.x+v.w/2-200)/shared.zoom,y:shared.y+(v.y+v.h/2-120)/shared.zoom,zoom:shared.zoom};for(const key of ['x','y','zoom'])v.camera[key]+=(joined[key]-v.camera[key])*amount;}}
  const grid=(c,w,h,scale=1,ox=0,oy=0)=>{c.fillStyle='#142e2a';c.fillRect(0,0,w,h);c.strokeStyle='#25473f';c.lineWidth=1;for(let x=((ox%40)+40)%40;x<w;x+=40*scale){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=((oy%40)+40)%40;y<h;y+=40*scale){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}};
  grid(map,800,400);for(const v of views){const c=v.camera;map.strokeStyle=v.players[0].color+'66';map.strokeRect((c.x-v.w/c.zoom/2)/2,(c.y-v.h/c.zoom/2)/2,v.w/c.zoom/2,v.h/c.zoom/2);}
  for(const p of players){map.fillStyle=p.color;map.beginPath();map.arc(p.x/2,p.y/2,10,0,Math.PI*2);map.fill();map.font='bold 12px monospace';map.fillText(p.name,p.x/2+14,p.y/2+4);}
  ctx.fillStyle='#070f12';ctx.fillRect(0,0,800,480);
  for(const v of views){const c=v.camera;ctx.save();ctx.translate(v.x*2,v.y*2);ctx.beginPath();if(v.poly){v.poly.forEach((p,i)=>i?ctx.lineTo((p.x-v.x)*2,(p.y-v.y)*2):ctx.moveTo((p.x-v.x)*2,(p.y-v.y)*2));ctx.closePath();}else ctx.rect(0,0,v.w*2,v.h*2);ctx.clip();grid(ctx,v.w*2,v.h*2);for(const p of players){const x=v.w+(p.x-c.x)*c.zoom*2,y=v.h+(p.y-c.y)*c.zoom*2;ctx.fillStyle=p.color;ctx.fillRect(x-7*c.zoom,y-18*c.zoom,14*c.zoom,22*c.zoom);ctx.font='bold 13px monospace';ctx.fillText(p.name,x-9,y-24*c.zoom);}ctx.fillStyle='#e2f9ed';ctx.font='13px monospace';ctx.fillText(v.players.map(p=>p.name).join(' + ')+'  '+c.zoom.toFixed(2)+'×',10,20);ctx.restore();}
  ctx.save();ctx.scale(2,2);drawSplitSeams(ctx,animated.seams,this.motion.time,1-smoothPreview(this.policy.mergeProgress),s);ctx.restore();
  this.readout.textContent=views.length+' view'+(views.length===1?'':'s')+' / 4 maximum · '+(s.enabled?'Automatic':'Splitting disabled');
 }
}
