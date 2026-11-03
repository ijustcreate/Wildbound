const heldChicken=(g,p)=>g.enemies.find(e=>e.id===p.heldChickenId&&e.kind==='chicken'&&e.hp>0);
const facing=p=>{const x=p.faceX||0,y=p.faceY||0,length=Math.hypot(x,y)||1;return {x:x/length,y:y/length};};

function placeChicken(g,p,chicken,{thrown=false}={}){
 const f=facing(p);chicken.x=p.x+f.x*24;chicken.y=p.y+f.y*20;
 if(g.blocked?.(chicken.x,chicken.y,8,false,false,false,0)){chicken.x=p.x;chicken.y=p.y+18;}
 delete chicken.carriedBy;chicken.moving=false;chicken.faceX=f.x;chicken.faceY=f.y;
 chicken.fleeFromX=p.x;chicken.fleeFromY=p.y;chicken.fleeTime=thrown?3.4:0;
 chicken.calmPlacement=!thrown;chicken.wildLastHp=chicken.hp;chicken.homeX=chicken.x;chicken.homeY=chicken.y;chicken.wanderIn=2;
 if(thrown){
  chicken.state='flee';chicken.jumpHeight=1;chicken.jumpVelocity=118;chicken.jumpGravity=520;chicken.jumpAge=0;chicken.jumpHeld=false;chicken.jumpCut=false;
 }else{
  chicken.state='graze';chicken.jumpHeight=0;chicken.jumpVelocity=0;chicken.groundHeight=0;
 }
 delete p.heldChickenId;p.carryingChicken=false;
 return true;
}

export function interactChicken(g,p){
 if(p.heldChickenId){const chicken=heldChicken(g,p);if(chicken)return placeChicken(g,p,chicken);delete p.heldChickenId;p.carryingChicken=false;}
 if(p.room||p.ui||p.hp<=0||p.vehicleId)return false;
 let nearest=null,nearestDistance=42;
 for(const chicken of g.enemies){
  if(chicken.kind!=='chicken'||chicken.hp<=0||chicken.carriedBy||chicken.room)continue;
  const distance=Math.hypot(chicken.x-p.x,chicken.y-p.y);
  if(distance<nearestDistance){nearest=chicken;nearestDistance=distance;}
 }
 if(!nearest)return false;
 nearest.carriedBy=p.id;nearest.state='carried';nearest.moving=false;nearest.fleeTime=0;nearest.calmPlacement=false;
 p.heldChickenId=nearest.id;p.carryingChicken=true;
 return true;
}

export function throwHeldChicken(g,p){
 const chicken=heldChicken(g,p);
 if(!chicken){delete p.heldChickenId;p.carryingChicken=false;return false;}
 return placeChicken(g,p,chicken,{thrown:true});
}

