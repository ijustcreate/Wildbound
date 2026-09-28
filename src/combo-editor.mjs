import {combos,DEFAULT_COMBOS,COMBO_CLIPS,saveCombos} from './combat-combos.mjs';
import {drawPlayer,playerMotion,directionVector} from './player-motion.mjs';
export class ComboEditor {
 constructor(){this.draft=structuredClone(combos);this.index=0;this.direction=0;}
 stop(){cancelAnimationFrame(this.frame);}
 mount(root){
  this.stop();this.root=root;root.className='combo-editor';
  root.innerHTML='<div class="particle-toolbar"><label>Combo <select aria-label="Combo"></select></label><button data-action="new">Add combo</button><button data-action="delete">Remove combo</button><button data-action="save">Save combos</button><button data-action="reset">Restore defaults</button></div><p>Repeated attacks continue the sequence. Pause for 0.8 seconds after recovery to restart. One enabled combo per attack type; no enabled combo uses a single basic strike. Edit the poses in Rig studio.</p><div class="combo-settings"></div><div class="combo-workspace"><section><canvas width="380" height="260" aria-label="Combo animation preview"></canvas><button data-action="facing">Rotate preview</button><p class="combo-preview-label"></p></section><section><div class="combo-steps"></div><button data-action="step">Add step</button></section></div><p class="combo-status" role="status"></p>';
  const $=s=>root.querySelector(s),select=$('select'),status=$('.combo-status');
  this.index=Math.max(0,Math.min(this.index,this.draft.length-1));this.draft.forEach((v,i)=>select.append(new Option(v.name,i)));select.value=this.index;
  select.onchange=()=>{this.index=Number(select.value);this.mount(root);};
  const c=this.draft[this.index];
  const action=(name,fn)=>$(`[data-action="${name}"]`).onclick=()=>{try{fn();}catch(e){status.textContent=e.message;}};
  action('new',()=>{this.draft.push({id:'combo-'+Date.now().toString(36),name:'New combo',kind:'melee',enabled:false,steps:[structuredClone(DEFAULT_COMBOS[0].steps[0])]});this.index=this.draft.length-1;this.mount(root);});
  action('delete',()=>{this.draft.splice(this.index,1);this.mount(root);});action('save',()=>{saveCombos(this.draft);status.textContent='Saved · active in gameplay.';});
  action('reset',()=>{this.draft=structuredClone(DEFAULT_COMBOS);this.index=0;this.mount(root);$('.combo-status').textContent='Defaults restored in preview. Save to apply.';});
  action('step',()=>{if(c&&c.steps.length<12){c.steps.push(structuredClone(c.steps.at(-1)));this.mount(root);}});
  action('facing',()=>{this.direction=(this.direction+1)%8;});
  if(!c){status.textContent='No combos. Save to use basic attacks, or add a combo.';return;}
  const field=(parent,label,object,key,options)=>{
    const row=document.createElement('label');row.textContent=label;const input=document.createElement(options?'select':'input');
    if(options)options.forEach(v=>input.append(new Option(v,v)));else input.type=typeof object[key]==='boolean'?'checkbox':typeof object[key]==='number'?'number':'text';
    input.value=object[key];input.checked=!!object[key];if(input.type==='number')input.step='.05';if(input.type==='text')input.maxLength=60;input.setAttribute('aria-label',label);
    input.onchange=()=>{object[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;if(object===c&&['enabled','kind'].includes(key)&&c.enabled)for(const other of this.draft)if(other!==c&&other.kind===c.kind)other.enabled=false;status.textContent='Unsaved changes · Save combos to apply.';};row.append(input);parent.append(row);
  };
  field($('.combo-settings'),'Name',c,'name');field($('.combo-settings'),'Attack type',c,'kind',['melee','unarmed']);field($('.combo-settings'),'Enabled',c,'enabled');
  c.steps.forEach((step,i)=>{const row=document.createElement('fieldset'),title=document.createElement('legend');title.textContent='Step '+(i+1);row.append(title);field(row,'Animation',step,'clip',COMBO_CLIPS);field(row,'Damage multiplier',step,'damage');field(row,'Reach multiplier',step,'reach');field(row,'Arc (degrees)',step,'arc');field(row,'Recovery (seconds)',step,'duration');for(const [label,fn]of [['Move earlier',()=>{if(i){[c.steps[i-1],c.steps[i]]=[c.steps[i],c.steps[i-1]];this.mount(root);}}],['Remove step',()=>{if(c.steps.length>1){c.steps.splice(i,1);this.mount(root);}}]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;row.append(b);}$('.combo-steps').append(row);});
  const canvas=$('canvas'),ctx=canvas.getContext('2d');let start;
  const tick=t=>{if(!root.isConnected||!root.closest('dialog')?.open)return;start??=t;const total=c.steps.reduce((n,s)=>n+(Number.isFinite(s.duration)&&s.duration>0?s.duration:.34),0);let elapsed=((t-start)/1000)%(total+.6),i=0;while(i<c.steps.length-1&&elapsed>c.steps[i].duration){elapsed-=Math.max(.15,c.steps[i].duration||.34);i++;}const step=c.steps[i],clip=playerMotion.clips[step.clip]||playerMotion.clips.idle;
    ctx.fillStyle='#173b32';ctx.fillRect(0,0,380,260);ctx.save();ctx.translate(190,220);ctx.scale(4,4);const [faceX,faceY]=directionVector(this.direction);drawPlayer(ctx,{faceX,faceY,animationAction:step.clip,playerFrame:Math.min(1,elapsed/Math.max(.15,step.duration||.34))*(clip.length-1),equipment:c.kind==='melee'?{hand1:'sword'}:{}},0);ctx.restore();$('.combo-preview-label').textContent='Step '+(i+1)+' · '+step.clip;this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
 }
}
