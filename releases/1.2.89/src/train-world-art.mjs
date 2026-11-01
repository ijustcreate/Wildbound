import {drawTrainCar} from './train-art.mjs';
import {trainCars,trainWorld,sampleTrainRoute,railwayWater,railElevation,nearestTrainTrack} from './train-track.mjs';
import {trainPrompt} from './train-test.mjs';
import {drawProp} from './environment.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
export function drawRailwayTrack(ctx,d,route,bounds={left:0,top:0,right:d.width,bottom:d.height},overview=false){
 const visible=q=>q.x>bounds.left-100&&q.x<bounds.right+100&&q.y>bounds.top-100&&q.y<bounds.bottom+150;
 const point=(q,side,z=0)=>({x:q.x-Math.sin(q.a)*side,y:q.y+Math.cos(q.a)*side-z});
 if(overview){ctx.strokeStyle='#ad9b70';ctx.lineWidth=8;ctx.beginPath();route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();return;}
 // Ballast follows the same sampled route as train bogies and physics.
 for(let s=0;s<route.length;s+=16){const q=sampleTrainRoute(route,s);if(!visible(q))continue;const z=railElevation(d,q),bridge=railwayWater(d,q.x)||z>2;
  if(bridge){const a=point(q,-d.gauge/2-17,z-2),b=point(q,d.gauge/2+17,z-2),front={x:Math.cos(q.a)*10,y:Math.sin(q.a)*10};polygon(ctx,[{x:a.x-front.x,y:a.y-front.y},{x:b.x-front.x,y:b.y-front.y},{x:b.x+front.x,y:b.y+front.y},{x:a.x+front.x,y:a.y+front.y}],'#4b413b');ctx.strokeStyle='#b49062';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(Math.round(s/16)%6===0){for(const side of[-1,1]){const p=point(q,side*(d.gauge/2+10),z);ctx.fillStyle='#514d48';ctx.fillRect(p.x-5,p.y,10,z+17);ctx.fillStyle='#8b7b61';ctx.fillRect(p.x-3,p.y,3,z+15);}}}
  else{const a=point(q,-d.gauge/2-13),b=point(q,d.gauge/2+13),dx=Math.cos(q.a)*10,dy=Math.sin(q.a)*10;polygon(ctx,[{x:a.x-dx,y:a.y-dy},{x:b.x-dx,y:b.y-dy},{x:b.x+dx,y:b.y+dy},{x:a.x+dx,y:a.y+dy}],'#737363');}
  const a=point(q,-d.gauge/2-7,z),b=point(q,d.gauge/2+7,z);ctx.strokeStyle='#513c31';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#a08559';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y-2);ctx.lineTo(b.x,b.y-2);ctx.stroke();
 }
 for(const side of[-1,1]){ctx.strokeStyle='#303b3d';ctx.lineWidth=5;ctx.beginPath();let active=false;for(let s=0;s<=route.length;s+=8){const q=sampleTrainRoute(route,s),p=point(q,side*d.gauge/2,railElevation(d,q));if(visible(q)){active?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);active=true;}else active=false;}ctx.stroke();ctx.strokeStyle='#b6b9a0';ctx.lineWidth=2;ctx.stroke();}
}
function trees(t){if(t.design.scenery)return t.design.scenery;if(t.trees)return t.trees;const d=t.design,list=[];for(let y=120;y<d.height-100;y+=190)for(let x=110;x<d.width-100;x+=180){const seed=Math.abs(Math.sin(x*7.32+y*2.17)),px=x+seed*100,py=y+Math.abs(Math.cos(x*3+y*7))*75;if(Math.abs(px-d.river.x)<d.river.width/2+65||nearestTrainTrack(t.route,px,py).distance<125)continue;list.push({id:'rail-tree-'+list.length,kind:'tree',x:px,y:py,size:86+seed*38,seed:Math.floor(px+py)});}t.trees=list;return list;}
function wrap(ctx,text,x,y,max){const words=text.split(' ');let line='';for(const word of words){if(ctx.measureText(line+word).width>max&&line){ctx.fillText(line,x,y);line='';y+=14;}line+=word+' ';}ctx.fillText(line,x,y);return y;}
export function drawTrainTest(renderer,g,dt){
 const t=g.trainTest,d=t.design,{w,h}=renderer.resize(),ctx=renderer.ctx,party=g.players,cs=trainCars(t),xs=party.length?party.map(p=>p.x):[cs[0].x],ys=party.length?party.map(p=>p.y):[cs[0].y],focus={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
 const zoom=clamp(Math.min(w/(Math.max(...xs)-Math.min(...xs)+260),h/(Math.max(...ys)-Math.min(...ys)+250),1.35),.012,1.35),camera=renderer.camera;if(renderer.trainScene!==t){camera.x=focus.x;camera.y=focus.y;camera.zoom=zoom;renderer.trainScene=t;}const k=1-Math.exp(-Math.max(.02,dt)*5);camera.x+=(focus.x-camera.x)*k;camera.y+=(focus.y-camera.y)*k;camera.zoom+=(zoom-camera.zoom)*k;
 const bounds={left:camera.x-w/2/camera.zoom,top:camera.y-h/2/camera.zoom,right:camera.x+w/2/camera.zoom,bottom:camera.y+h/2/camera.zoom},visible=(q,r=150)=>q.x>bounds.left-r&&q.x<bounds.right+r&&q.y>bounds.top-r&&q.y<bounds.bottom+r;
 ctx.fillStyle='#31553b';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 ctx.fillStyle='#52754a';ctx.fillRect(0,0,d.width,d.height);
 for(let x=Math.floor(bounds.left/48)*48;x<bounds.right+48;x+=48)for(let y=Math.floor(bounds.top/48)*48;y<bounds.bottom+48;y+=48){const seed=Math.abs(Math.sin(x*.15+y*.32));ctx.fillStyle=seed>.5?'#66874c':'#426742';ctx.fillRect(x+seed*20,y+seed*29,2,5);ctx.fillRect(x+seed*20+3,y+seed*29+2,2,2);if(seed>.95){ctx.fillStyle='#c4b26a';ctx.fillRect(x+12,y+18,3,3);}}
 ctx.fillStyle='#8c986b';ctx.fillRect(d.river.x-d.river.width/2-10,0,d.river.width+20,d.height);ctx.fillStyle='#367f91';ctx.fillRect(d.river.x-d.river.width/2,0,d.river.width,d.height);
 for(let y=Math.floor(bounds.top/21)*21;y<bounds.bottom+21;y+=21){ctx.fillStyle=y%2?'#599a9f':'#418b99';const drift=Math.sin(t.time+y*.15)*8;ctx.fillRect(d.river.x-d.river.width/2+15+drift,y,d.river.width*.28,2);ctx.fillRect(d.river.x+drift,y+7,d.river.width*.29,2);}
 drawRailwayTrack(ctx,d,t.route,bounds);
 // Display other saved branches as real rails; only the selected itinerary drives the train.
 for(const route of t.otherRoutes||[])drawRailwayTrack(ctx,d,route,bounds);
 const objects=[...trees(t).filter(q=>visible(q)).map(tree=>({depth:tree.y,tree})),...cs.filter(q=>visible(q,450)).map(car=>({depth:car.y+Math.abs(Math.cos(car.a))*car.width/2,car})),...party.filter(p=>!p.trainRide).map(player=>({depth:player.y,player}))].sort((a,b)=>a.depth-b.depth);
 for(const o of objects){if(o.tree){drawProp(ctx,o.tree,t.time,{...g,generatedEnvironment:'forest',environment:'forest'},{dynamicShadows:false});continue;}if(o.player){renderer.animator.draw(ctx,{...o.player,y:o.player.y-(o.player.trainGround||0)},g.time,PLAYER_RENDER_SIZE);continue;}const car=o.car;ctx.fillStyle='#172b2b44';ctx.beginPath();ctx.ellipse(car.x+5,car.y+7,Math.abs(Math.cos(car.a))*car.length/2+Math.abs(Math.sin(car.a))*car.width/2,Math.abs(Math.sin(car.a))*car.length/2+Math.abs(Math.cos(car.a))*car.width/2,0,0,Math.PI*2);ctx.fill();
  drawTrainCar(ctx,d,car,{time:t.time,distance:t.distance,engine:t.engine,doors:t.doors,roofAlpha:t.roof[car.id]??1},()=>{for(const p of party.filter(p=>p.trainRide?.car===car.index)){const r=p.trainRide,q=trainWorld({...car,x:0,y:0,z:0},r.x,r.y),actor={...p,x:q.x,y:q.y-20,animationAction:r.seat?'train_sit':undefined};renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE);}});
 }
 for(const p of t.particles){const f=p.life/p.max;ctx.globalAlpha=(p.kind==='smoke'?.6:.9)*Math.min(1,f*2);ctx.fillStyle={smoke:'#737e80',steam:'#d1d7ca',spark:'#ffe79d',ember:'#f5aa4f'}[p.kind];const s=p.size;ctx.fillRect(Math.round(p.x/2)*2,Math.round(p.y/2)*2,s,s);if(p.kind==='smoke'){ctx.fillStyle='#929997';ctx.fillRect(p.x+2,p.y-2,s*.6,s*.5);}}ctx.globalAlpha=1;
 // Context labels stay near each explorer and use the game's interaction vocabulary.
 for(const p of party){const text=trainPrompt(g,p);if(!text)continue;ctx.save();ctx.font='9px monospace';const width=Math.min(240,ctx.measureText(text).width+12),x=p.x-width/2,y=p.y-(p.trainRide?78:57);ctx.fillStyle='#182e2eea';ctx.fillRect(x,y,width,25);ctx.fillStyle='#ead6a1';wrap(ctx,text,x+5,y+10,width-10);ctx.restore();}
 ctx.restore();
 const boxW=Math.min(w-16,380);ctx.fillStyle='#172b2ce8';ctx.fillRect(8,8,boxW,46);ctx.fillStyle='#f0dca5';ctx.font='11px monospace';ctx.fillText(`DEV RAILWAY · ${t.engine?'STEAM ON':'PARKED'} · ${Math.round(t.speed)} px/s`,15,23);ctx.font='9px monospace';ctx.fillText(`Throttle ${Math.round(t.throttle*100)}%  |  ${d.routes.find(r=>r.id===d.activeRoute)?.name||'Main line'}`,15,38);if(t.noticeUntil>t.time){ctx.fillStyle='#172b2ce8';ctx.fillRect(8,h-52,w-16,44);ctx.fillStyle='#ecd8a4';wrap(ctx,t.notice,15,h-38,w-32);}
 // A compact map makes the large dev world navigable without adding a normal destination.
 const mw=Math.min(100,w*.2),mh=mw*d.height/d.width,mx=w-mw-10,my=63;ctx.fillStyle='#1a302be8';ctx.fillRect(mx-3,my-3,mw+6,mh+6);ctx.save();ctx.translate(mx,my);ctx.scale(mw/d.width,mh/d.height);ctx.fillStyle='#52754a';ctx.fillRect(0,0,d.width,d.height);ctx.fillStyle='#55a0a9';ctx.fillRect(d.river.x-d.river.width/2,0,d.river.width,d.height);ctx.strokeStyle='#dac388';ctx.lineWidth=35;ctx.beginPath();t.route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();for(const c of cs){ctx.fillStyle='#e8ba76';ctx.fillRect(c.x-55,c.y-55,110,110);}for(const p of party){ctx.fillStyle='#ffffff';ctx.fillRect(p.x-45,p.y-45,90,90);}ctx.restore();
}
