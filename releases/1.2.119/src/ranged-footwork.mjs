// A short readable reposition, followed by a planted approach window. Timers
// use simulation time, survive saves, and never alter the tell/contact clocks.
export function rangedFootwork(g,e,p){
 const now=g.time||0,m=e.rangedFootwork??={evadeUntil:0,plantUntil:0};
 const close=Math.hypot(p.x-e.x,p.y-e.y)<180;
 if(close&&now>=m.plantUntil){m.evadeUntil=now+.35;m.plantUntil=now+2.35;}
 return {evade:close&&now<m.evadeUntil,plant:close&&now>=m.evadeUntil&&now<m.plantUntil};
}
