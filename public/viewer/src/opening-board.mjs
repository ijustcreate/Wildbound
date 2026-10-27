export function faceOpeningBoard(p){
  const dx=800-p.x,dy=800-p.y,length=Math.hypot(dx,dy)||1;
  p.faceX=dx/length;p.faceY=dy/length;p.moving=false;p.walking=false;
}
export function seatOpeningParty(players){
  const seats=[[780,837],[820,837],[750,804],[850,804],[777,769],[823,769]];
  players.forEach((p,i)=>{[p.x,p.y]=seats[i%seats.length];p.jumpHeight=0;p.groundHeight=0;p.dashTime=0;p.slideX=p.slideY=0;p.room=null;faceOpeningBoard(p);});
}
export function openingCamera(w,h){
  // Tight stage includes the party's heads and the table's feet, with no world reveal.
  return {x:800,y:783,zoom:Math.min((w-24)/146,Math.max(100,h-60)/132)};
}
