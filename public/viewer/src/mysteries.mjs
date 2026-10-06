import {ITEMS} from './items.mjs';
import {drawItem} from './item-art.mjs';
export const MYSTERY_EVENTS=[
 {name:'The Knight in the Empty Gallery',type:'mystery',kind:'skeleton',weight:6,count:1,verse:'An empty suit walks without a sound.\nFind the knight; bring its secret round.',tip:'Find the false knight in the northwest, then inspect its mask beside the board.',mystery:{goal:'defeat',enemy:'skeleton',item:'charm',targetName:'False knight',location:'northwest',x:350,y:350,count:1,hp:180,speed:40,damage:14,stageOne:'Defeat the false knight in the northwest gallery.',stageTwo:'Inspect the discarded knight mask beside the game board.',finalName:'Discarded knight mask',reward:'gallery_medallion',qty:1}},
 {name:'The Phantom of the Old Organ',type:'mystery',kind:'skeleton',weight:6,count:1,verse:'The organ sings, but no one plays.\nFind the score that ends the maze.',tip:'Recover the stolen score in the northeast, then examine the organ beside the board.',mystery:{goal:'recover',enemy:'skeleton',item:'mystery_score',targetName:'Stolen organ score',location:'northeast',x:1250,y:350,count:1,hp:120,speed:35,damage:12,stageOne:'Recover the stolen organ score in the northeast.',stageTwo:'Examine the phantom organ beside the game board.',finalName:'Phantom organ',reward:'phantom_charm',qty:1}},
 {name:'The Miner Beneath the Lantern',type:'mystery',kind:'golem',weight:6,count:1,verse:'A miner guards what never was his.\nFind the fraud; discover the twist.',tip:'Defeat the disguised miner in the southwest, then open its strongbox beside the board.',mystery:{goal:'defeat',enemy:'golem',item:'stone',targetName:'Disguised miner',location:'southwest',x:350,y:1250,count:1,hp:240,speed:30,damage:18,stageOne:'Defeat the disguised miner in the southwest quarry.',stageTwo:'Open the miner’s strongbox beside the game board.',finalName:'Miner’s strongbox',reward:'miners_keepsake',qty:1}},
];
export function mysterySpot(g,x,y){
 for(let i=0;i<400;i++){const radius=i?24*Math.sqrt(i):0,a=i*2.39996,point={x:Math.max(64,Math.min(1536,x+Math.cos(a)*radius)),y:Math.max(64,Math.min(1536,y+Math.sin(a)*radius))};if(!g.blocked(point.x,point.y,10,false,false))return point;}
 return null;
}
export function startMystery(g,event){
 if(g.mystery&&!g.mystery.done){g.message('Finish the active mystery before starting another.');return false;}
 const config=structuredClone(event.mystery);if(!config||!ITEMS[config.reward]||(config.goal==='recover'&&!ITEMS[config.item]))return false;
 const point=mysterySpot(g,Number(config.x)||350,Number(config.y)||350);if(!point){g.message('No safe mystery location on this map.');return false;}
 const m=g.mystery={name:event.name,config,stage:1,done:false,point,enemyIds:[],object:null};
 if(config.goal==='defeat')for(let i=0;i<Math.max(1,Math.min(20,Number(config.count)||1));i++){
  const spot=mysterySpot(g,point.x+i*26,point.y);
  const e={kind:config.enemy,id:g.nextId++,group:g.nextId,x:spot.x,y:spot.y,hp:Number(config.hp)||120,maxHp:Number(config.hp)||120,speed:Number(config.speed)||35,damage:Number(config.damage)||12,state:'hunt',timer:1,cooldown:1,flash:0,dx:0,dy:0,attackX:0,attackY:0,step:0,faceX:0,faceY:1,temperament:'patient',orbit:1,tacticTime:2,skin:config.enemy,mysteryTarget:true};
  g.configureCreature(e,false);Object.assign(e,{name:config.targetName,hp:Number(config.hp)||120,maxHp:Number(config.hp)||120,speed:Number(config.speed)||35,damage:Number(config.damage)||12});g.enemies.push(e);m.enemyIds.push(e.id);
 }else m.object={...point,name:config.targetName,item:config.item};
 g.message(event.name+' — '+config.stageOne);g.persist();return true;
}
export function advanceMystery(g){
 const m=g.mystery;if(!m||m.done||m.stage!==1)return;
 const point=mysterySpot(g,800+Math.max(-180,Math.min(180,Number(m.config.finalOffsetX)||0)),800+Math.max(-180,Math.min(180,Number(m.config.finalOffsetY??120))));if(!point)return;
 m.stage=2;m.object={...point,name:m.config.finalName,item:ITEMS[m.config.finalItem]?m.config.finalItem:null};g.message(m.name+' — '+m.config.stageTwo);g.persist();
}
export function tickMystery(g){
 const m=g.mystery;if(!m||m.done||m.stage!==1||m.config.goal!=='defeat')return;
 if(m.enemyIds.length&&m.enemyIds.every(id=>!g.enemies.some(e=>e.id===id&&e.hp>0)))advanceMystery(g);
}
export function interactMystery(g,p){
 const m=g.mystery,o=m?.object;if(!o||m.done||p.room||p.hp<=0||Math.hypot(p.x-o.x,p.y-o.y)>62)return false;
 if(m.stage===1){advanceMystery(g);return true;}
 m.done=true;m.object=null;g.dropLoot(o.x,o.y,m.config.reward,Math.max(1,Math.min(99,Number(m.config.qty)||1)),m.name+' reward',true);g.message('Mystery solved! '+ITEMS[m.config.reward].name+' awaits beside the board.');g.onSound('win');g.persist();return true;
}
export function drawMysteryWorld(c,g){
 const o=g.mystery?.object;if(!o||g.mystery.done)return;c.save();c.fillStyle='#372b22';c.fillRect(o.x-14,o.y-15,28,20);c.strokeStyle='#d8be77';c.strokeRect(o.x-14,o.y-15,28,20);c.font='bold 15px monospace';c.textAlign='center';c.fillStyle='#f4dfa2';if(o.item)drawItem(c,o.item,o.x,o.y-5,24);else c.fillText('?',o.x,o.y);c.font='9px sans-serif';c.fillText(o.name,o.x,o.y-23);if(g.players.some(p=>!p.room&&Math.hypot(p.x-o.x,p.y-o.y)<62))c.fillText('Interact · investigate',o.x,o.y+20);c.restore();
}
export function drawMysteryTracker(c,g,w){
 const m=g.mystery;if(!m||m.done)return;const width=Math.min(390,w-24),x=(w-width)/2;c.save();c.fillStyle='#101e1cee';c.fillRect(x,8,width,65);c.strokeStyle='#b7a16c';c.strokeRect(x,8,width,65);c.font='bold 10px sans-serif';c.fillStyle='#efd38c';c.textAlign='left';c.fillText('MYSTERY · '+m.name,x+9,23,width-18);c.font='9px sans-serif';c.fillStyle='#e1e9da';c.fillText((m.stage===1?'1 / 2 · ':'2 / 2 · ')+(m.stage===1?m.config.stageOne:m.config.stageTwo),x+9,39,width-18);const point=m.object||m.point;c.fillText('Search '+(m.stage===1?m.config.location:'beside the board')+' · '+Math.round(point.x)+', '+Math.round(point.y),x+9,55,width-18);c.restore();
}
