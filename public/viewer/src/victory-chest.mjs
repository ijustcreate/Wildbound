import {raisedSurfaceBlocked,VICTORY_CHEST} from './terrain-support.mjs';
export {VICTORY_CHEST} from './terrain-support.mjs';
import {ITEMS,rollGear} from './items.mjs';
export function victoryRewards(players,random=Math.random){
 const party=players.slice(0,6),level=party.reduce((sum,p)=>sum+Math.max(1,p.level||1),0)/Math.max(1,party.length),count=3+party.length*2;
 const tiers=level>=10?['rare','rare','legendary']:level>=5?['common','unique','rare']:['rare'];
 while(tiers.length<count)tiers.push(level>=10?'rare':'common');
 return tiers.map(tier=>({type:rollGear(random,tier)||Object.keys(ITEMS).find(id=>ITEMS[id].slot&&ITEMS[id].rarity==='common'),qty:1}));
}

export function victoryChestBlocked(g,x,y,radius,elevation,from){return !!g.victoryChest&&elevation<20&&raisedSurfaceBlocked(VICTORY_CHEST,x,y,radius,from,0);}
export function drawVictoryChest(c,g){
 if(!g.victoryChest)return;
 const open=g.players.some(p=>['victory','tv-victory'].includes(p.ui?.storage)),s=g.victoryChestArt||={lid:0,last:g.time};
 s.lid+=(Number(open)-s.lid)*Math.min(1,Math.max(0,(g.time-s.last))*10);s.last=g.time;
 const loot=(g.victoryRewards||[]).some(Boolean),x=800,y=919,t=g.time||0;
 c.save();c.translate(x,y);c.fillStyle='#10251b80';c.beginPath();c.ellipse(0,10,30,9,0,0,7);c.fill();
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 r(-24,-14,48,25,'#392c24');r(-22,-12,44,20,'#805638');
 for(let i=0;i<4;i++){r(-20,-10+i*5,40,1,'#b4834c');r(-20,-9+i*5,40,1,'#4f3828');}
 r(-20,-14,5,25,'#c2a35c');r(15,-14,5,25,'#c2a35c');r(-18,-13,1,23,'#ecda98');r(17,-13,1,23,'#ecda98');
 r(-22,-16,44,5,'#191c18');
 if(loot&&s.lid>.05){c.globalAlpha=s.lid;const light=c.createRadialGradient(0,-13,1,0,-13,44);light.addColorStop(0,'#a9ffce99');light.addColorStop(1,'#61d3a000');c.fillStyle=light;c.fillRect(-44,-57,88,88);r(-18,-17,36,4,'#bcf7c5');c.globalAlpha=1;}
 const ly=-22-s.lid*20,lh=11-s.lid*5;r(-25,ly,50,lh,'#64432d');r(-24,ly,48,3,'#d5b469');r(-20,ly,5,lh,'#bf9850');r(15,ly,5,lh,'#bf9850');r(-4,ly+lh-2,8,7,'#d7b46a');r(-1,ly+lh,2,3,'#534329');
 if(!g.victoryChestOpened){for(let i=0;i<7;i++){const a=t*.7+i*2.4,px=Math.sin(a)*30,py=-18-Math.cos(a*.7)*15,v=(Math.sin(t*4+i)+1)/2;c.globalAlpha=v;r(px-2,py,5,1,'#fff1b5');r(px,py-2,1,5,'#fff1b5');}c.globalAlpha=1;}
 c.font='9px sans-serif';c.textAlign='center';c.fillStyle='#ffedba';c.fillText(loot?'Victory spoils · '+(g.controlLabels?.interact||'E / Y'):'Chest emptied',0,28);c.restore();
}
