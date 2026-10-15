const controlled=p=>p?.succubusCharm?.remaining>0;
export function friendlyIceTarget(g,source,target){
 const owner=(g.players||[]).find(p=>p===source||p.id===source?.owner);
 return !!(target?.bansheeIce>0&&target.hp>0&&!target.room&&owner&&owner!==target&&owner.hp>0&&!owner.room&&!g.pvp&&!controlled(owner)&&!controlled(target)&&!source.hostile&&!source.charmShot);
}
export function breakFriendlyIce(g,source,target){
 if(!friendlyIceTarget(g,source,target))return false;
 target.bansheeIce=0;target.frozen=0;target.previousInput={};
 g.effects?.push({x:target.x,y:target.y-24,text:'Ice broken!',color:'#b4ecff',life:.7});g.onSound?.('ice',target);return true;
}
export function freezeBansheeTarget(g,p){
 if(p.hp<=0||p.room||p.invincible)return false;
 p.bansheeIce=3;p.frozen=Math.max(p.frozen||0,3);p.charge=0;p.bowAiming=false;p.blocking=false;p.moving=false;p.dashTime=0;p.slideX=p.slideY=0;p.previousInput={};delete p.queuedAttack;
 g.message?.(p.name+' is frozen! A friendly hit breaks the ice.');return true;
}
export function tickPlayerIce(p,dt){
 p.frozen=Math.max(0,(p.frozen||0)-dt);p.bansheeIce=Math.max(0,(p.bansheeIce||0)-dt);
 if(p.hp<=0||p.room){p.bansheeIce=0;p.frozen=0;}
}
export function drawFrostPrison(c,p,time){
 if(!(p.bansheeIce>0)||p.hp<=0)return;
 const x=p.x,y=p.y-(p.jumpHeight||0)-(p.groundHeight||0);
 c.save();c.fillStyle='#72cdea66';c.strokeStyle='#c4f5ff';c.lineWidth=1;
 c.beginPath();c.moveTo(x-13,y);c.lineTo(x-15,y-25);c.lineTo(x-7,y-37);c.lineTo(x+8,y-35);c.lineTo(x+15,y-20);c.lineTo(x+12,y+1);c.closePath();c.fill();c.stroke();
 c.beginPath();c.moveTo(x-7,y-33);c.lineTo(x+1,y-20);c.lineTo(x-6,y-8);c.moveTo(x+11,y-25);c.lineTo(x+1,y-20);c.stroke();
 c.fillStyle='#e5fcff';for(let i=0;i<5;i++)c.fillRect(x-15+(i*7)%29,y-8-(i*11+time*9)%27,2,2);
 c.font='9px sans-serif';c.textAlign='center';c.fillText('FROZEN '+Math.ceil(p.bansheeIce)+'s',x,y-42);c.restore();
}
