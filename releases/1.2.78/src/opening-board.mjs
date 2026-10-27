export function faceOpeningBoard(p){
  const dx=800-p.x,dy=800-p.y,length=Math.hypot(dx,dy)||1;
  p.faceX=dx/length;p.faceY=dy/length;p.moving=false;p.walking=false;
}
export function seatOpeningParty(players){
  const seats=[[780,837],[820,837],[750,804],[850,804],[777,769],[823,769]];
  players.forEach((p,i)=>{[p.x,p.y]=seats[i%seats.length];p.jumpHeight=0;p.groundHeight=0;p.dashTime=0;p.slideX=p.slideY=0;p.room=null;faceOpeningBoard(p);});
}
export function openingCamera(w,h){
  // Frame the board and seated party as one close intro shot, trimming away
  // the empty floor while keeping the table top readable on short displays.
  return {x:800,y:790,zoom:Math.min((w-24)/90,Math.max(100,h-60)/86)};
}
