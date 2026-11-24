import {wildHash} from './wild-lands-world.mjs';
import {easeWildWeather,wildWeatherAt} from './wild-weather.mjs';

const views=new WeakMap();
const clear={rain:0,snow:0};

function weatherViewer(g,renderer,camera){
 const owners=renderer.cameraOwnerIds;
 let nearest=null,best=Infinity;
 for(const p of g.players){
  if(p.hp<=0||p.spectator||p.disconnected||p.lobbyDisconnected||
   owners?.length&&!owners.includes(p.id))continue;
  const distance=(p.x-camera.x)**2+(p.y-camera.y)**2;
  if(distance<best){best=distance;nearest=p;}
 }
 return nearest;
}

function rain(c,camera,w,h,t,strength){
 const cell=36,left=camera.x*.67-w/2,top=camera.y*.67-h/2;
 const cx=Math.floor(left/cell),cy=Math.floor(top/cell);
 const columns=Math.ceil(w/cell)+2,rows=Math.ceil(h/cell)+2;
 const wind=.75+Math.sin(t*.38)*.18;
 c.fillStyle='#adc9d2';
 for(let j=-1;j<rows;j++)for(let i=-1;i<columns;i++){
  const col=cx+i,row=cy+j,seed=wildHash(col,row+939);
  if(seed>strength*.83)continue;
  const rand=wildHash(col+143,row),phase=(t*(1.07+rand*1.34)+rand*34)%1;
  const drift=(phase-.5)*44;
  const x=Math.round(col*cell-left+rand*cell+drift*wind),y=Math.round(row*cell-top+phase*65-22);
  if(x<-9||x>w+9||y<-15||y>h+10)continue;
  if(phase>.90){
   c.globalAlpha=(1-phase)*2.5*strength;
   const spread=2+Math.round((phase-.9)*49);
   c.fillRect(x-spread,y,2,1);c.fillRect(x+spread-2,y,2,1);
   continue;
  }
  const segment=2+Math.round(rand*2+strength);
  c.globalAlpha=(.23+rand*.35)*(.48+strength*.52);
  for(let k=0;k<3;k++)c.fillRect(x+k,y+k*segment,rand>.83?2:1,segment);
 }
}

function snow(c,camera,w,h,t,strength){
 const cell=49,left=camera.x*.53-w/2,top=camera.y*.53-h/2;
 const cx=Math.floor(left/cell),cy=Math.floor(top/cell);
 const columns=Math.ceil(w/cell)+2,rows=Math.ceil(h/cell)+2;
 c.fillStyle='#edf7f7';
 for(let j=-1;j<rows;j++)for(let i=-1;i<columns;i++){
  const col=cx+i,row=cy+j,seed=wildHash(col+510,row);
  if(seed>strength)continue;
  const rand=wildHash(col,row+677),phase=(t*(.19+rand*.23)+seed*47)%1;
  const drift=Math.sin(phase*6.28+rand*12)*8+phase*14;
  const x=Math.round(col*cell-left+rand*cell+drift),y=Math.round(row*cell-top+phase*68-20);
  const size=rand>.86?3:rand>.43?2:1;
  c.globalAlpha=Math.min(1,phase*8,(1-phase)*8)*(.36+rand*.46)*strength;
  c.fillRect(x,y,size,size);
  if(size===3){c.fillRect(x-1,y+1,5,1);c.fillRect(x+1,y-1,1,5);}
 }
}

export function drawWildWeather(c,g,renderer,camera,w,h,dt){
 const viewer=weatherViewer(g,renderer,camera);
 const prior=views.get(renderer);
 const target=wildWeatherAt(g,viewer);
 const value=easeWildWeather(prior?.game===g?prior:clear,target,dt);
 views.set(renderer,{game:g,...value});
 if(value.rain<.015&&value.snow<.015)return;
 c.save();
 if(value.rain>=.015){
  c.globalAlpha=value.rain*.14;
  c.fillStyle='#2e4d60';c.fillRect(0,0,w,h);
  rain(c,camera,w,h,g.time||0,value.rain);
 }
 if(value.snow>=.015)snow(c,camera,w,h,g.time||0,value.snow);
 c.restore();
}
