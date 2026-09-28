import { poseAt, setJointKey } from './player-motion.mjs';
export function insertFrame(clip, frame) {
  if (clip.length >= 120) return false;
  for (const key of clip.keys) if (key.frame >= frame) key.frame++;
  clip.length++; return true;
}
export function removeFrame(clip, frame) {
  if (clip.length <= 2) return false;
  clip.keys = clip.keys.filter(k=>k.frame !== frame);
  for (const key of clip.keys) if (key.frame > frame) key.frame--;
  clip.length--;
  if (!clip.keys.length) clip.keys.push({frame:0,joints:{}});
  return true;
}
export function moveGraphKey(clip, joint, from, to, axis, value) {
  const source=clip.keys.find(k=>k.frame===from);
  if (!source?.joints[joint]) return false;
  const target=clip.keys.find(k=>k.frame===to);
  if (to!==from && target?.joints[joint]) return false;
  const position=[...source.joints[joint]]; position[axis]=value;
  const easing=source.interpolation?.[joint];
  const angles=Object.fromEntries(Object.entries(source.angles||{}).filter(([,v])=>Number.isFinite(v[joint])).map(([d,v])=>[d,v[joint]]));
  if(to!==from) { delete source.joints[joint]; if(source.interpolation)delete source.interpolation[joint]; }
  const key=target || {frame:to,joints:{}}; key.joints[joint]=position;
  if(to!==from)for(const values of Object.values(source.angles||{}))delete values[joint];
  for(const [d,value] of Object.entries(angles)){key.angles||={};(key.angles[d]||={})[joint]=value;}
  if(easing)(key.interpolation ||= {})[joint]=easing;
  if(!target)clip.keys.push(key);
  clip.keys.sort((a,b)=>a.frame-b.frame);return true;
}
export class AnimationGraph {
  constructor(studio) { this.studio=studio; this.axis=0; }
  mount() {
    const s=this.studio;
    const bar=document.createElement('div');bar.className='ps-graph-toolbar';
    bar.innerHTML='<button type="button" data-view="tracks">Keyframes</button><button type="button" data-view="graph">Graph editor</button><label>Curve <select aria-label="Graph axis"><option value="0">X · across</option><option value="1">Y · depth</option><option value="2">Z · height</option></select></label><span>Drag any colored point. Shift: keep frame. Endpoints snap to each other; Alt: no snap. Right-click for loop alignment.</span>';
    s.$('.ps-tracks').before(bar);
    const canvas=document.createElement('canvas');canvas.className='ps-graph';canvas.width=960;canvas.height=230;canvas.hidden=true;bar.after(canvas);this.canvas=canvas;
    bar.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{this.active=b.dataset.view==='graph';canvas.hidden=!this.active;s.$('.ps-tracks').hidden=this.active;s.animate(0);});
    bar.querySelector('select').onchange=e=>{this.axis=Number(e.target.value);this.draw();};
    canvas.onpointerdown=e=>this.down(e);
    canvas.onpointermove=e=>this.move(e);
    canvas.onpointerup=canvas.onpointercancel=()=>{this.drag=null;this.draw();};
    canvas.oncontextmenu=e=>this.context(e);
  }
  point(e) {const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*this.canvas.width/r.width,y:(e.clientY-r.top)*230/r.height};}
  geometry() {
    const s=this.studio,clip=s.model.clips[s.clip],keys=clip.keys.filter(k=>k.joints[s.selected]);
    const values=keys.flatMap(k=>k.joints[s.selected]);
    const min=Math.min(-1,...values)-2,max=Math.max(1,...values)+2;
    return {clip,keys,min,max,left:55,right:this.canvas.width-20,top:25,bottom:202};
  }
  xy(frame,value,g=this.g) {return {x:g.left+frame/(g.clip.length-1)*(g.right-g.left),y:g.bottom-(value-g.min)/(g.max-g.min)*(g.bottom-g.top)};}
  value(p,g=this.g) {return {frame:Math.max(0,Math.min(g.clip.length-1,Math.round((p.x-g.left)/(g.right-g.left)*(g.clip.length-1)))),value:Math.max(-100,Math.min(100,g.min+(g.bottom-p.y)/(g.bottom-g.top)*(g.max-g.min)))};}
  nearest(p) {
    let hit=null,distance=10;
    for(const axis of [this.axis,...[0,1,2].filter(a=>a!==this.axis)])for(const key of this.g.keys){
      const q=this.xy(key.frame,key.joints[this.studio.selected][axis]),d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<distance){distance=d;hit={key,axis};}
    }
    return hit;
  }
  draw() {
    if(!this.active)return;
    const s=this.studio,c=this.canvas.getContext('2d');this.canvas.width=Math.max(400,Math.round(this.canvas.clientWidth));
    const g=this.g=this.geometry(),colors=['#ff927d','#7de0a0','#8bbaff'];
    if(this.drag){g.min=this.drag.g.min;g.max=this.drag.g.max;}
    c.fillStyle='#14232a';c.fillRect(0,0,this.canvas.width,230);c.font='11px monospace';
    c.fillStyle='#e1e9d7';c.fillText(s.selected+' · offset from rest pose',8,14);
    for(let i=0;i<=4;i++){const value=g.min+(g.max-g.min)*i/4,q=this.xy(0,value);c.strokeStyle='#34464c';c.beginPath();c.moveTo(g.left,q.y);c.lineTo(g.right,q.y);c.stroke();c.fillStyle='#a9baba';c.fillText(value.toFixed(1),4,q.y+4);}
    for(let f=0;f<g.clip.length;f+=Math.max(1,Math.ceil(g.clip.length/20))){const q=this.xy(f,0);c.fillStyle='#a9baba';c.fillText(f,q.x,220);}
    for(let axis=0;axis<3;axis++){
      c.strokeStyle=colors[axis];c.lineWidth=axis===this.axis?2:1;c.beginPath();
      for(let i=0;i<=200;i++){const f=i/200*(g.clip.length-1),v=poseAt(s.model,s.clip,f)[s.selected][axis]-s.model.joints[s.selected].position[axis],q=this.xy(f,v);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);}c.stroke();
      for(const key of g.keys){const q=this.xy(key.frame,key.joints[s.selected][axis]);c.fillStyle=colors[axis];c.fillRect(q.x-3,q.y-3,6,6);}
    }
    const q=this.xy(s.frame,0);c.strokeStyle='#eed77d';c.beginPath();c.moveTo(q.x,20);c.lineTo(q.x,205);c.stroke();
  }
  down(e) {
    if(e.button!==0)return;this.menu?.remove();const s=this.studio,p=this.point(e),hit=this.nearest(p);s.playing=false;
    if(hit){this.axis=hit.axis;s.root.querySelector('[aria-label="Graph axis"]').value=String(this.axis);s.remember();this.drag={frame:hit.key.frame,g:this.g};this.canvas.setPointerCapture(e.pointerId);}
    else {s.frame=this.value(p).frame;s.refresh();s.animate(0);}
  }
  move(e) {
    if(!this.drag)return;const s=this.studio,v=this.value(this.point(e),this.drag.g);
    if(e.shiftKey)v.frame=this.drag.frame;
    const clip=s.model.clips[s.clip],end=clip.length-1;let snapped=false;
    if(!e.altKey && (v.frame===0 || v.frame===end)){
      const opposite=clip.keys.find(k=>k.frame===(v.frame===0?end:0))?.joints[s.selected]?.[this.axis];
      if(opposite!==undefined && Math.abs(this.xy(0,opposite,this.drag.g).y-this.xy(0,v.value,this.drag.g).y)<8){v.value=opposite;snapped=true;}
    }
    if(moveGraphKey(s.model.clips[s.clip],s.selected,this.drag.frame,v.frame,this.axis,snapped?v.value:Math.round(v.value*10)/10))this.drag.frame=v.frame;
    s.frame=this.drag.frame;s.changed('Graph key updated · save rig to keep changes');
  }
  context(e) {
    e.preventDefault();this.menu?.remove();const s=this.studio,p=this.point(e),hit=this.nearest(p),frame=hit?.key.frame ?? this.value(p).frame,clip=s.model.clips[s.clip];
    if(hit){this.axis=hit.axis;s.root.querySelector('[aria-label="Graph axis"]').value=String(this.axis);}
    s.playing=false;s.frame=frame;
    const menu=this.menu=document.createElement('div');menu.className='ps-context-menu';menu.setAttribute('role','menu');
    menu.style.left=Math.min(e.clientX,window.innerWidth-225)+'px';menu.style.top=Math.min(e.clientY,window.innerHeight-310)+'px';
    const action=(title,fn)=>{const b=document.createElement('button');b.textContent=title;b.type='button';b.onclick=()=>{s.remember();fn();s.frame=Math.min(s.frame,clip.length-1);menu.remove();s.changed();};menu.append(b);};
    action('Add key here',()=>setJointKey(s.model,s.clip,frame,s.selected,poseAt(s.model,s.clip,frame)[s.selected]));
    action('Delete selected joint key',()=>{const k=clip.keys.find(k=>k.frame===frame);if(k)delete k.joints[s.selected];});
    action('Insert frame before',()=>insertFrame(clip,frame));
    action('Duplicate frame',()=>{const pose=poseAt(s.model,s.clip,frame);if(insertFrame(clip,frame+1))for(const [joint,value]of Object.entries(pose))setJointKey(s.model,s.clip,frame+1,joint,value);});
    action('Delete frame',()=>removeFrame(clip,frame));
    action('Match last point to first · this curve',()=>{
      const first=poseAt(s.model,s.clip,0)[s.selected],last=poseAt(s.model,s.clip,clip.length-1)[s.selected];
      last[this.axis]=first[this.axis];setJointKey(s.model,s.clip,clip.length-1,s.selected,last);
    });
    action('Match last pose to first · this joint',()=>setJointKey(s.model,s.clip,clip.length-1,s.selected,poseAt(s.model,s.clip,0)[s.selected]));
    for(const ease of ['linear','smooth','hold'])action('Outgoing curve: '+ease,()=>{setJointKey(s.model,s.clip,frame,s.selected,poseAt(s.model,s.clip,frame)[s.selected]);const k=clip.keys.find(k=>k.frame===frame);(k.interpolation ||= {})[s.selected]=ease;});
    const close=document.createElement('button');close.textContent='Close';close.onclick=()=>menu.remove();menu.append(close);
    s.root.append(menu);close.focus();menu.onkeydown=e=>{if(e.key==='Escape')menu.remove();};
  }
}
