import {LOBBY_FLOOR} from './lobby-geometry.mjs';
let packBackdrop=null;
export function setLobbyPackBackdrop(image){packBackdrop=image||null;}
export function drawLobbyBackdrop(c,{warm=false,pack=true}={}){
  const {left,top,right,bottom}=LOBBY_FLOOR;
  c.fillStyle=warm?'#293c35':'#505659';c.fillRect(0,0,1024,620);
  for(let y=top;y<bottom;y+=42)for(let x=left;x<right;x+=42){
    const alternate=(Math.floor(x/42)+Math.floor(y/42))%3===0;
    c.fillStyle=warm?(x<530?(Math.floor(y/42)%2?'#756349':'#806d50'):(alternate?'#526259':'#58695e')):(alternate?'#62686a':'#656b6d');
    c.fillRect(x,y,Math.min(40,right-x),Math.min(40,bottom-y));
    if(warm&&x<530&&y+40<=bottom){c.fillStyle='#9a825951';c.fillRect(x+3,y+2,34,2);c.fillStyle='#4a403a';c.fillRect(x+3,y+34,2,2);c.fillRect(x+35,y+4,2,2);}
  }
  c.fillStyle='#343d40';c.fillRect(warm?559:529,top,5,bottom-top);
  c.fillRect(8,58,right-8,11);c.fillRect(8,bottom-12,right-8,12);
  c.fillRect(8,top,7,bottom-top);c.fillRect(right-7,top,7,bottom-top);
  if(pack&&packBackdrop?.complete&&packBackdrop.naturalWidth)c.drawImage(packBackdrop,0,0,1024,620);
}
