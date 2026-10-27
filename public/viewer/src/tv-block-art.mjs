let blockSprites;
const QUESTION=['01110','11011','00011','00110','01100','00000','01100'];
function sprite(used){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d');
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  rect(1,1,30,30,'#352b30');rect(2,2,28,28,used?'#6c5741':'#9c5a2b');
  rect(3,3,26,25,used?'#977951':'#e6ab44');rect(4,4,24,3,used?'#b5996c':'#ffe5a0');
  rect(4,7,2,19,used?'#b5996c':'#f4cb69');rect(27,6,2,22,used?'#524738':'#b37030');
  rect(5,27,23,2,used?'#524738':'#9b582c');rect(7,8,18,17,used?'#806749':'#cf8e37');
  for(const [x,y] of [[4,4],[25,4],[4,25],[25,25]]){rect(x,y,3,3,'#493c2e');rect(x,y,2,1,used?'#c6a67b':'#fff0ba');}
  if(!used){
    for(let y=0;y<QUESTION.length;y++)for(let x=0;x<5;x++)if(QUESTION[y][x]==='1'){
      rect(12+x*2,10+y*2,2,2,'#754323');rect(11+x*2,9+y*2,2,2,'#fff3c7');
    }
  }else{rect(11,15,10,2,'#594736');rect(14,17,4,2,'#ac8e62');rect(7,9,3,1,'#68543e');rect(9,10,1,4,'#68543e');rect(23,20,1,4,'#68543e');}
  return canvas;
}
export function drawQuestionBlock(c,block,time){
  blockSprites||=[sprite(false),sprite(true)];
  const y=block.y-Math.sin(block.bump/.25*Math.PI)*7;
  c.drawImage(blockSprites[block.used?1:0],Math.round(block.x-16),Math.round(y),32,32);
  if(!block.used){const blink=Math.floor(time*3+block.x)%7;if(blink===0){c.fillStyle='#fff5c9';c.fillRect(block.x-11,y+5,2,2);c.fillRect(block.x-12,y+6,4,1);}}
}
export function blockBreakParticles(x,y,random){
  return Array.from({length:12},(_,i)=>({x:x+(i%4-1.5)*5,y:y+8+(i%3)*3,vx:(random()-.5)*150,vy:-70-random()*160,age:0,life:.35+random()*.3,size:i<8?3:2,color:['#ffe0a0','#d49b47','#8b5831','#fff2c9'][i%4]}));
}
export function tickBlockParticles(particles,dt){
  let live=0;
  for(const p of particles){p.age+=dt;if(p.age>=p.life)continue;p.vy+=650*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;particles[live++]=p;}
  particles.length=live;
}
export function drawBlockParticles(c,particles,left,right){
  for(const p of particles){if(p.x<left-10||p.x>right+10)continue;c.globalAlpha=Math.min(1,(p.life-p.age)*5);c.fillStyle=p.color;c.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}
  c.globalAlpha=1;
}
