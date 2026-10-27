import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EVENTS} from '../src/core.mjs';
import {encounterRole} from '../src/expedition-trials.mjs';
import {ENCOUNTER_CUES as previousCues} from '../src/encounter-cues.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),rate=22050;
const onlyMissing=process.argv.includes('--only-missing');
const previousManifest=onlyMissing?JSON.parse(fs.readFileSync(path.join(root,'assets/sfx/encounters/manifest.json'),'utf8')):[];
const preserved=new Map(previousManifest.map(e=>[e.name,e]));
const hash=s=>[...s].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
const families={ghost:'ghost',shore_goblin:'water',lion:'growl',tiger:'growl',white_lion:'growl',panther:'growl',snow_leopard:'growl',dreadmane_lion:'growl',wolf:'howl',bat:'flutter',bee:'buzz',wasp:'buzz',tsetse:'buzz',beetle:'click',spider:'click',tarantula:'click',snake:'hiss',anaconda:'hiss',crocodile:'water',monkey:'wood',boar:'wood',gorilla:'drum',rhino:'drum',golem:'stone',dragon:'fire',fire_elemental:'fire',water_elemental:'water',banshee_queen:'ghost',succubus:'ghost',grim_reaper:'ghost',zombie:'grave',skeleton:'bone',archer:'bone',skeleton_unarmed:'bone',skeleton_boss:'bone',skeleton_wizard:'bell',necromancer:'bell',hunter:'metal',oathless_captain:'metal',merchant:'coin',villagers:'pluck',breather:'pluck',old_well:'drip',mausoleum:'bell',volcano:'fire',sandstorm:'hiss',blizzard:'chime',monsoon:'water',thunderstorm:'drum',raven:'flutter',crow:'flutter'};
Object.assign(families,{marsh_lanterns:'chime',singing_geodes:'bell',shadow_wards:'ghost',murk_wolf:'howl'});
const entries=EVENTS.map((e,i)=>({id:`encounter-${String(i).padStart(2,'0')}`,name:e.name,role:encounterRole(e),voice:families[e.kind]||(['mystery','friendly_npc'].includes(e.type)?'bell':'wood')}));
const destinations=['forest','desert','ice','house','temple','graveyard','beach','swamp','caverns','shadow'];
for(const [i,zone]of destinations.entries())entries.push({id:'travel-'+zone,name:'Travel · '+zone,voice:['wood','hiss','chime','pluck','bell','ghost','water','water','drip','ghost'][i],role:'travel'});
entries.push({id:'seal-start',name:'The seal begins',voice:'bell',role:'boss'},{id:'seal-complete',name:'The world is sealed',voice:'chime',role:'resolution'},{id:'expedition-defeat',name:'The board waits again',voice:'ghost',role:'resolution'});
const folder=path.join(root,'assets/sfx/encounters');fs.mkdirSync(folder,{recursive:true});
for(const entry of entries){
  const previous=preserved.get(entry.name);
  if(previous&&fs.existsSync(path.join(root,previous.file))){Object.assign(entry,previous);continue;}
  if(onlyMissing&&fs.existsSync(path.join(folder,entry.id+'.wav')))throw Error('Refusing to overwrite unrecognized existing cue '+entry.id);
  let seed=hash(entry.name);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const boss=entry.role==='boss',length=boss?2.15:entry.role==='resolution'?2.35:1.05+random()*.5;
  const samples=new Float64Array(Math.ceil(rate*length));
  const base=85+hash(entry.id)%160,scale=[0,3,5,7,10,12],count=boss?7:3+hash(entry.name)%4;
  const motif=[];
  function sound(start,duration,freq,gain,voice){
    let low=0;const steps=Math.floor(duration*rate),offset=Math.floor(start*rate);
    for(let n=0;n<steps&&n+offset<samples.length;n++){
      const t=n/rate,u=n/steps,noise=random()*2-1;low=low*.93+noise*.07;
      const env=Math.min(1,u/.035)*Math.pow(1-u,voice==='bell'||voice==='chime'?2:1.3);
      let v;
      switch(voice){
        case 'growl':v=(Math.sin(2*Math.PI*freq*t+3*Math.sin(2*Math.PI*24*t))*.6+low*3)*(.65+.35*Math.sin(t*60));break;
        case 'howl':v=Math.sin(2*Math.PI*(freq*2)*t+Math.sin(t*15)*4)*.8+Math.sin(2*Math.PI*freq*t)*.2;break;
        case 'hiss':v=(noise-low)*(.4+.6*u);break;
        case 'water':case 'drip':v=Math.sin(2*Math.PI*(freq*3*t+120*t*t))*Math.exp(-u*6)+low;break;
        case 'buzz':v=(Math.sin(2*Math.PI*freq*3*t)>.2?.5:-.5)*(.5+.5*Math.sin(t*85));break;
        case 'flutter':v=low*4*Math.sin(t*100)+Math.sin(2*Math.PI*freq*5*t)*Math.exp(-u*10)*.3;break;
        case 'fire':v=low*6+(noise-low)*.25+Math.sin(2*Math.PI*freq*.5*t)*.4;break;
        case 'ghost':v=(Math.sin(2*Math.PI*freq*t)+Math.sin(2*Math.PI*freq*1.017*t))*.35+low*.5;break;
        case 'grave':v=low*4+Math.sin(2*Math.PI*(freq*t-20*t*t))*.4;break;
        case 'bell':case 'chime':case 'coin':case 'metal':v=(Math.sin(2*Math.PI*freq*2*t)+Math.sin(2*Math.PI*freq*5.41*t)*.4+Math.sin(2*Math.PI*freq*8.3*t)*.15)*Math.exp(-u*4);break;
        case 'wood':case 'stone':case 'bone':case 'click':case 'drum':v=(Math.sin(2*Math.PI*(freq*t+freq*.03*(1-Math.exp(-t*35))))*.6+noise*.25)*Math.exp(-u*9);break;
        default:v=(Math.sin(2*Math.PI*freq*2*t)+Math.sin(2*Math.PI*freq*4*t)*.3)*Math.exp(-u*6);
      }
      samples[n+offset]+=v*gain*env;
    }
  }
  // A fixed score per card: independent note sequence, gaps, lengths and accents.
  let start=.025;
  for(let i=0;i<count;i++){
    const note=scale[Math.floor(random()*scale.length)],duration=.12+random()*(boss?.65:.34),gap=.1+random()*.13;
    const freq=base*2**(note/12);motif.push({at:+start.toFixed(3),duration:+duration.toFixed(3),note,accent:i===0||i===count-1});
    sound(start,duration,freq,i===0?.42:.3,entry.voice);
    if(boss&&i%2===0)sound(start+.035,.28,45+i*6,.22,'drum');
    start+=gap;
  }
  if(entry.role==='resolution')sound(.55,1.6,base*2,.22,entry.voice);
  const peak=Math.max(...samples.map(Math.abs)),out=Buffer.alloc(44+samples.length*2);
  out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++)out.writeInt16LE(Math.round(samples[i]/Math.max(1,peak/.72)*32767),44+i*2);
  entry.file=`assets/sfx/encounters/${entry.id}.wav`;entry.duration=length;entry.motif=motif;entry.source='Original deterministic synthesis; no external samples';
  fs.writeFileSync(path.join(root,entry.file),out);
}
fs.writeFileSync(path.join(root,'assets/sfx/encounters/manifest.json'),JSON.stringify(entries,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/encounter-cues.mjs'),`// Generated by scripts/generate-encounter-audio.mjs. Original compositions.\nexport const ENCOUNTER_CUES=${JSON.stringify(Object.fromEntries(entries.map(e=>[e.name,onlyMissing&&previousCues[e.name]||{files:[e.file],key:e.id,bus:'ui',gain:.3,group:'notification',priority:95,polyphony:3,cooldown:550,maxDuration:2.5,spatial:false}])))};\nexport const encounterCue=event=>event?.audioCue||ENCOUNTER_CUES[event?.name||event]||'event';\n`);
const rows=entries.map(e=>`<article><strong>${e.name.replaceAll('&','&amp;').replaceAll('<','&lt;')}</strong><small>${e.voice} · ${e.role}</small><audio controls preload="none" src="${e.file}"></audio></article>`).join('\n');
fs.writeFileSync(path.join(root,'encounter-audio-review.html'),`<!doctype html><meta charset="utf-8"><title>Wildbound · Encounter sound review</title><style>body{background:#172421;color:#edddbd;font:16px system-ui;max-width:1100px;margin:30px auto}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px}article{padding:14px;background:#29362e;border:1px solid #6c7954;display:grid;gap:10px}small{color:#b9c5ad}audio{width:100%}</style><h1>Wildbound encounter sound review</h1><p>Original composed cues for ${EVENTS.length} encounter cards, ${destinations.length} destinations, sealing and defeat. Playback starts only when you press Play.</p><main>${rows}</main>`);
fs.writeFileSync(path.join(folder,'CREDITS.md'),'# Original Wildbound encounter cues\n\nAll '+entries.length+' WAV files are original deterministic synthesized compositions created for Wildbound. No external audio samples, melodies or voices are used. Each card has its own fixed note sequence, rhythm, accents and texture. Recipes and scores: manifest.json. Reproduce: node scripts/generate-encounter-audio.mjs. Mono PCM 16 bit, 22050 Hz, peak limited to 0.72. The HTML review player has no autoplay.\n');
console.log(`Composed ${entries.length} cues (${EVENTS.length} encounters).`);
