import { drawPlayer,playerMotion,directionVector,DIRECTIONS } from './player-motion.mjs';
import { paintItem,clearItemArtCache } from './item-art.mjs';
import { captureLayers,releaseLayers,capturedLayers } from './render-order.mjs';
import { DEFAULT_APPEARANCE } from './appearance.mjs';

export class ItemStudioPreview {
  constructor(root,id,items,editFit) {
    this.id=id;this.items=items;this.direction=0;this.frame=0;this.playing=false;this.clip='idle';this.root=root;
    root.className='item-studio-preview';
    root.innerHTML='<section class="item-character"><h3>ON CHARACTER</h3><canvas width="360" height="300" aria-label="Equipped item on character"></canvas><div class="item-directions"></div><div class="item-playback"><select aria-label="Preview animation"><option>idle</option><option>run</option><option>slash</option><option>block</option></select><button type="button">Play</button><button type="button" data-fit>Edit fit in Rig studio</button></div><p class="item-preview-note"></p></section><section class="item-artwork"><h3>INVENTORY ICON</h3><canvas class="item-icon" width="144" height="144" aria-label="Item inventory icon"></canvas><h3>WORN ARTWORK</h3><p>Actual runtime layers affected by this item in the selected facing. Transparent areas are shown on a checkerboard.</p><div class="item-sprite-list"></div></section>';
    DIRECTIONS.forEach((name,d)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{this.direction=d;this.dirty=true;this.animate(0);};root.querySelector('.item-directions').append(b);});
    root.querySelector('select').onchange=e=>{this.clip=e.target.value;this.frame=0;this.dirty=true;this.animate(0);};
    root.querySelector('.item-playback button').onclick=e=>{this.playing=!this.playing;e.target.textContent=this.playing?'Pause':'Play';};
    root.querySelector('[data-fit]').onclick=()=>editFit(id,this.direction);
    this.dirty=true;this.animate(0);
  }
  actor(equipped=true) {
    const def=this.items[this.id],[faceX,faceY]=directionVector(this.direction);
    return {faceX,faceY,appearance:DEFAULT_APPEARANCE,equipment:equipped&&def.slot?{[def.slot]:this.id}:{},inventory:equipped&&def.relic?[{type:this.id,qty:1}]:[],animationAction:this.clip,playerFrame:this.frame};
  }
  animate(dt) {
    const data=JSON.stringify(this.items[this.id]);
    if(data!==this.data){this.data=data;this.dirty=true;clearItemArtCache();}
    if(this.playing)this.frame=(this.frame+dt*playerMotion.clips[this.clip].fps)%playerMotion.clips[this.clip].length;
    if(!this.playing&&!this.dirty&&dt)return;
    const c=this.root.querySelector('.item-character canvas').getContext('2d');
    c.imageSmoothingEnabled=false;c.fillStyle='#182c2c';c.fillRect(0,0,360,300);
    c.save();c.translate(180,250);c.scale(6,6);drawPlayer(c,this.actor(),0,playerMotion);c.restore();
    if(!this.dirty)return;
    this.dirty=false;
    [...this.root.querySelector('.item-directions').children].forEach((b,d)=>b.classList.toggle('active',d===this.direction));
    const def=this.items[this.id];
    this.root.querySelector('[data-fit]').disabled=!def.slot;
    this.root.querySelector('.item-preview-note').textContent=def.slot?'Equipped in '+def.slot+' · live game art':def.relic?'Carried relic · shown on the belt':'This item is not wearable; its inventory/ground icon is shown here.';
    const icon=this.root.querySelector('.item-icon').getContext('2d');icon.clearRect(0,0,144,144);icon.save();icon.scale(6,6);paintItem(icon,this.id);icon.restore();
    const scratch=document.createElement('canvas');scratch.width=scratch.height=128;const sc=scratch.getContext('2d');
    const capture=equipped=>{captureLayers(playerMotion);try{drawPlayer(sc,this.actor(equipped),0,playerMotion);return structuredClone(capturedLayers(playerMotion,this.direction));}finally{releaseLayers(playerMotion);}};
    const baseline=capture(false),equipped=capture(true),list=this.root.querySelector('.item-sprite-list');list.replaceChildren();
    // Image-backed weapons and post-rig belt ornaments do not issue fillRect
    // calls inside a captured layer; show their actual composited pixels too.
    if(def.slot||def.relic) {
      const render=equipped=>{sc.clearRect(0,0,128,128);sc.save();sc.translate(64,90);drawPlayer(sc,this.actor(equipped),0,playerMotion);sc.restore();return sc.getImageData(0,0,128,128);};
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
        label.textContent='Visible item pixels · '+width+' × '+height;card.append(art,label);list.append(card);
      }
    }
    for(const layer of equipped) {
      const old=baseline.find(p=>p.id===layer.id);
      if(old&&JSON.stringify(old.sprite)===JSON.stringify(layer.sprite))continue;
      const {sprite}=layer,card=document.createElement('figure'),label=document.createElement('figcaption'),canvas=document.createElement('canvas');
      label.textContent=layer.id+' · '+sprite.width+' × '+sprite.height;
      const scale=Math.max(1,Math.min(5,Math.floor(160/Math.max(sprite.width,sprite.height))));
      canvas.width=sprite.width*scale;canvas.height=sprite.height*scale;const ctx=canvas.getContext('2d');
      sprite.pixels.forEach((index,i)=>{if(index){ctx.fillStyle=sprite.palette[index];ctx.fillRect(i%sprite.width*scale,Math.floor(i/sprite.width)*scale,scale,scale);}});
      card.append(canvas,label);list.append(card);
    }
    if(!list.children.length)list.textContent=def.relic?'This relic uses a small belt ornament drawn after the rig layers.':def.slot?'No visible layer change in this facing. Try another direction.':'No character sprite: this item uses the icon artwork.';
  }
}
