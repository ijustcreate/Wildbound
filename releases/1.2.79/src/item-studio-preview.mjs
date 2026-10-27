import {isolateItemSprite,itemArtLayers} from './item-layer-art.mjs';
import {InlinePixelEditor} from './inline-pixel-editor.mjs';
import { drawPlayer,playerPose,playerMotion,directionVector,DIRECTIONS } from './player-motion.mjs';
import { paintItem,clearItemArtCache } from './item-art.mjs';
import { captureLayers,releaseLayers,capturedLayers } from './render-order.mjs';
import { DEFAULT_APPEARANCE } from './appearance.mjs';

export class ItemStudioPreview {
  constructor(root,id,items,editFit) {
    this.id=id;this.items=items;this.direction=0;this.frame=0;this.playing=false;this.clip=items[id]?.mount?'broom_ride':'idle';this.root=root;
    root.className='item-studio-preview';
    root.innerHTML='<section class="item-character"><h3>ON CHARACTER</h3><canvas width="360" height="300" aria-label="Equipped item on character"></canvas><div class="item-directions"></div><div class="item-playback"><select aria-label="Preview animation"><option>idle</option><option>run</option><option>slash</option><option>block</option><option>ranged</option><option>cast</option><option>jump_air</option><option>broom_ride</option></select><button type="button">Play</button><button type="button" data-fit>Edit fit</button><button type="button" data-art>Edit pixel art</button></div><p class="item-preview-note"></p><h3>8-DIRECTION TURNAROUND</h3><p>Shared rig review · pixel grid locked · inspect silhouette, occlusion and fit before approving.</p><canvas class="item-turnaround" width="640" height="180" aria-label="Eight direction wearable turnaround"></canvas></section><section class="item-artwork"><h3>INVENTORY ICON</h3><canvas class="item-icon" width="144" height="144" aria-label="Item inventory icon"></canvas><h3>WORN ARTWORK</h3><p>Only equipment pixels are editable. Transparency reveals the unchanged character underneath.</p><div class="item-sprite-list"></div></section>';
    DIRECTIONS.forEach((name,d)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>this.selectDirection(d);root.querySelector('.item-directions').append(b);});
    root.querySelector('select').value=this.clip;
    root.querySelector('select').onchange=e=>{this.clip=e.target.value;this.frame=0;this.dirty=true;this.animate(0);};
    root.querySelector('.item-playback button').onclick=e=>{this.playing=!this.playing;e.target.textContent=this.playing?'Pause':'Play';};
    root.querySelector('[data-fit]').onclick=()=>editFit(id,this.direction,'fit');
    root.querySelector('[data-art]').onclick=()=>this.openFirstArt();
    const editor=document.createElement('div');editor.className='item-inline-editor';root.querySelector('.item-artwork').append(editor);
    const turnaround=root.querySelector('.item-turnaround');turnaround.style.cursor='pointer';turnaround.tabIndex=0;turnaround.onclick=e=>{const r=turnaround.getBoundingClientRect();this.selectDirection(Math.min(7,Math.max(0,Math.floor((e.clientX-r.left)/r.width*8))));};turnaround.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.selectDirection((this.direction+(e.key==='ArrowRight'?1:7))%8);}};
    const icon=root.querySelector('.item-icon');icon.style.cursor='pointer';icon.onclick=()=>this.editIcon();
    this.dirty=true;this.animate(0);
  }
  selectDirection(d){this.direction=d;this.dirty=true;this.root.querySelector('.item-inline-editor').replaceChildren();this.animate(0);}
  edited(){this.items[this.id].artRevision=(this.items[this.id].artRevision||0)+1;clearItemArtCache();this.dirty=true;this.animate(0);this.root.querySelector('.item-preview-note').textContent='Unsaved pixel art · use Studio Save to keep changes';}
  openFirstArt(){const layer=this.editableLayers?.[0];if(layer)this.editLayer(layer);else this.editIcon();}
  ensureItemLayers(){const item=this.items[this.id];item.wornArt??={};const previous=item.wornArt[this.direction]||{};item.wornArt[this.direction]=Object.fromEntries(this.editableLayers.map(layer=>[layer.id,{...structuredClone(layer.sprite),itemOnly:true,bone:layer.bone}]));for(const [id,sprite]of Object.entries(previous))if(sprite.itemOnly&&!item.wornArt[this.direction][id])item.wornArt[this.direction][id]=sprite;}
  editLayer(layer){const direction=this.direction,item=this.items[this.id];this.pixelEditor=new InlinePixelEditor(this.root.querySelector('.item-inline-editor'),layer.sprite,{title:'Item art · '+DIRECTIONS[direction],onChange:sprite=>{this.ensureItemLayers();item.wornArt[direction][layer.id]={...sprite,itemOnly:true,bone:layer.bone};this.edited();},onRestore:()=>{if(item.wornArt?.[direction])delete item.wornArt[direction];this.edited();this.openFirstArt();}});}
  editIcon(){const c=document.createElement('canvas');c.width=c.height=24;const ctx=c.getContext('2d');paintItem(ctx,this.id);const data=ctx.getImageData(0,0,24,24).data,palette=['transparent'],pixels=[];for(let i=0;i<576;i++){if(data[i*4+3]<128){pixels.push(0);continue;}const color='#'+[data[i*4],data[i*4+1],data[i*4+2]].map(n=>n.toString(16).padStart(2,'0')).join('');if(!palette.includes(color))palette.push(color);pixels.push(palette.indexOf(color));}const item=this.items[this.id];this.pixelEditor=new InlinePixelEditor(this.root.querySelector('.item-inline-editor'),{width:24,height:24,x:0,y:0,palette,pixels},{title:'Inventory icon',onChange:s=>{item.artPixels=s.pixels.map(i=>i?s.palette[i]:null);this.edited();},onRestore:()=>{delete item.artPixels;this.edited();this.editIcon();}});}
  actor(equipped=true) {
    const def=this.items[this.id],[faceX,faceY]=directionVector(this.direction);
    return {itemArtItems:this.items,faceX,faceY,appearance:DEFAULT_APPEARANCE,...(equipped&&def.mount?{broomMount:{time:this.frame/12}}:{}),equipment:equipped&&def.slot?{[def.slot]:this.id}:{},inventory:equipped&&def.relic?[{type:this.id,qty:1}]:[],animationAction:this.clip,playerFrame:this.frame};
  }
  animate(dt) {
    const data=JSON.stringify(this.items[this.id]);
    if(data!==this.data){this.data=data;this.dirty=true;clearItemArtCache();}
    if(this.playing)this.frame=(this.frame+dt*playerMotion.clips[this.clip].fps)%playerMotion.clips[this.clip].length;
    if(!this.playing&&!this.dirty&&dt)return;
    const c=this.root.querySelector('.item-character canvas').getContext('2d');
    c.imageSmoothingEnabled=false;c.fillStyle='#182c2c';c.fillRect(0,0,360,300);
    c.save();c.translate(180,250);c.scale(4.5,4.5);drawPlayer(c,this.actor(),0,playerMotion);c.restore();
    this.renderTurnaround();
    if(!this.dirty)return;
    this.dirty=false;
    [...this.root.querySelector('.item-directions').children].forEach((b,d)=>b.classList.toggle('active',d===this.direction));
    const def=this.items[this.id];
    this.root.querySelector('[data-fit]').disabled=!def.slot;
    this.root.querySelector('.item-preview-note').textContent=def.mount?'Broom mount · live riding pose':def.slot?'Equipped in '+def.slot+' · live game art':def.relic?'Carried relic · shown on the belt':'This item is not wearable; its inventory/ground icon is shown here.';
    const icon=this.root.querySelector('.item-icon').getContext('2d');icon.clearRect(0,0,144,144);icon.save();icon.scale(6,6);paintItem(icon,this.id);icon.restore();
    const scratch=document.createElement('canvas');scratch.width=scratch.height=128;const sc=scratch.getContext('2d');
    const fixedPose=playerPose(this.actor(true),0,playerMotion);let bonePoints;
    const capture=equipped=>{captureLayers(playerMotion);try{bonePoints=drawPlayer(sc,this.actor(equipped),0,playerMotion,fixedPose);return structuredClone(capturedLayers(playerMotion,this.direction));}finally{releaseLayers(playerMotion);}};
    const baseline=capture(false),equipped=capture(true);
    sc.clearRect(0,0,128,128);sc.save();sc.translate(64,90);drawPlayer(sc,this.actor(false),0,playerMotion,fixedPose);sc.restore();const uncovered=sc.getImageData(0,0,128,128).data;
    const saved=itemArtLayers(def,this.direction);
    this.editableLayers=saved.length?saved.map(([id,sprite])=>({id,bone:sprite.bone||'chest',sprite:structuredClone(sprite)})):equipped.map(layer=>{const base=baseline.find(b=>b.id===layer.id)?.sprite,anchor=bonePoints[layer.bone]||{x:0,y:0},sprite=isolateItemSprite(layer.sprite,(x,y)=>{if(base){const bx=x-base.x,by=y-base.y;if(bx>=0&&by>=0&&bx<base.width&&by<base.height){const index=base.pixels[by*base.width+bx],color=layer.sprite.palette[layer.sprite.pixels[(y-layer.sprite.y)*layer.sprite.width+x-layer.sprite.x]];if(index&&base.palette[index]===color)return color;}}x+=Math.round(anchor.x)+64;y+=Math.round(anchor.y)+90;if(x<0||y<0||x>=128||y>=128)return null;const i=(y*128+x)*4;return uncovered[i+3]<128?null:'#'+[uncovered[i],uncovered[i+1],uncovered[i+2]].map(n=>n.toString(16).padStart(2,'0')).join('');});sprite.bone=layer.bone;return{...layer,sprite};}).filter(layer=>layer.sprite.pixels.some(Boolean));
    const list=this.root.querySelector('.item-sprite-list');list.replaceChildren();
    // Image-backed weapons and post-rig belt ornaments do not issue fillRect
    // calls inside a captured layer; show their actual composited pixels too.
    if(def.slot||def.relic||def.mount) {
      const render=equipped=>{sc.clearRect(0,0,128,128);sc.save();sc.translate(64,90);drawPlayer(sc,this.actor(equipped),0,playerMotion,fixedPose);sc.restore();return sc.getImageData(0,0,128,128);};
      const naked=render(false),worn=render(true),points=[];
      for(let i=0;i<128*128;i++) {
        const offset=i*4,changed=[0,1,2,3].some(j=>naked.data[offset+j]!==worn.data[offset+j]);
        if(changed&&worn.data[offset+3])points.push([i%128,Math.floor(i/128)]);
        else worn.data[offset+3]=0;
      }
      if(points.length) {
        const left=Math.min(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1]));
        const width=Math.max(...points.map(p=>p[0]))-left+1,height=Math.max(...points.map(p=>p[1]))-top+1;
        sc.putImageData(worn,0,0);const card=document.createElement('figure'),label=document.createElement('figcaption'),art=document.createElement('canvas');
        const scale=Math.max(1,Math.min(5,Math.floor(160/Math.max(width,height))));art.width=width*scale;art.height=height*scale;
        const ctx=art.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(scratch,left,top,width,height,0,0,art.width,art.height);
        label.textContent='Visible item pixels · '+width+' × '+height;card.append(art,label);card.style.cursor='pointer';card.onclick=()=>this.openFirstArt();list.append(card);
      }
    }
    for(const layer of this.editableLayers) {
      const old=baseline.find(p=>p.id===layer.id);
      if(old&&JSON.stringify(old.sprite)===JSON.stringify(layer.sprite))continue;
      const {sprite}=layer,card=document.createElement('figure'),label=document.createElement('figcaption'),canvas=document.createElement('canvas');
      label.textContent='Item layer · '+sprite.width+' × '+sprite.height;
      const scale=Math.max(1,Math.min(5,Math.floor(160/Math.max(sprite.width,sprite.height))));
      canvas.width=sprite.width*scale;canvas.height=sprite.height*scale;const ctx=canvas.getContext('2d');
      sprite.pixels.forEach((index,i)=>{if(index){ctx.fillStyle=sprite.palette[index];ctx.fillRect(i%sprite.width*scale,Math.floor(i/sprite.width)*scale,scale,scale);}});
      card.append(canvas,label);card.style.cursor='pointer';card.tabIndex=0;card.onclick=()=>this.editLayer(layer);card.onkeydown=e=>{if(e.key==='Enter')this.editLayer(layer);};list.append(card);
    }
    if(!list.children.length)list.textContent=def.relic?'This relic uses a small belt ornament drawn after the rig layers.':def.slot?'No visible layer change in this facing. Try another direction.':'No character sprite: this item uses the icon artwork.';
  }
  renderTurnaround() {
    const canvas=this.root.querySelector('.item-turnaround');
    if(!canvas)return;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#182c2c';c.fillRect(0,0,canvas.width,canvas.height);
    const labels=['S','SW','W','NW','N','NE','E','SE'];
    for(let d=0;d<8;d++) {
      const x=d*80;c.fillStyle=d===this.direction?'#8fd8b2':'#315148';c.fillRect(x+2,2,76,176);
      c.save();c.translate(x+40,151);c.scale(2.2,2.2);drawPlayer(c,this.actorForDirection(d),0,playerMotion);c.restore();
      c.fillStyle='#d7e4cf';c.font='10px monospace';c.textAlign='center';c.fillText(labels[d],x+40,173);
    }
  }
  actorForDirection(direction) {
    const def=this.items[this.id],[faceX,faceY]=directionVector(direction);
    return {faceX,faceY,appearance:DEFAULT_APPEARANCE,...(def.mount?{broomMount:{time:this.frame/12}}:{}),equipment:def.slot?{[def.slot]:this.id}:{},inventory:def.relic?[{type:this.id,qty:1}]:[],animationAction:this.clip,playerFrame:this.frame};
  }
}
