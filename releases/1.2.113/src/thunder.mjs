// A seeded, low-frequency noise roll: no downloaded sound asset or hot clipping.
export function thunderSamples(rate=22050,seconds=3.6){
 const samples=new Float32Array(Math.ceil(rate*seconds));let seed=41721,low=0;
 for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low=low*.975+noise*.025;const t=i/rate,envelope=Math.min(1,t/.03)*Math.exp(-t*.85)*(1+.25*Math.sin(t*11));samples[i]=(low*2.6+noise*.1*Math.exp(-t*5))*envelope;}
 return samples;
}
export function playThunder(audio){
 if(!audio.enabled||!audio.unlocked||!audio.ctx)return;
 const c=audio.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
 if(!audio.thunderBuffer){const data=thunderSamples(c.sampleRate);audio.thunderBuffer=c.createBuffer(1,data.length,c.sampleRate);audio.thunderBuffer.copyToChannel(data,0);}
 source.buffer=audio.thunderBuffer;filter.type='lowpass';filter.frequency.value=900;gain.gain.value=.6;source.connect(filter);filter.connect(gain);gain.connect(audio.buses.ambience);audio.voices.add(source);
 source.onended=()=>{audio.voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(c.currentTime+.35);
}
