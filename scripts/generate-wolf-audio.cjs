// Original synthesized canine calls. Deterministic PCM assets, no external recordings.
const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../assets/sfx/wolf');fs.mkdirSync(dir,{recursive:true});
for(const [name,duration,base] of [['howl',2.4,410],['snarl',.65,105],['yelp',.45,690],['whimper',.9,390]]){
 const rate=22050,n=Math.floor(rate*duration),b=Buffer.alloc(44+n*2);let phase=0,seed=937,filtered=0;
 b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const t=i/rate,u=t/duration;seed=(1664525*seed+1013904223)>>>0;filtered=filtered*.7+(seed/4294967296*2-1)*.3;
  const pitch=base*(name==='howl'?.72+.38*Math.sin(u*Math.PI*.95):name==='yelp'?1.35-.7*u:1-.28*u)*(1+.018*Math.sin(t*31));phase+=Math.PI*2*pitch/rate;
  const envelope=Math.min(1,t/.07)*Math.pow(Math.sin(Math.PI*u),.65);
  const tone=Math.sin(phase)+.32*Math.sin(phase*2)+.12*Math.sin(phase*3);
  const v=envelope*(name==='snarl'?.32*tone*(.55+.45*Math.sin(t*143))+.7*filtered:.45*tone+.05*filtered);
  b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*.78*32767),44+i*2);
 }fs.writeFileSync(path.join(dir,name+'.wav'),b);
}
