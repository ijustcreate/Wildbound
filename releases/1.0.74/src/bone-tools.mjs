import { projectPoint, screenDelta, setJointKey } from './player-motion.mjs';

export function boneBasis(model,pose,joint,direction,space='world') {
  let name=space==='parent'?model.joints[joint].parent:joint;
  if(space==='world'||!name)return 0;
  const parent=model.joints[name]?.parent;
  if(!parent)return 0;
  const a=projectPoint(pose[parent],direction),b=projectPoint(pose[name],direction);
  return Math.atan2(b.y-a.y,b.x-a.x);
}
export function transformBones(model,pose,joint,direction,kind,values,space='world',children=true) {
  const angle=boneBasis(model,pose,joint,direction,space),ca=Math.cos(angle),sa=Math.sin(angle);
  const parent=model.joints[joint].parent;
  const origin=projectPoint(pose[parent||joint],direction);
  const output={};
  const inherits=name=>{
    if(name===joint)return true;
    if(!children)return false;
    let cursor=name;
    while(cursor&&cursor!==joint) {
      if(model.joints[cursor].editor?.['inherit'+kind]===false)return false;
      if(kind==='scale'&&values.some(v=>v<0)&&model.joints[cursor].editor?.inheritreflection===false)return false;
      cursor=model.joints[cursor].parent;
    }
    return cursor===joint;
  };
  for(const [name,position] of Object.entries(pose)) {
    if(!inherits(name))continue;
    const p=projectPoint(position,direction),x=p.x-origin.x,y=p.y-origin.y;
    const u=x*ca+y*sa,v=-x*sa+y*ca;
    let a=u,b=v;
    if(kind==='move'){a+=values[0];b+=values[1];}
    if(kind==='rotate') {const t=values[0]*Math.PI/180;a=u*Math.cos(t)-v*Math.sin(t);b=u*Math.sin(t)+v*Math.cos(t);}
    if(kind==='scale'){a=u*values[0];b=v*values[1];}
    if(kind==='shear'){a=u+v*Math.tan(values[0]*Math.PI/180);b=v+u*Math.tan(values[1]*Math.PI/180);}
    const delta=screenDelta(a*ca-b*sa-x,a*sa+b*ca-y,direction);
    output[name]=position.map((value,i)=>Math.max(-60,Math.min(60,value+delta[i])));
  }
  return output;
}

export class BoneTools {
  constructor(studio){this.s=studio;this.space='world';this.children=true;this.handles=[];}
  mount() {
    const s=this.s,box=document.createElement('section');box.className='ps-bone-tools';
    box.innerHTML=`<h3>BONE TRANSFORM</h3><label>Axes <select data-space><option value="world">World / view</option><option value="parent">Parent</option><option value="local">Local bone</option></select></label>
      <label><input type="checkbox" data-children checked> Move descendants</label>
      <div class="ps-transform-values"><label data-value-label>X<input data-value="0" type="number" step="0.1" value="0"></label><label data-value-label>Y<input data-value="1" type="number" step="0.1" value="0"></label></div>
      <button type="button" data-apply>Apply transform</button><p>Relative to the current pose. Drag the colored handles, or enter values and apply. Animate writes keys; Setup changes rest joints.</p>
      <details open><summary>Bone properties</summary><label>Length <input data-length type="number" min="0" max="100" step="0.1"></label>
      <label>Bone color <input data-bone-color type="color"></label><label>Handle size <input data-icon-size type="range" min="2" max="9" step="1"></label>
      <label>Handle icon <select data-icon><option value="circle">Circle</option><option value="diamond">Diamond</option><option value="cross">Cross</option></select></label>
      <label><input type="checkbox" data-selectable checked> Select on canvas</label><label><input type="checkbox" data-show-name> Show name</label>
      <fieldset><legend>Inherit parent edits</legend>${['move','rotate','scale','shear','reflection'].map(k=>`<label><input type="checkbox" data-inherit="${k}" checked> ${k==='move'?'Translate':k}</label>`).join('')}</fieldset>
      <button type="button" data-reflect="0">Reflect X</button> <button type="button" data-reflect="1">Reflect Y</button></details>`;
    this.box=box;s.$('.ps-parent').after(box);
    box.querySelector('[data-space]').onchange=e=>{this.space=e.target.value;s.animate(0);};
    box.querySelector('[data-children]').onchange=e=>this.children=e.target.checked;
    box.querySelector('[data-apply]').onclick=()=>{
      const values=[...box.querySelectorAll('[data-value]')].map(el=>Number(el.value));
      if(!values.every(Number.isFinite))return;
      if(s.tool==='shear')values.forEach((v,i)=>values[i]=Math.max(-75,Math.min(75,v)));
      if(s.tool==='scale')values.forEach((v,i)=>values[i]=Math.max(-8,Math.min(8,v)));
      s.remember();this.apply(s.pose(),s.tool,values);s.changed();
    };
    const property=(key,value)=>{s.remember();(s.model.joints[s.selected].editor||={})[key]=value;s.changed();};
    box.querySelector('[data-bone-color]').onchange=e=>property('color',e.target.value);
    box.querySelector('[data-icon-size]').onchange=e=>property('iconSize',Number(e.target.value));
    box.querySelector('[data-icon]').onchange=e=>property('icon',e.target.value);
    box.querySelector('[data-selectable]').onchange=e=>property('selectable',e.target.checked);
    box.querySelector('[data-show-name]').onchange=e=>property('showName',e.target.checked);
    box.querySelectorAll('[data-inherit]').forEach(el=>el.onchange=()=>property('inherit'+el.dataset.inherit,el.checked));
    box.querySelectorAll('[data-reflect]').forEach(el=>el.onclick=()=>{s.remember();const values=[1,1];values[Number(el.dataset.reflect)]=-1;this.apply(s.pose(),'scale',values);s.changed();});
    box.querySelector('[data-length]').onchange=e=>{
      const pose=s.pose(),joint=s.model.joints[s.selected],parent=pose[joint.parent];
      if(!parent)return;
      const vector=pose[s.selected].map((v,i)=>v-parent[i]),length=Math.hypot(...vector),next=Number(e.target.value);
      if(!length||!Number.isFinite(next))return;
      s.remember();s.editPositions(pose,vector.map(v=>v*(Math.max(0,Math.min(100,next))/length-1)));s.changed();
    };
  }
  apply(pose,kind,values) {
    const s=this.s;s.playing=false;
    for(const [name,value] of Object.entries(transformBones(s.model,pose,s.selected,s.direction,kind,values,this.space,this.children))) {
      if(s.mode==='setup')s.model.joints[name].position=value;
      else setJointKey(s.model,s.clip,s.frame,name,value);
    }
  }
  refresh() {
    const s=this.s,box=s.root,joint=s.model.joints[s.selected],editor=joint.editor||{},pose=s.pose();
    const length=joint.parent?Math.hypot(...pose[s.selected].map((v,i)=>v-pose[joint.parent][i])):0;
    const lengthInput=box.querySelector('[data-length]');lengthInput.disabled=!joint.parent;
    if(document.activeElement!==lengthInput)lengthInput.value=length.toFixed(2);
    box.querySelector('[data-bone-color]').value=editor.color||'#e2d9b2';
    box.querySelector('[data-icon-size]').value=editor.iconSize||3;
    box.querySelector('[data-icon]').value=editor.icon||'circle';
    box.querySelector('[data-selectable]').checked=editor.selectable!==false;
    box.querySelector('[data-show-name]').checked=!!editor.showName;
    box.querySelectorAll('[data-inherit]').forEach(el=>el.checked=editor['inherit'+el.dataset.inherit]!==false);
    const key=[s.selected,s.tool,s.clip,s.frame,s.mode].join(':');
    if(key!==this.key) {
      this.key=key;
      box.querySelectorAll('[data-value]').forEach((el,i)=>{el.value=s.tool==='scale'?1:0;el.disabled=s.tool==='pan'||(s.tool==='rotate'&&i===1);});
      const labels=s.tool==='rotate'?['Degrees','—']:s.tool==='scale'?['Scale X ×','Scale Y ×']:s.tool==='shear'?['Shear X °','Shear Y °']:['Translate X','Translate Y'];
      box.querySelectorAll('[data-value-label]').forEach((el,i)=>el.firstChild.textContent=labels[i]);
      box.querySelector('[data-apply]').disabled=s.tool==='pan';
    }
  }
  draw(c,projected) {
    const s=this.s;this.handles=[];if(!s.bones||s.tool==='pan')return;
    const joint=s.model.joints[s.selected],center=projected[s.tool==='move'?s.selected:joint.parent||s.selected];
    const angle=boneBasis(s.model,s.pose(),s.selected,s.direction,this.space);
    c.save();c.lineWidth=2;
    if(s.tool==='rotate') {
      c.strokeStyle='#f2bc61';c.beginPath();c.arc(center.x,center.y,48,0,Math.PI*2);c.stroke();
      this.handles.push({x:center.x+48,y:center.y,axis:0,center});
    } else for(let axis=0;axis<2;axis++) {
      const a=angle+axis*Math.PI/2,x=center.x+Math.cos(a)*52,y=center.y+Math.sin(a)*52;
      c.strokeStyle=axis?'#65dda0':'#f1766b';c.beginPath();c.moveTo(center.x,center.y);c.lineTo(x,y);c.stroke();
      this.handles.push({x,y,axis,center,angle:a});
    }
    for(const h of this.handles) {
      c.fillStyle=s.tool==='rotate'?'#f2bc61':h.axis?'#65dda0':'#f1766b';
      c.beginPath();
      if(s.tool==='scale')c.rect(h.x-5,h.y-5,10,10);
      else if(s.tool==='shear'){c.moveTo(h.x,h.y-7);c.lineTo(h.x+7,h.y);c.lineTo(h.x,h.y+7);c.lineTo(h.x-7,h.y);c.closePath();}
      else c.arc(h.x,h.y,5,0,Math.PI*2);
      c.fill();
    }
    c.restore();
  }
  start(mouse) {
    const h=this.handles.find(h=>Math.hypot(mouse.x-h.x,mouse.y-h.y)<12);if(!h)return false;
    const s=this.s;s.remember();s.playing=false;
    this.gesture={h,start:mouse,pose:s.pose(),model:structuredClone(s.model)};return true;
  }
  drag(mouse) {
    const g=this.gesture;if(!g)return false;
    const s=this.s,{h}=g;s.replace(structuredClone(g.model));
    const dx=mouse.x-g.start.x,dy=mouse.y-g.start.y;
    const values=s.tool==='scale'?[1,1]:[0,0];
    if(s.tool==='rotate') values[0]=(Math.atan2(mouse.y-h.center.y,mouse.x-h.center.x)-Math.atan2(g.start.y-h.center.y,g.start.x-h.center.x))*180/Math.PI;
    else {const distance=dx*Math.cos(h.angle)+dy*Math.sin(h.angle);values[h.axis]=s.tool==='scale'?Math.max(.1,Math.min(8,1+distance/52)):s.tool==='shear'?Math.max(-75,Math.min(75,distance)):distance/s.scale;}
    this.apply(g.pose,s.tool,values);s.changed();return true;
  }
}
