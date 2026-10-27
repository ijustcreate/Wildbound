import {LobbyPractice} from './lobby-practice.mjs';
import {drawLobbyBackdrop} from './lobby-backdrop.mjs';
import {drawFlyingArrow} from './embedded-arrow.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {DEFAULT_MAPPING,normalizeMapping,controllerButtonNames} from './controls.mjs';
let current=null;
export const studioPreviewOwnsPad=index=>!!current?.ownsPad(index);
export function previewInput(keys,pad,mapping=DEFAULT_MAPPING){
  const down=code=>keys.has(code),pressed=action=>!!pad?.buttons?.[mapping[action]]?.pressed;
  let x=(down('KeyD')||down('ArrowRight')?1:0)-(down('KeyA')||down('ArrowLeft')?1:0),y=(down('KeyS')||down('ArrowDown')?1:0)-(down('KeyW')||down('ArrowUp')?1:0);
  if(pad){x=Math.abs(pad.axes?.[0]||0)>.2?pad.axes[0]:x;y=Math.abs(pad.axes?.[1]||0)>.2?pad.axes[1]:y;}
  const length=Math.max(1,Math.hypot(x,y));
  return {x:x/length,y:y/length,attack:down('KeyJ')||pressed('attack'),block:down('KeyK')||pressed('block'),jump:down('Space')||pressed('jump'),dodge:down('ShiftLeft')||down('ShiftRight')||pressed('dodge'),aimX:pad?.axes?.[2]||0,aimY:pad?.axes?.[3]||0};
}
export class RigLivePreview {
  constructor(studio,root){
    current?.dispose();current=this;this.studio=studio;this.root=root;this.keys=new Set();this.keyboard=false;this.controller=true;this.selectedPad='auto';this.abort=new AbortController();
    root.innerHTML='<div class="ps-live-controls"><strong title="Playable unit preview">Live</strong><button class="ps-live-keyboard" aria-label="Toggle keyboard control" aria-pressed="false" title="Take keyboard control. Escape releases it.">Keys</button><label title="Use a connected controller"><input class="ps-live-controller" type="checkbox" checked> Pad</label><select aria-label="Preview controller"><option value="auto">Auto</option></select><button class="ps-live-reset" aria-label="Reset position" title="Reset position">↺</button><button class="ps-live-info" aria-label="Show preview controls" title="Show controls">?</button></div><canvas width="540" height="380" tabindex="0" aria-label="Controllable unit preview on an empty lobby floor. Mouse wheel zooms."></canvas><p class="ps-live-help" hidden>WASD / arrows: move · J: attack · K: block · Space: jump · Shift: dash · Escape: release keyboard · Mouse wheel: zoom</p><p class="ps-live-status" role="status">Keyboard released</p>';
    this.zoom=1.7;
    this.canvas=root.querySelector('canvas');this.button=root.querySelector('.ps-live-keyboard');this.status=root.querySelector('.ps-live-status');
    this.game=new LobbyPractice();this.game.house.furniture=[];this.game.house.walls=[];this.game.targets=[];this.game.enemies=[];
    this.actor=this.game.addPlayer('preview','Studio unit');Object.assign(this.actor,{x:650,y:320,faceX:0,faceY:1,invincible:true});
    this.game.onSound=()=>{};this.game.persist=()=>{};
    this.button.onclick=()=>this.setKeyboard(!this.keyboard);
    root.querySelector('.ps-live-info').onclick=()=>{const help=root.querySelector('.ps-live-help');help.hidden=!help.hidden;};
    this.canvas.onwheel=e=>{e.preventDefault();this.zoom=Math.max(.6,Math.min(4,this.zoom*Math.exp(-e.deltaY*.0015)));this.draw();};
    root.querySelector('.ps-live-controller').onchange=e=>{this.controller=e.target.checked;this.keys.clear();};
    root.querySelector('select').onchange=e=>{this.selectedPad=e.target.value;};
    root.querySelector('.ps-live-reset').onclick=()=>{Object.assign(this.actor,{x:650,y:320,jumpHeight:0,groundHeight:0,attack:0});this.keys.clear();};
    const signal=this.abort.signal;
    document.addEventListener('keydown',e=>{
      if(!this.active()||!this.keyboard)return;
      if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
      if(e.code==='Escape'){this.setKeyboard(false);e.preventDefault();e.stopImmediatePropagation();return;}
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyJ','KeyK','Space','ShiftLeft','ShiftRight'].includes(e.code)){this.keys.add(e.code);e.preventDefault();e.stopImmediatePropagation();}
    },{capture:true,signal});
    document.addEventListener('keyup',e=>{if(this.keys.delete(e.code)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal});
    window.addEventListener('blur',()=>this.setKeyboard(false),{signal});
    root.closest('dialog')?.addEventListener('close',()=>this.setKeyboard(false),{signal});
  }
  active(){return this.root.isConnected&&this.root.getClientRects().length>0&&!!this.root.closest('dialog[open]')&&!this.root.closest('dialog').querySelector('dialog[open]');}
  pads(){return Array.from(navigator.getGamepads?.()||[]).filter(Boolean);}
  pad(){const pads=this.pads();return this.selectedPad==='auto'?pads[0]:pads.find(p=>String(p.index)===this.selectedPad);}
  ownsPad(index){return this.controller&&this.active()&&this.pad()?.index===index;}
  setKeyboard(value){this.keyboard=value;this.keys.clear();this.button.textContent=value?'Keys ON':'Keys';this.button.title=value?'Release keyboard control (Escape)':'Take keyboard control';this.button.setAttribute('aria-pressed',String(value));if(value)this.canvas.focus();}
  dispose(){this.abort.abort();this.keys.clear();if(current===this)current=null;}
  animate(dt){
    if(!this.active()){this.keys.clear();return;}
    const pads=this.pads(),select=this.root.querySelector('select'),sig=pads.map(p=>p.index+':'+p.id).join('|');
    if(sig!==this.padSignature){this.padSignature=sig;select.replaceChildren(new Option('Auto','auto'),...pads.map(p=>new Option('#'+(p.index+1)+' '+p.id,String(p.index))));select.value=this.selectedPad;}
    const pad=this.controller?this.pad():null;
    let mapping=DEFAULT_MAPPING;try{mapping=normalizeMapping(JSON.parse(localStorage.getItem('wildbound-mapping')||'{}'));}catch{}
    const input=previewInput(this.keyboard?this.keys:new Set(),pad,mapping);
    this.actor.equipment=structuredClone(this.studio.equipment());this.actor.appearance=this.studio.previewAppearance;
    this.actor.inventory=[{type:'arrow',qty:999}];this.actor.mana=this.actor.maxMana||100;
    this.game.updateTargets(Math.min(dt,.05));
    if(dt>0)this.game.update(Math.min(dt,.05),{preview:input});
    this.actor.ui=null;this.actor.room=null;
    this.game.loot=[];this.game.arrows=this.game.arrows.slice(-32);this.game.spells=this.game.spells.slice(-32);
    const names=controllerButtonNames(pad);
    this.status.textContent=(this.keyboard?'Keyboard ON':'Keyboard off')+' · '+(pad?'Pad '+(pad.index+1):'No pad')+' · '+Math.round(this.zoom*100)+'%';
    this.status.title=pad?`${pad.id} · ${names[mapping.attack]} attack · ${names[mapping.jump]} jump`:'Use Keys to capture keyboard input. Mouse wheel zooms.';
    this.draw();
  }
  draw(){
    const canvas=this.canvas,c=canvas.getContext('2d'),w=Math.max(240,Math.round(canvas.clientWidth)),h=Math.max(180,Math.round(canvas.clientHeight));
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#20292d';c.fillRect(0,0,w,h);
    const a=this.actor;c.save();const zoom=this.zoom;c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-a.x,-a.y+25);
    drawLobbyBackdrop(c);
    for(const arrow of this.game.arrows)if(!arrow.stuck)drawFlyingArrow(c,arrow,this.game.time);
    for(const bolt of this.game.spells)drawMagicBolt(c,bolt);
    c.fillStyle='#28343888';c.beginPath();c.ellipse(a.x,a.y+4,20,7,0,0,Math.PI*2);c.fill();
    const definition=this.studio.definition,model=this.studio.model;
    let clip=a.attack>0?(a.attackClip||'slash'):a.jumpHeight>0?'jump_air':a.moving?'run':'idle';
    if(!model.clips[clip])clip=model.clips[a.moving?'walk':'idle']?(a.moving?'walk':'idle'):this.studio.clip;
    const actor={...a,kind:definition.sprite,sprite:definition.sprite,animationAction:clip};
    // Use the selected editable model immediately, without saving or changing it.
    c.save();c.translate(a.x,a.y-(a.jumpHeight||0)-(a.groundHeight||0));c.scale(1.8,1.8);
    definition.draw(c,actor,this.game.time,model);c.restore();
    c.restore();
  }
}
