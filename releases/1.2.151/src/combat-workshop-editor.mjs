import {combatTuning, COMBAT_FIELDS, DEFAULT_COMBAT_TUNING, normalizeCombatTuning, saveCombatTuning} from './combat-workshop-settings.mjs';
import {IMPACT_PROFILES, combatImpactCameraOffset} from './combat-impact.mjs';
import {projectBoomerangTurn} from './boomerang-flight.mjs';
import {drawGameplayFx} from './gameplay-fx.mjs';
import {beginParticleFrame} from './particles.mjs';
import {drawPlayer, playerMotion} from './player-motion.mjs';

const PREVIEWS = {
  cut:{label:'Clean sword cut', cue:'A bright directional cut and a short recoil.', impact:'cut'},
  shield:{label:'Shield block', cue:'The contact stays in front of the shield.', impact:'shieldBlock'},
  wall:{label:'Wall slam', cue:'A launched foe hits the wall and kicks up debris.', impact:'wallSlam'},
  counter:{label:'Rush counter', cue:'The blue marker is the timed guard window. Gold is the opening for a heavy hit.', impact:'heavy'},
  missed:{label:'Missed rush', cue:'Step aside from the locked rush. The gold marker stays up for the missed-rush opening.', impact:'heavy'},
  boomerang:{label:'Boomerang return', cue:'The return line follows the thrower. Move to catch the guard from behind.'},
  shatter:{label:'Ice shatter', cue:'A heavy strike breaks the freeze and sends shards into nearby enemies.', impact:'heavy'},
  thermal:{label:'Thermal shock', cue:'Fire breaks active ice from a distance and interrupts an ordinary enemy.', impact:'thermal'},
  team:{label:'Co-op follow-through', cue:'One explorer creates the opening. The other can finish it.', impact:'heavy'},
};
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a,b,t) => a+(b-a)*clamp(t);

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function explorer(c, x, y, facing, clip, progress, equipment) {
  const frames = playerMotion.clips[clip];
  c.save();
  c.translate(Math.round(x),y);
  c.scale(2,2);
  drawPlayer(c,{faceX:facing,faceY:0,animationAction:frames?clip:'idle',
    playerFrame:frames?Math.floor(clamp(progress)*(frames.length-1)):0,equipment},0);
  c.restore();
}

function dashedLine(c, from, to, color) {
  c.save();
  c.setLineDash([5,5]);
  c.strokeStyle = color;
  c.beginPath();
  c.moveTo(from.x,from.y);
  c.lineTo(to.x,to.y);
  c.stroke();
  c.restore();
}

function waveform(c, kind, x, y, age) {
  const impact = IMPACT_PROFILES[kind];
  if (age < 0 || age >= impact.life) return;
  drawGameplayFx(c,impact.particle,x,y-impact.lift/2,age,3,null,{life:impact.life,pxScale:impact.scale*1.35});
}

function previewFrame(c, kind, settings, time) {
  c.fillStyle='#0e2226';
  c.fillRect(0,0,560,300);
  beginParticleFrame(c,{budget:220,maxPixelFx:6,quality:0.75});
  const counterTime = kind==='missed' ? settings.missedWindow : settings.caughtWindow;
  const hitAt = kind === 'counter' || kind==='missed'
    ? 0.55 + Math.min(counterTime*0.45,0.65)
    : 0.68;
  const age = time-hitAt;
  const impact = PREVIEWS[kind].impact;
  const profile = IMPACT_PROFILES[impact];
  const offset = age >= 0 && profile
    ? combatImpactCameraOffset({...profile,strength:profile.strength*settings.impactShake,age,seed:4})
    : {x:0,y:0};
  const actionTime = settings.impactFreeze && profile ? Math.max(0,age-profile.pause) : Math.max(0,age);
  const recoil = age >= 0 ? Math.max(0,1-actionTime/(kind==='thermal'?settings.thermalOpening:0.22))*9 : 0;
  c.save();
  c.translate(offset.x,offset.y);
  c.fillStyle='#152f32';
  c.fillRect(34,48,492,198);
  c.strokeStyle='#1e3c3c';
  for(let x=48;x<525;x+=18){c.beginPath();c.moveTo(x,48);c.lineTo(x,246);c.stroke();}
  for(let y=63;y<245;y+=18){c.beginPath();c.moveTo(34,y);c.lineTo(526,y);c.stroke();}
  const hand = kind === 'boomerang' ? {x:112,y:100+mix(0,114,(time-0.7)/0.57)} : null;
  const defender = kind === 'wall' ? mix(266,451,(time-0.35)/0.33) :
    kind === 'counter' || kind === 'team' ? mix(389,284,time/0.55) : kind==='missed' ? mix(389,245,time/0.55) : kind === 'boomerang' ? 294 : 312;
  const rangeFight = kind === 'thermal' || kind === 'boomerang';
  if(kind==='wall'){
    c.fillStyle='#35474b';c.fillRect(460,56,21,180);
    c.fillStyle='#60777b';for(let y=57;y<236;y+=18)c.fillRect(461,y,19,3);
  }
  const frozen = kind === 'shatter' || kind === 'thermal';
  if(frozen&&time<hitAt){
    c.fillStyle='#81cbea57';c.fillRect(defender-22,116,44,53);
    c.strokeStyle='#9de4f4';c.strokeRect(defender-22,116,44,53);
  }
  explorer(c,defender+(kind==='wall'?0:recoil),165,-1,age>=0?'get_hit':'idle',actionTime/0.23,
    kind==='boomerang'?{hand1:'sword',hand2:'shield'}:{hand1:'sword'});
  if(kind==='counter'||kind==='missed'){
    const start=Math.max(0,0.55-settings.guardWindow);
    const high=kind==='counter'&&time>=start&&time<=0.55;
    const open=time>=0.55&&time<0.55+counterTime;
    c.fillStyle=high?'#86d5ff':open?'#ffd78a':'#426c72';
    c.fillRect(high?208:defender-12,age>=0?104:109,25,3);
  }
  if(kind==='team'){
    explorer(c,200,154,1,'block',0,{hand2:'shield'});
    if(settings.teamCallouts&&age>=0&&age<0.82){
      c.fillStyle='#ffdb9c';c.font='13px system-ui';c.fillText('Setup',176,98);c.fillText('Finish',217,224);
    }
  }
  const attackerX=hand?.x??(rangeFight?155:kind==='wall'?222:kind==='team'?221:220);
  const attackerY=hand?.y??(kind==='team'?210:kind==='missed'?mix(172,212,time/0.55):172);
  const clip=kind==='shield'?'block':rangeFight?'cast':time<hitAt-0.23?'idle':'swipe_one';
  explorer(c,attackerX,attackerY,1,clip,(time-hitAt+0.25)/0.39,
    kind==='shield'?{hand2:'shield'}:rangeFight?{hand1:kind==='thermal'?'fire_wand':'starter_boomerang'}:{hand1:'sword'});
  if(hand){
    const origin={x:117,y:97};
    const apex=projectBoomerangTurn(origin,{x:1,y:0},337);
    const startReturn=0.56+settings.boomerangTurnTime;
    const flight=(time-startReturn)*settings.boomerangReturnSpeed/0.85;
    if(settings.boomerangGuide)dashedLine(c,apex,hand,'#e9c674');
    if(time<startReturn+0.85/settings.boomerangReturnSpeed){
      const x=time<startReturn?mix(origin.x,apex.x,time/0.56):mix(apex.x,hand.x,flight);
      const y=time<startReturn?origin.y:mix(apex.y,hand.y,flight);
      c.save();c.translate(x,y);c.rotate(time*15);c.fillStyle='#eed088';
      c.fillRect(-5,-2,11,4);c.fillRect(-6,-2,4,8);c.restore();
    }
  }
  if(kind==='shatter'&&age>=0&&age<0.52){
    drawGameplayFx(c,'ice-break',defender,146,age,1,null,{life:0.52});
    c.strokeStyle='#86d5ff';c.globalAlpha=1-age/0.52;c.beginPath();
    c.ellipse(defender,164,settings.shatterRange*age/0.52,settings.shatterRange*age/0.84,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;
  }
  if(impact)waveform(c,impact,kind==='shield'?attackerX+15:defender,165,age);
  c.restore();
}

export class CombatWorkshopEditor {
  constructor() {
    this.draft = {...combatTuning};
    this.preview = 'cut';
  }

  stop() {
    cancelAnimationFrame(this.frame);
  }

  mount(root) {
    this.stop();
    root.className = 'combat-workshop-editor';
    root.replaceChildren();
    const controls = node('form',null,'combat-workshop-settings');
    const toolbar = node('div',null,'combat-workshop-toolbar');
    const save = node('button','Save combat settings');
    const reset = node('button','Restore defaults');
    reset.type = 'button';
    toolbar.append(save,reset);
    const status = node('p','Changes affect this computer after saving.','combat-workshop-status');
    status.setAttribute('role','status');
    const actions=node('div',null,'combat-workshop-actions');
    actions.append(toolbar,status);
    controls.append(actions);
    const groups = new Map();
    const inputs = new Map();
    for(const field of COMBAT_FIELDS){
      let group = groups.get(field.group);
      if(!group){
        group=node('fieldset');
        group.append(node('legend',field.group));
        groups.set(field.group,group);
        controls.append(group);
      }
      const label=node('label',field.label);
      const input=node('input');
      input.name=field.key;
      if(typeof field.value==='boolean'){
        input.type='checkbox';
        input.checked=this.draft[field.key];
      }else{
        input.type='number';
        Object.assign(input,{min:field.min,max:field.max,step:field.step,value:this.draft[field.key]});
      }
      input.oninput=()=>{
        if(input.type==='checkbox'||input.value!==''&&input.validity.valid){
          this.draft[field.key]=input.type==='checkbox'?input.checked:input.valueAsNumber;
          status.textContent='Preview updated. Save to apply in the game.';
          show();
        }
      };
      inputs.set(field.key,input);
      label.append(input);group.append(label);
    }
    const preview=node('section',null,'combat-workshop-preview');
    const label=node('label','Preview');
    const select=node('select');
    for(const [id,demo] of Object.entries(PREVIEWS))select.append(new Option(demo.label,id));
    select.value=this.preview;
    label.append(select);
    const replay=node('button','Replay');
    const cue=node('p',PREVIEWS[this.preview].cue);
    const canvas=node('canvas');
    canvas.width=560;canvas.height=300;
    canvas.setAttribute('aria-label','Combat timing and effect preview');
    preview.append(label,replay,canvas,cue);
    root.append(controls,preview);

    const context=canvas.getContext('2d');
    const show=()=>{
      this.stop();
      let start;
      const tick=time=>{
        if(!root.isConnected||!root.closest('dialog')?.open)return;
        start??=time;
        const elapsed=(time-start)/1000;
        previewFrame(context,this.preview,this.draft,elapsed);
        if(elapsed<2.15)this.frame=requestAnimationFrame(tick);
      };
      this.frame=requestAnimationFrame(tick);
    };
    select.onchange=()=>{this.preview=select.value;cue.textContent=PREVIEWS[this.preview].cue;show();};
    replay.onclick=show;
    controls.onsubmit=event=>{
      event.preventDefault();
      try{
        this.draft=saveCombatTuning(this.draft);
        status.textContent='Combat settings saved and active.';
      }catch{
        status.textContent='Combat settings could not be saved.';
      }
    };
    reset.onclick=()=>{
      this.draft=normalizeCombatTuning(DEFAULT_COMBAT_TUNING);
      for(const [key,input] of inputs){
        if(input.type==='checkbox')input.checked=this.draft[key];
        else input.value=this.draft[key];
      }
      status.textContent='Defaults restored in preview. Save to apply.';
      show();
    };
    previewFrame(context,this.preview,this.draft,0.8);
  }
}
