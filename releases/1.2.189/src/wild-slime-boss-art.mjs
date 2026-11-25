const lerp = (from,to,t) => from+(to-from)*t;
const clamp = t => Math.max(0,Math.min(1,t));

function impactRing(c,point,radius,age){
  const t=clamp(age/.38);
  if(t>=1)return;
  c.save();
  c.globalAlpha=1-t;
  c.strokeStyle='#b9dc75';
  c.lineWidth=3;
  c.beginPath();
  c.ellipse(point.x,point.y,radius*lerp(.36,1,t),radius*lerp(.27,.76,t),0,0,Math.PI*2);
  c.stroke();
  for(let i=0;i<12;i++){
    const angle=(i+.2)*Math.PI/6;
    const travel=radius*lerp(.28,.96,t)*(i%2===0?1:.72);
    const x=point.x+Math.cos(angle)*travel;
    const y=point.y+Math.sin(angle)*travel*.76-Math.sin(t*Math.PI)*(i%3+2)*4;
    c.fillStyle=i%2===0?'#e6eda4':'#6e9b4b';
    c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,4,3);
  }
  c.restore();
}

export function drawWildSlimeTell(c,boss,visible){
  const move=boss.wildSlimeMove;
  if(boss.hp<=0||!move)return;
  if(move.phase==='entry'&&move.elapsed>=.66&&visible(boss,65))impactRing(c,boss,48,move.elapsed-.66);
  if(!move.target||!visible(move.target,move.radius||0))return;
  if(move.phase==='recover'){
    impactRing(c,move.target,move.radius,move.elapsed);
    return;
  }
  if(move.phase!=='windup'&&move.phase!=='slam')return;
  const t=move.phase==='slam'?1:clamp(move.elapsed/move.duration);
  c.save();
  c.beginPath();
  c.arc(move.target.x,move.target.y,move.radius,0,Math.PI*2);
  c.fillStyle=`rgba(237,134,57,${.2+t*.18})`;
  c.fill();
  c.lineWidth=5;
  c.strokeStyle='#6e3828';
  c.stroke();
  c.lineWidth=2;
  c.strokeStyle='#ffd58b';
  c.stroke();
  c.restore();
}

export function drawMireheart(c,boss,size,paint){
  const move=boss.wildSlimeMove;
  const t=move?clamp(move.elapsed/move.duration):0;
  let squash=0,animationAction,poseTime;
  if(boss.hp>0&&move){
    switch(move.phase){
      case 'entry':
        squash=move.elapsed<.66?-.27*clamp(move.elapsed/.66):.37*(1-clamp((move.elapsed-.66)/.24));
        break;
      case 'hop':
        squash=Math.sin(t*Math.PI*2)*-.12;
        animationAction='run';poseTime=t;
        break;
      case 'windup':
        squash=t*.3;
        animationAction='attack';poseTime=t*.36;
        break;
      case 'slam':
        squash=-.28*Math.sin(t*Math.PI);
        animationAction='attack_alt';poseTime=lerp(.32,.8,t);
        break;
      case 'recover':
        squash=.4*(1-clamp(move.elapsed/.32));
        animationAction='attack';poseTime=lerp(.74,1,t);
        break;
    }
  }
  const anchorY=boss.y-(boss.jumpHeight||0)-(boss.groundHeight||0);
  c.save();
  if(boss.hp<=0)c.globalAlpha*=1-clamp(((boss.deathTimer||0)-.5)/1.2);
  c.translate(boss.x,anchorY);
  c.scale(1+squash*.6,1-squash);
  c.translate(-boss.x,-anchorY);
  paint(animationAction?{...boss,animationAction,poseTime}:boss,size);
  c.restore();
}

export function drawMireheartHealth(c,boss,w,h){
  const width=Math.min(220,w*.55), x=Math.round((w-width)/2),y=Math.round(Math.max(24,Math.min(56,h*.13)));
  c.save();
  c.textAlign='center';
  c.textBaseline='bottom';
  c.font='600 14px system-ui';
  c.strokeStyle='#18251d';
  c.lineWidth=3;
  c.strokeText(boss.name,w/2,y-3);
  c.fillStyle='#f7edce';
  c.fillText(boss.name,w/2,y-3);
  c.fillStyle='#1c2920';
  c.fillRect(x-2,y-2,width+4,10);
  c.fillStyle='#546740';
  c.fillRect(x,y,width,6);
  c.fillStyle='#b5d270';
  c.fillRect(x,y,Math.round(width*clamp(boss.hp/boss.maxHp)),6);
  c.restore();
}
