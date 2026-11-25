const SOOT = ['#17151f', '#252131', '#353043', '#524759', '#786170'];
const EMBER = ['#49232d', '#9c3f35', '#e76235', '#ffa64e', '#fff0b6'];
const CLOUDS = [
  [3,5,7,8,8,7,4],
  [2,5,7,9,8,6,3],
  [4,6,8,8,7,5,2],
  [2,4,7,8,9,7,4],
];
const WISP = [
  '......2....',
  '.....23....',
  '....2331...',
  '....3452...',
  '..2345542..',
  '.234555432.',
  '..2455542..',
  '...344432..',
  '....3321...',
  '....21.....',
  '.....1.....',
];
const CORE = [
  '.......11......',
  '......1221.....',
  '...1.122221.1..',
  '..11223332211..',
  '..12334443321..',
  '.123445554431..',
  '.123455.55432..',
  '..2345...54321.',
  '..23455.55432..',
  '...234555432...',
  '...12344432....',
  '....12343211...',
  '.....12321.....',
  '......121......',
  '.......1.......',
];
const DEATH_SECONDS = 1.1;
const clamp = value => Math.max(0,Math.min(1,value));
const mix = (from,to,t) => from+(to-from)*t;
const rand = (seed,salt) => {
  const n=Math.imul(seed+salt*2179,0x45d9f3b);
  return ((n^(n>>>16))>>>0)/4294967296;
};

// Each articulated link sorts at its own ground point so trees, the party,
// and door frames can pass between the creature's smoke-covered branches.
export function smokeMonsterSubjects(enemy,visible){
  if(enemy.smokeMonsterRole!=='core'||(enemy.deathTimer||0)>=DEATH_SECONDS)return [];
  const parts=enemy.smokeMonsterParts||[];
  const subjects=[];
  for(const [index,part] of parts.entries()){
    if(part.hidden||!(part.progress>0))continue;
    const opacity=clamp(part.progress*2.3)*(1-clamp(part.breakProgress||0));
    if(opacity<=0)continue;
    const seed=(part.id??index+enemy.id*7)*137;
    const body={x:part.x,y:part.y,height:part.height||0,part,opacity,seed,index,enemy};
    if(visible({x:body.x,y:body.y-body.height},70))subjects.push(body);
    const link=part.link||[];
    for(let i=1;i<link.length;i++){
      const from=link[i-1],to=link[i];
      const length=Math.hypot(to.x-from.x,to.y-from.y,(to.height||0)-(from.height||0));
      const intervals=Math.min(12,Math.ceil(length/8.5));
      for(let j=0;j<intervals;j++){
        const t=(j+.5)/intervals;
        const x=mix(from.x,to.x,t),y=mix(from.y,to.y,t),height=mix(from.height||0,to.height||0,t);
        if(visible({x,y:y-height},40))subjects.push({
          x,y,height,part,opacity,seed:seed+i*61+j*13,index,enemy,
          thickness:mix(i===1?1:.78,i===link.length-1?.58:.8,t),
        });
      }
    }
  }
  return subjects;
}

function cloud(ctx,x,y,size,seed,color,alpha){
  const rows=CLOUDS[seed&3],step=Math.max(1,Math.round(size/5));
  const baseX=Math.round(x),baseY=Math.round(y)-3*step;
  ctx.globalAlpha=alpha;
  ctx.fillStyle=color;
  for(let i=0;i<rows.length;i++){
    const width=rows[i]*step;
    const offset=(i===1||i===5?((seed>>2)&1?1:-1):0)*step;
    ctx.fillRect(baseX-Math.floor(width/2)+offset,baseY+i*step,width,step);
  }
}

function pixelShape(ctx,rows,x,y,scale,palette){
  const step=Math.max(1,scale);
  const left=x-rows[0].length*step/2,top=y-rows.length*step/2;
  for(const [row,line] of rows.entries()){
    for(let start=0;start<line.length;){
      const value=line[start];
      let end=start+1;
      while(line[end]===value)end++;
      if(value!=='.'){
        ctx.fillStyle=palette[Number(value)-1];
        const x1=Math.round(left+start*step),x2=Math.round(left+end*step);
        const y1=Math.round(top+row*step),y2=Math.round(top+(row+1)*step);
        ctx.fillRect(x1,y1,x2-x1,y2-y1);
      }
      start=end;
    }
  }
}

function sparks(ctx,x,y,time,seed,radius,alpha,breaking){
  for(let i=0;i<(breaking?8:5);i++){
    const travel=breaking?clamp(breaking):((time*(.43+rand(seed,i+16)*.3)+rand(seed,i))%1);
    const angle=rand(seed,i+35)*Math.PI*2+time*.45;
    const drag=.4+rand(seed,i+29);
    const sx=x+Math.cos(angle)*radius*travel*drag;
    const sy=y+Math.sin(angle)*radius*travel*.7-travel*14;
    ctx.globalAlpha=alpha*(1-travel)*.88;
    ctx.fillStyle=EMBER[2+(i%3)];
    ctx.fillRect(Math.round(sx),Math.round(sy),i%3?2:3,i%3?2:3);
  }
}

export function drawSmokeMonsterSubject(ctx,subject,time){
  const {enemy,part,x,y,height,seed,thickness}=subject;
  const growth=enemy.smokeMonsterGrowth??1;
  const forming=growth<1;
  const core=part.role==='core';
  const age=enemy.smokeMonsterAge??time;
  const death=clamp((enemy.deathTimer||0)/DEATH_SECONDS);
  const isBreaking=part.breakProgress||death;
  const alpha=ctx.globalAlpha*subject.opacity*(1-death);
  if(alpha<.02)return;

  const scale=enemy.smokeMonsterScale??1;
  const phase=age*3.4+seed%31;
  const fy=y-height;
  ctx.save();
  if(thickness){
    const width=(3.6+Math.sin(phase)*.7)*(.55+scale*.45)*thickness;
    const dx=Math.sin(phase)*2,dy=Math.cos(phase*.81)*2;
    cloud(ctx,x+dx,fy+dy,width+2.7,seed,SOOT[0],alpha*.72);
    cloud(ctx,x-dx,fy-2+dy,width+.6,seed+1,SOOT[2],alpha*.49);
    if((seed&3)===0)cloud(ctx,x+dy,fy-5,width-.6,seed+2,SOOT[3],alpha*.32);
    if((seed&7)===0){
      ctx.globalAlpha=alpha*(.4+Math.sin(phase*1.7)*.22);
      ctx.fillStyle=EMBER[2];
      ctx.fillRect(Math.round(x-dx),Math.round(fy-dy),2,1);
    }
    ctx.restore();
    return;
  }

  const radius=(core?29:12)*(.58+scale*.42)*(forming?.48+growth*.52:1);
  ctx.globalAlpha=alpha*(core?.26:.14);
  ctx.fillStyle=SOOT[0];
  ctx.beginPath();
  ctx.ellipse(x,y+1,Math.max(5,radius*.88),Math.max(2,radius*.29),0,0,Math.PI*2);
  ctx.fill();

  for(let i=0;i<(core?12:7);i++){
    const angle=rand(seed,i+3)*Math.PI*2+age*(i%2?.9:-.7);
    const drift=(age*.62+rand(seed,i+22))%1;
    const reach=radius*(.43+rand(seed,i+34)*.49+isBreaking*.66);
    const px=x+Math.cos(angle)*reach;
    const py=fy+Math.sin(angle)*reach*.71-drift*(core?15:10);
    const size=(core?7.4:4.2)*(1.13-drift*.48)*(.77+rand(seed,i+43)*.44);
    cloud(ctx,px,py,size+1,seed+i,SOOT[0],alpha*(.75-drift*.34));
    cloud(ctx,px+(i%2?2:-2),py-3,size,seed+i+1,SOOT[2+i%2],alpha*(.41-drift*.16));
  }
  const hot=(part.flash||0)>0;
  const glow=(.81+Math.sin(phase*1.58)*.12)*(forming?.66+growth*.34:1);
  const wispSize=core?1.33*scale:1.02*(.7+scale*.3);
  if(core&&forming){
    for(let i=0;i<6;i++){
      const drift=(age*.74+rand(seed,i+82))%1;
      const spread=radius*(.22+drift*.48);
      cloud(ctx,x+(rand(seed,i+90)-.5)*spread*2,y-5-drift*(18+growth*17),5+drift*5,
        seed+i,SOOT[1+i%3],alpha*(1-drift)*.64);
    }
  }
  const palette=hot?['#753339','#de673f','#ffa85e','#ffe09c','#fff9dd']:
    forming&&core?['#37222c','#754039','#b65e4c','#e68d59','#ffd791']:EMBER;
  ctx.globalAlpha=alpha*glow;
  pixelShape(ctx,core?CORE:WISP,x,fy-1,wispSize,palette);
  sparks(ctx,x,fy,age,seed,radius+7,alpha,isBreaking);
  ctx.restore();
}
