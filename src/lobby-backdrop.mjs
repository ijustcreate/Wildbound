let packBackdrop=null;
export function setLobbyPackBackdrop(image){packBackdrop=image||null;}
export function drawLobbyBackdrop(c){
  c.fillStyle='#505659';c.fillRect(0,0,1024,620);
  for(let y=68;y<590;y+=42)for(let x=16;x<1010;x+=42){c.fillStyle=(Math.floor(x/42)+Math.floor(y/42))%3===0?'#62686a':'#656b6d';c.fillRect(x,y,40,40);}
  c.fillStyle='#343d40';c.fillRect(529,68,5,522);c.fillRect(8,58,1008,11);c.fillRect(8,590,1008,12);c.fillRect(8,68,7,522);c.fillRect(1010,68,7,522);
  if(packBackdrop?.complete&&packBackdrop.naturalWidth)c.drawImage(packBackdrop,0,0,1024,620);
}
