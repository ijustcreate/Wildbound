const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
// Two continuously advancing companions; at most two retiring voices on route changes.
export class AdaptiveMusic {
  constructor(createAudio=file=>new Audio(file)){
    this.createAudio=createAudio;this.voices=[];this.pair=null;this.running=false;this.enabled=true;this.volume=0;this.mix=0;
  }
  setPair(pair){
    const key=pair.calm.id+':'+pair.combat.id;
    if(key===this.key)return;
    this.key=key;this.pair=pair;
    const ids=new Set([pair.calm.id,pair.combat.id]);
    for(const v of this.voices)v.retiring=!ids.has(v.track.id);
    for(const track of [pair.calm,pair.combat]){
      if(this.voices.some(v=>v.track.id===track.id))continue;
      const media=this.createAudio(track.file);media.loop=true;media.volume=0;media.preload='auto';
      this.voices.push({track,media,gain:0,pending:false,playing:false,serial:0,retiring:false,disposed:false});
    }
    this.mix=0;
    const retired=this.voices.filter(v=>v.retiring).sort((a,b)=>b.gain-a.gain);
    for(const v of retired.slice(2))this.release(v);
    this.voices=this.voices.filter(v=>!v.disposed);
    this.ensurePlaying();
  }
  ensurePlaying(){
    if(!this.running||!this.enabled)return;
    for(const v of this.voices){
      if(v.disposed||v.retiring||v.playing||v.pending||v.failed)continue;
      const serial=++v.serial;v.pending=true;
      let promise;try{promise=v.media.play();}catch{v.pending=false;v.failed=true;continue;}
      Promise.resolve(promise).then(()=>{
        if(v.disposed||!this.running||!this.enabled){v.media.pause();return;}
        if(serial!==v.serial)return;
        v.pending=false;v.playing=true;
      },()=>{if(serial===v.serial){v.pending=false;v.playing=false;v.failed=true;}});
    }
  }
  resume(){this.activated=true;this.running=true;for(const v of this.voices)v.failed=false;this.ensurePlaying();}
  pause(){this.running=false;for(const v of this.voices){v.serial++;v.pending=false;v.playing=false;v.media.volume=0;v.media.pause();}}
  release(v){v.disposed=true;v.serial++;v.media.volume=0;v.media.pause();v.media.removeAttribute?.('src');v.media.load?.();}
  update({enabled=true,volume=0,intensity=0,preview=false,duck=1},dt=.016){
    this.enabled=enabled;this.volume=clamp(volume);
    if(!enabled||!this.volume){if(this.running)this.pause();return;}
    if(this.activated)this.running=true;
    dt=Math.max(0,Math.min(.25,dt));
    this.mix+=(clamp(intensity)-this.mix)*(1-Math.exp(-dt/(intensity>.5?.65:2.4)));
    const total=this.volume*clamp(duck)*(preview?.15:1);
    for(const v of this.voices){
      const share=v.retiring?0:v.track.id===this.pair?.combat.id?this.mix:1-this.mix;
      const target=total*share;
      v.gain+=(target-v.gain)*(1-Math.exp(-dt/(v.retiring?.65:.28)));
      v.media.volume=clamp(v.gain);
      if(v.retiring&&v.gain<.001)this.release(v);
    }
    this.voices=this.voices.filter(v=>!v.disposed);this.ensurePlaying();
  }
  get src(){return this.voices.find(v=>v.track.id===this.pair?.calm.id)?.media.src||'';}
  get loop(){return true;}
  dispose(){for(const v of this.voices)this.release(v);this.voices=[];this.running=false;this.activated=false;}
}
