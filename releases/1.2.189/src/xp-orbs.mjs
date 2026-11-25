export function xpBurst(g,position,amount){
  const total=Math.max(0,Math.round(Number(amount)||0));
  const count=Math.min(32,Math.ceil(total/2));
  const phase=g.nextId*2.399963;
  for(let i=0;i<count;i++){
    const angle=phase+i*2.399963,speed=48+(i%5)*13;
    g.xpOrbs.push({id:g.nextId++,...position,amount:Math.floor(total/count)+(i<total%count?1:0),
      originX:position.x,originY:position.y,bornAt:g.time,readyAt:g.time+.35,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,z:3,vz:65+(i%3)*12});
  }
}

export function tickXPOrbs(g,dt){
  const heroes=g.players.filter(p=>p.hp>0&&!p.room);
  for(const orb of [...g.xpOrbs]){
    const age=Math.max(0,g.time-(orb.bornAt??g.time));
    orb.z=Math.max(0,(orb.z||0)+(orb.vz||0)*dt);
    orb.vz=orb.z>0?(orb.vz||0)-230*dt:0;
    const target=age>=.35?heroes.reduce((best,p)=>{
      const d=Math.hypot(p.x-orb.x,p.y-orb.y);
      return d<220&&(!best||d<best.d)?{p,d}:best;
    },null):null;
    orb.attracted=!!target;
    if(target){
      const speed=Math.min(460,130+Math.max(0,age-.35)*210),blend=1-Math.exp(-12*dt);
      orb.vx=(orb.vx||0)+(target.p.x-orb.x)/(target.d||1)*speed*blend-(orb.vx||0)*blend;
      orb.vy=(orb.vy||0)+(target.p.y-orb.y)/(target.d||1)*speed*blend-(orb.vy||0)*blend;
      if(target.d<Math.max(16,speed*dt)){g.collectXP(target.p,orb);continue;}
    }else{
      const drag=Math.exp(-5*dt);orb.vx=(orb.vx||0)*drag;orb.vy=(orb.vy||0)*drag;
    }
    orb.x+=orb.vx*dt;orb.y+=orb.vy*dt;
  }
}
