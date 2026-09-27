export function startJump(a){
 if(a.hp<=0||a.jumpHeight>0||a.jumpCooldown>0||a.state==='snared'||a.rooted>0||a.stun>0)return false;
 a.jumpHeight=.01;a.jumpVelocity=125;a.jumpAge=0;a.jumpCooldown=1.2;a.landTime=0;return true;
}
export function tickJump(a,dt){
 a.jumpCooldown=Math.max(0,(a.jumpCooldown||0)-dt);a.landTime=Math.max(0,(a.landTime||0)-dt);
 if(a.hp<=0){a.jumpHeight=0;a.jumpVelocity=0;return;}
 if(!(a.jumpHeight>0))return;
 a.jumpAge=(a.jumpAge||0)+dt;a.jumpVelocity-=360*dt;a.jumpHeight=Math.max(0,a.jumpHeight+a.jumpVelocity*dt);
 if(!a.jumpHeight){a.jumpVelocity=0;a.landTime=.22;}
}
