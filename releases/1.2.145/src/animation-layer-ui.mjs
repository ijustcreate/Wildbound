import {defaultAnimationLayers,upperJoints} from './animation-layers.mjs';
export function refreshLayerEditor(studio){
 const root=studio.$('.ps-motion-layers');if(!root)return;
 const model=studio.model,layers=model.animationLayers||[];
 const signature=JSON.stringify([studio.subject,layers,studio.motionLayerIndex,studio.previewMotionLayer]);if(root.dataset.signature===signature)return;root.dataset.signature=signature;root.replaceChildren();
 const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;root.append(e);return e;};
 if(studio.subject!=='player'){text('p','Masked combat layers are currently available for the player rig.');return;}
 text('h3','ANIMATION LAYERS');text('p','Base keeps the body pose. Only checked joints are replaced by the overlay. Layers run top to bottom; later layers win. Save rig to use these rules in game.');
 const button=(label,fn)=>{const b=text('button',label);b.type='button';b.onclick=fn;return b;};
 const change=fn=>{studio.remember();fn();root.dataset.signature='';studio.changed('Animation layer updated · Save rig to keep it.');};
 const field=(label,options,value,fn)=>{const row=text('label',label),select=document.createElement('select');for(const [id,title] of options)select.append(new Option(title,id));select.value=value;select.onchange=()=>fn(select.value);row.append(select);return select;};
 const index=Math.min(studio.motionLayerIndex||0,Math.max(0,layers.length-1));studio.motionLayerIndex=index;
 if(layers.length)field('Layer',layers.map((l,i)=>[String(i),l.name]),String(index),v=>{studio.motionLayerIndex=+v;studio.previewMotionLayer=false;root.dataset.signature='';studio.changed('Layer selected');});
 button('Add layer',()=>change(()=>{if(layers.length>=16)return;model.animationLayers||=[];model.animationLayers.push(defaultAnimationLayers(model)[0]);studio.motionLayerIndex=model.animationLayers.length-1;}));
 const layer=layers[index];if(!layer)return;
 const nameRow=text('label','Name'),name=document.createElement('input');name.value=layer.name;name.maxLength=60;name.onchange=()=>change(()=>layer.name=name.value||'Layer');nameRow.append(name);
 const check=(label,value,fn)=>{const row=text('label',label),input=document.createElement('input');input.type='checkbox';input.checked=value;input.onchange=()=>fn(input.checked);row.prepend(input);return input;};
 check('Enabled',layer.enabled,v=>change(()=>layer.enabled=v));
 field('When',[['airborne','Airborne'],['moving','Moving'],['combat','Attacking / aiming / blocking'],['always','Always']],layer.condition,v=>change(()=>layer.condition=v));
 const clips=Object.keys(model.clips).map(n=>[n,n]);
 field('Base clip',[['$current','Current locomotion'],...clips],layer.base,v=>change(()=>layer.base=v));
 field('Overlay clip',[['$combat','Current combat action'],...clips],layer.overlay,v=>change(()=>layer.overlay=v));
 const row=text('label','Blend strength (0–1)'),weight=document.createElement('input');weight.type='number';weight.min=0;weight.max=1;weight.step=.05;weight.value=layer.weight;weight.onchange=()=>change(()=>layer.weight=Math.max(0,Math.min(1,Number(weight.value)||0)));row.append(weight);
 button('Upper-body mask',()=>change(()=>layer.joints=upperJoints(model)));
 button('Lower-body mask',()=>change(()=>layer.joints=Object.keys(model.joints).filter(n=>!upperJoints(model).includes(n))));
 const mask=text('details','');mask.className='ps-layer-mask';const summary=document.createElement('summary');summary.textContent=`Custom joint mask · ${layer.joints.length} joints`;mask.append(summary);
 for(const n of Object.keys(model.joints)){const box=check(n,layer.joints.includes(n),v=>change(()=>layer.joints=v?[...new Set([...layer.joints,n])]:layer.joints.filter(j=>j!==n)));mask.append(box.parentElement);}
 button('Move layer earlier',()=>change(()=>{if(index>0){[layers[index-1],layers[index]]=[layers[index],layers[index-1]];studio.motionLayerIndex=index-1;}}));
 button('Remove layer',()=>change(()=>{layers.splice(index,1);studio.previewMotionLayer=false;}));
 text('h4','COMBINED PREVIEW');text('p','Preview bypasses the condition. Select base and overlay clips, then use Play or scrub the timeline. Turn preview off before editing pose keys.');
 field('Preview base',clips,studio.layerBase||'jump_air',v=>{studio.layerBase=v;studio.clip=v;studio.frame=0;studio.changed('Preview base selected');});
 field('Preview overlay',clips,studio.layerOverlay||'slash',v=>{studio.layerOverlay=v;studio.changed('Preview overlay selected');});
 check('Preview this layer',!!studio.previewMotionLayer,v=>{studio.previewMotionLayer=v;studio.mode='animate';studio.clip=studio.layerBase||'jump_air';studio.frame=0;root.dataset.signature='';studio.changed(v?'Layer preview · Play or scrub; turn off to edit keys.':'Single-clip editing');});
}
