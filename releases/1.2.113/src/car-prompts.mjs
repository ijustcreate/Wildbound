import {houseVehicleEntry,houseVehicleForPlayer,vehicleDriver} from './house-vehicles.mjs';
import {actionInputLabel} from './action-prompts.mjs';

export function carInteractionPrompt(g,p){
 if(p.room||p.ui||p.hp<=0)return null;
 const current=houseVehicleForPlayer(g,p),entry=current?null:houseVehicleEntry(g,p);
 if(current&&vehicleDriver(g,current)===p)return null;
 if(!current&&!entry)return null;
 const key=actionInputLabel(g,p,'interact');
 const v=current||entry.vehicle,point=current?v:entry.point;
 return {text:key+' · '+(current?(Math.abs(v.speed||0)>18?'Stop to exit':'Exit car'):'Enter · '+entry.seat.label),x:point.x,y:v.y+(point.y-v.y)*.72-32};
}

export function drawCarPrompts(c,g,camera,w,h){
 c.save();c.font='12px monospace';c.textAlign='center';
 const used=new Set();
 for(const p of g.players||[]){
  const prompt=carInteractionPrompt(g,p);if(!prompt)continue;
  const key=prompt.x+':'+prompt.y+':'+prompt.text;if(used.has(key))continue;used.add(key);
  const width=Math.min(w-16,c.measureText(prompt.text).width+18);
  const x=Math.max(width/2+8,Math.min(w-width/2-8,(prompt.x-camera.x)*camera.zoom+w/2));
  const rawY=(prompt.y-camera.y)*camera.zoom+h/2;if(rawY<-30||rawY>h+30)continue;
  const y=Math.max(24,Math.min(h-24,rawY));
  c.fillStyle='#142b25ee';c.fillRect(x-width/2,y-16,width,25);
  c.strokeStyle='#b8a16c';c.lineWidth=1;c.strokeRect(x-width/2+.5,y-15.5,width-1,24);
  c.fillStyle='#f0dfad';c.fillText(prompt.text,x,y+1,width-10);
 }
 c.restore();
}
