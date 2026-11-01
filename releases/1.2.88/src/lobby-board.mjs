import {drawBoard} from './board.mjs';
// Same proportions as the expedition table, enlarged for the lobby camera.
export const LOBBY_BOARD={id:'board',kind:'table',x:710,y:345,w:120,h:60,surfaceHeight:18,jumpable:true};
export function drawLobbyBoard(c,time=0){
 const b=LOBBY_BOARD;c.save();c.imageSmoothingEnabled=false;
 c.translate(b.x+b.w/2,b.y+b.h/2);c.scale(b.w/64,b.h/32);
 c.fillStyle='#17251d55';c.beginPath();c.ellipse(0,9,36,15,0,0,Math.PI*2);c.fill();
 c.fillStyle='#443020';for(const x of [-29,24])c.fillRect(x,-8,5,23);
 const rise=b.surfaceHeight/(b.h/32);
 c.fillStyle='#5a3d28';c.fillRect(-32,-16-rise+5,64,32);
 c.fillStyle='#987047';c.fillRect(-32,-16-rise,64,32);
 c.translate(0,-rise);c.scale(60/280,28/192);
 drawBoard(c,{players:[],current:null,roll:null,event:null},time);c.restore();
}
