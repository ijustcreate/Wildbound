// Synthesized steam and mechanical cues routed through the game's live SFX mixer.
// All source material is generated locally; no external recording licenses.
export function playTrainAudio(audio,event,actor,speed=0){
 if(!audio?.enabled||!audio.unlocked||!audio.ctx||!audio.settings.master||!audio.settings.sfx)return;
 const a=audio.ctx,bus=audio.buses.sfx,spatial=audio.game?.trainTest&&audio.game.players.some(p=>p.trainRide)?{attenuation:.85,pan:0}:audio.spatial({distance:event==='whistle'?2300:1300},actor);if(spatial.attenuation<.002)return;
 const now=a.currentTime,voice=a.createGain();voice.gain.value=spatial.attenuation*(event==='whistle'?.44:.1);const pan=a.createStereoPanner();pan.pan.value=spatial.pan;voice.connect(pan);pan.connect(bus);let end=now+.5;
 const noise=(duration,frequency,gain)=>{const n=Math.ceil(a.sampleRate*duration),buffer=a.createBuffer(1,n,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1);const src=a.createBufferSource(),filter=a.createBiquadFilter(),env=a.createGain();src.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.5;src.connect(filter);filter.connect(env);env.connect(voice);env.gain.setValueAtTime(0,now);env.gain.linearRampToValueAtTime(gain,now+.012);env.gain.exponentialRampToValueAtTime(.0001,now+duration);src.start(now);src.stop(now+duration);end=Math.max(end,now+duration);};
 const note=(hz,duration,gain,type='sine')=>{const o=a.createOscillator(),v=a.createGain();o.type=type;o.frequency.setValueAtTime(hz*.97,now);o.frequency.linearRampToValueAtTime(hz,now+.12);o.connect(v);v.connect(voice);v.gain.setValueAtTime(0,now);v.gain.linearRampToValueAtTime(gain,now+.08);v.gain.setTargetAtTime(.0001,now+duration*.65,.1);o.start(now);o.stop(now+duration);end=Math.max(end,now+duration);};
 if(event==='whistle'){for(const [f,v]of[[392,.65],[494,.45],[587,.33],[784,.13]])note(f,1.55,v);noise(1.4,2200,.17);}
 if(event==='chuff'){noise(.13+Math.max(0,.1-speed/1200),550+speed*2,.9);note(65+speed*.1,.13,.2,'triangle');}
 if(event==='clack'){noise(.055,1800,.7);note(180,.075,.15,'triangle');}
 if(event==='brake'||event==='steam'){noise(event==='steam'?1.2:.65,event==='steam'?1400:2700,.75);}
 if(event==='door'){noise(.12,650,.45);note(150,.12,.3,'triangle');}
 setTimeout(()=>{voice.disconnect();pan.disconnect();},Math.max(100,(end-now)*1000+200));
}

// One bounded mechanical loop per mixer; listener attachment keeps rear coaches audible.
export function stopTrainAudio(audio){const loop=audio?.trainLoop;if(!loop)return;loop.noise.stop();loop.rumble.stop();for(const node of loop.nodes)node.disconnect();delete audio.trainLoop;}
export function updateTrainAudio(audio,g,active){const t=g?.trainTest;if(!active||!t||!audio?.enabled||!audio.unlocked||!audio.ctx||!audio.settings.master||!audio.settings.sfx){stopTrainAudio(audio);return;}
 if(!t.engine&&t.speed<1){stopTrainAudio(audio);return;}
 const a=audio.ctx;let loop=audio.trainLoop;
 if(!loop){const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.12)/1.04;data[i]=last*3;}const noise=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain(),pan=a.createStereoPanner(),rumble=a.createOscillator(),rumbleGain=a.createGain();noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=650;gain.gain.value=0;noise.connect(filter);filter.connect(gain);rumble.type='triangle';rumble.frequency.value=42;rumbleGain.gain.value=.18;rumble.connect(rumbleGain);rumbleGain.connect(gain);gain.connect(pan);pan.connect(audio.buses.sfx);noise.start();rumble.start();loop=audio.trainLoop={noise,filter,gain,pan,rumble,nodes:[noise,filter,gain,pan,rumble,rumbleGain]};}
 const riders=g.players.some(p=>p.trainRide),engine=t.audioEngine||g.players[0],spatial=audio.spatial({distance:1500},engine),audibility=riders?.8:spatial.attenuation,speed=Math.min(1,t.speed/150),pulse=.86+Math.sin(t.distance/14)*.14;
 loop.gain.gain.setTargetAtTime(audibility*(.05+speed*.14)*pulse,a.currentTime,.1);loop.pan.pan.setTargetAtTime(riders?0:spatial.pan,a.currentTime,.12);loop.filter.frequency.setTargetAtTime(400+speed*1300,a.currentTime,.2);loop.rumble.frequency.setTargetAtTime(35+speed*35,a.currentTime,.2);loop.noise.playbackRate.setTargetAtTime(.7+speed*.8,a.currentTime,.2);
}
