// One small, reusable pixel sprite. Hearts don't allocate live particle actors.
const rows=['00110001100','01111011110','11111111111','11111111111','01111111110','00111111100','00011111000','00001110000','00000100000'];
let sprite;
export function drawFriendshipHeart(c,x,y,size=12){
 if(!sprite&&globalThis.document){
  sprite=document.createElement('canvas');sprite.width=13;sprite.height=11;
  const s=sprite.getContext('2d');s.fillStyle='#703756';
  for(let row=0;row<rows.length;row++)for(let col=0;col<11;col++)if(rows[row][col]==='1')s.fillRect(col,row,3,3);
  s.fillStyle='#ff80b5';
  for(let row=0;row<rows.length;row++)for(let col=0;col<11;col++)if(rows[row][col]==='1')s.fillRect(col+1,row+1,1,1);
  s.fillStyle='#ffc4db';s.fillRect(3,2,2,1);s.fillRect(2,3,1,1);
 }
 c.save();c.imageSmoothingEnabled=false;
 if(sprite&&c.drawImage)c.drawImage(sprite,Math.round(x-size/2),Math.round(y-size*11/26),size,size*11/13);
 else {c.fillStyle='#ff80b5';const scale=size/13;for(let r=0;r<rows.length;r++)for(let col=0;col<11;col++)if(rows[r][col]==='1')c.fillRect(x+(col-5)*scale,y+(r-4)*scale,scale,scale);}
 c.restore();
}
export function drawFriendshipHearts(c,actor,time){
 if(actor.hp<=0||actor.faction!=='ally'||actor.allyOwner==null)return;
 const top=actor.y-(actor.kind==='panther'?62:actor.kind==='lion'||actor.kind==='tiger'?58:43)-(actor.groundHeight||0)-(actor.jumpHeight||0)-(actor.roostHeight||0);
 const phase=time*2.4+(actor.id||0)*.7;
 c.save();c.globalAlpha*=.9;
 drawFriendshipHeart(c,actor.x-7,top+Math.sin(phase)*2,10);
 drawFriendshipHeart(c,actor.x+7,top-6+Math.sin(phase+1.8)*2,8);
 c.restore();
}
