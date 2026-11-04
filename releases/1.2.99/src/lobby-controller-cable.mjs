// Cable is an independent world prop. Its port stays on the console front;
// the other end follows the actual controller grip, with gravity sag.
export function controllerCablePoints(port,grip){
  const sag=Math.min(30,8+Math.hypot(grip.x-port.x,grip.y-port.y)*.18);
  return Array.from({length:25},(_,i)=>{const t=i/24;return {x:Math.round(port.x+(grip.x-port.x)*t),y:Math.round(port.y+(grip.y-port.y)*t+4*t*(1-t)*sag)};});
}
export function drawControllerCable(c,port,grip){
  const points=controllerCablePoints(port,grip);
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
    for(let j=0;j<=steps;j++){const x=Math.round(a.x+(b.x-a.x)*j/steps),y=Math.round(a.y+(b.y-a.y)*j/steps);c.fillStyle='#222c2a';c.fillRect(x-1,y-1,3,3);c.fillStyle='#627169';c.fillRect(x,y,1,1);}
  }
}
