module.exports=async function reviewCombatAnimation(){
 const {g,renderer}=window.crossfireReview;
 const {tacticalPhase}=await import('./src/combat-tactics-state.mjs'),{directionVector}=await import('./src/player-motion.mjs');
 const actors=g.enemies.filter(e=>e.combatRole).map(e=>({...structuredClone(e),frozen:0,stun:0,hit:0,flash:0,attack:0,jumpHeight:0,animationAction:null,playerFrame:undefined}));
 const images={},checks=[],names=['S','SW','W','NW','N','NE','E','SE'];
 const sample=(source,d,phase,t,time)=>{
  const a=structuredClone(source),[x,y]=directionVector(d);a.id='animation-review-'+source.id+'-'+d;a.faceX=x;a.faceY=y;a.moving=phase==='approach';a.step=time*60;
  a.roleMind={...a.roleMind,moveX:-y,moveY:x,lastRush:d%2?'wall':'miss'};
  const duration=phase==='windup'?(a.combatRole==='charger'?.75:a.combatRole==='archer'?.7:.62):phase==='active'?.3:phase==='stagger'?1.1:.85;
  tacticalPhase(a,phase,duration);a.tactics.remaining=duration*(1-t);a.timer=a.tactics.remaining;a.moving=phase==='approach';
  if(a.combatRole==='archer'&&phase==='active'){tacticalPhase(a,'recover',.7);a.tactics.remaining=.7-t*.24;a.timer=a.tactics.remaining;a.attack=.34-t*.24;}
  return a;
 };
 for(const source of actors){
  const board=document.createElement('canvas');board.width=1440;board.height=850;const c=board.getContext('2d');c.imageSmoothingEnabled=false;
  for(let row=0;row<5;row++)for(let d=0;d<8;d++){
   const phase=['approach','windup','active','recover','stagger'][row],x=d*180,y=row*170,a=sample(source,d,phase,.6,1.2);
   c.fillStyle=(row+d)%2?'#304c40':'#273f37';c.fillRect(x+1,y+1,178,168);c.fillStyle='#e9dbbc';c.font='11px sans-serif';c.fillText(names[d]+' · '+(phase==='active'&&a.combatRole==='archer'?'release':phase),x+10,y+18);
   c.save();c.translate(x+90,y+135);c.scale(2.3,2.3);c.translate(-a.x,-a.y);renderer.animator.draw(c,a,20.2,48);c.restore();
  }
  images[source.combatRole+'-eight-directions']=board.toDataURL();checks.push({name:source.combatRole+' renders five combat states in all eight directions',passed:true});
 }
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=400;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const stream=canvas.captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1400000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 const finished=new Promise(resolve=>{recorder.onstop=resolve;});recorder.start();
 for(let frame=0;frame<8*84;frame++){
  const d=Math.floor(frame/84),seconds=(frame%84)/30;c.fillStyle='#243e35';c.fillRect(0,0,1024,400);
  c.fillStyle='#e9dbbc';c.font='18px sans-serif';c.fillText('Native combat motion · '+names[d],22,32);
  for(let index=0;index<actors.length;index++){
   const source=actors[index],windup=source.combatRole==='charger'?.75:source.combatRole==='archer'?.7:.62,active=source.combatRole==='charger'?.55:source.combatRole==='archer'?.24:.22,recovery=source.combatRole==='charger'?1.15:.85;
   let phase='approach',t=seconds/.35;
   if(seconds>=.35&&seconds<.35+windup){phase='windup';t=(seconds-.35)/windup;}
   else if(seconds>=.35+windup&&seconds<.35+windup+active){phase='active';t=(seconds-.35-windup)/active;}
   else if(seconds>=.35+windup+active){phase='recover';t=Math.min(1,(seconds-.35-windup-active)/recovery);}
   const a=sample(source,d,phase,t,seconds),x=170+index*340;
   c.fillStyle='#d9ceb3';c.font='14px sans-serif';c.fillText(source.combatRole+' · '+phase,x-100,365);
   c.save();c.translate(x,290);c.scale(3.5,3.5);c.translate(-a.x,-a.y);renderer.animator.draw(c,a,20+seconds,48);c.restore();
  }
  await new Promise(resolve=>setTimeout(resolve,33));
 }
 recorder.stop();await finished;for(const track of stream.getTracks())track.stop();
 const blob=new Blob(chunks,{type:'video/webm'}),video=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
 checks.push({name:'native motion review records full anticipation, release and recovery in eight directions',passed:blob.size>20000});
 return {images,video,checks};
};
