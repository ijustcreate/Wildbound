export const GRINGOTTS_VAULT_OFFSET = Object.freeze({x:47,y:-65});

const OPEN_SECONDS=.85;
const ARRIVAL_CLEARANCE=28;

function atVault(p,vault){
 const dy=p.y-vault.y;
 return p.hp>0&&!p.ui&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&
  !p.broomMount&&!p.wingHover&&!p.controlledFollowerId&&!(p.jumpHeight>0)&&
  !(p.stun>0)&&!(p.frozen>0)&&!(p.sleeping>0)&&Math.abs(p.x-vault.x)<=23&&dy>=7&&dy<=39;
}

function occupied(g){
 return g.portals?.some(d=>d.bankVault&&g.players.some(p=>p.room===d.id));
}

export function gringottsVaultProgress(g){
 return g.trainTest?.gringottsVault?.progress??(occupied(g)?1:0);
}

export function gringottsVaultPrompt(g,p,vault){
 if(!atVault(p,vault))return '';
 const progress=gringottsVaultProgress(g);
 return progress>=1?'ENTER PERSONAL STORAGE':g.trainTest.gringottsVault?.opening?'VAULT OPENING':'OPEN VAULT DOOR';
}

function enterVaultStorage(g,p,vault){
 const door={id:g.nextId++,owner:p.id,color:p.color,x:p.x,y:Math.max(p.y,vault.y+ARRIVAL_CLEARANCE),
  railwayScene:'diagon',bankVault:true,autoEnter:false,closing:null};
 // Install the route first so the native room entry saves the occupant and its
 // personal return point together. This entrance never appears as a summon.
 g.portals.push(door);
 if(g.enterRoom(p,door))return true;
 g.portals.pop();
 return false;
}

export function interactGringottsVault(g,p,vault){
 if(!atVault(p,vault))return false;
 const t=g.trainTest,progress=gringottsVaultProgress(g);
 if(progress>=1)return enterVaultStorage(g,p,vault);
 if(!t.gringottsVault?.opening)g.onSound?.('doorOpen',p);
 t.gringottsVault={progress,opening:true,holdUntil:t.time+1.35};
 return true;
}

export function tickGringottsVault(g,vault,dt){
 const t=g.trainTest,hasOccupants=occupied(g);
 if(!t.gringottsVault&&!hasOccupants)return;
 const door=t.gringottsVault??={progress:1,opening:true,holdUntil:t.time};
 const nearby=g.players.filter(p=>atVault(p,vault));
 const hold=hasOccupants||t.time<door.holdUntil||door.opening&&nearby.length>0;
 door.opening=hold;
 door.progress=Math.max(0,Math.min(1,door.progress+(hold?dt:-dt)/OPEN_SECONDS));
 if(door.progress===0&&!hold)delete t.gringottsVault;
 if(door.progress<1)return;
 for(const p of nearby){
  // A player may reach the closed threshold while the bolts are still moving.
  const entering=(t.previous?.get(p.id)?.y||0)<-.25;
  if(entering&&Math.abs(p.x-vault.x)<=15&&p.y<=vault.y+17)enterVaultStorage(g,p,vault);
 }
}
