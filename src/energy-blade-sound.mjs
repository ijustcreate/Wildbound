const notes={
 ignite:{seconds:.43,from:68,to:176,noise:.05,rise:.10,decay:1.2},
 swing:{seconds:.24,from:270,to:98,noise:.12,rise:.065,decay:1.9},
 hit:{seconds:.14,from:396,to:113,noise:.34,rise:.035,decay:2.7},
};

export function synthesizeEnergyBlade(ctx,sound){
 const note=notes[sound];
 if(!note)return null;
 const rate=ctx.sampleRate,buffer=ctx.createBuffer(1,Math.ceil(rate*note.seconds),rate),data=buffer.getChannelData(0);
 let phase=0,noise=0,seed=91627;
 for(let i=0;i<data.length;i++){
  const t=i/rate,progress=t/note.seconds;
  phase+=Math.PI*2*(note.from+(note.to-note.from)*progress)/rate;
  seed=(seed*16807)%2147483647;noise=noise*.68+(seed/1073741823.5-1)*.32;
  const envelope=Math.min(1,progress/note.rise)*(1-progress)**note.decay;
  data[i]=envelope*(Math.sin(phase)*.55+Math.sin(phase*2.02)*.20+Math.sin(phase*.51)*.1+noise*note.noise)*.8;
 }
 return buffer;
}
