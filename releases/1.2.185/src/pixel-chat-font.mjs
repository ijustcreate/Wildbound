// Hand-set 5x7 lettering. Each byte is one five-pixel row, top to bottom.
// Dialog is painted at integer pixels rather than rasterizing a system font.
const glyphs={
 A:'0e11111f111111',B:'1e11111e11111e',C:'0e11101010110e',D:'1e11111111111e',E:'1f10101e10101f',F:'1f10101e101010',G:'0e11101711110f',H:'1111111f111111',I:'0e04040404040e',J:'0702020212120c',K:'11121418141211',L:'1010101010101f',M:'111b1515111111',N:'11191513111111',O:'0e11111111110e',P:'1e11111e101010',Q:'0e11111115120d',R:'1e11111e141211',S:'0f10100e01011e',T:'1f040404040404',U:'1111111111110e',V:'11111111110a04',W:'11111115151b11',X:'11110a040a1111',Y:'11110a04040404',Z:'1f01020408101f',
 a:'00000e010f110f',b:'1010161911111e',c:'00000e1110110e',d:'01010d1311110f',e:'00000e111f100e',f:'0609091c080808',g:'00000f110f010e',h:'10101619111111',i:'04000c0404040e',j:'0200060202120c',k:'10101214181412',l:'0c04040404040e',m:'00001a15151515',n:'00001619111111',o:'00000e1111110e',p:'00001e111e1010',q:'00000f110f0101',r:'00001619101010',s:'00000f100e011e',t:'08081c08080906',u:'0000111111130d',v:'00001111110a04',w:'0000111115150a',x:'0000110a040a11',y:'000011110f010e',z:'00001f0204081f',
 '0':'0e11131519110e','1':'040c040404040e','2':'0e11010204081f','3':'1e01010601011e','4':'02060a121f0202','5':'1f10101e01011e','6':'0610101e11110e','7':'1f010204080808','8':'0e11110e11110e','9':'0e11110f01010c',
 '.':'00000000000c0c',',':'00000000000c08',':':'000c0c000c0c00',';':'000c0c000c0800',"'":'0c080000000000','"':'0a0a0000000000','!':'04040404040004','?':'0e110102040004','-':'0000001f000000','+':'0004041f040400','/':'01010204081010','%':'19190204081313','(':'02040808080402',')':'08040202020408','&':'0c12140815120d','…':'00000000151500',' ':'00000000000000'
};
const rows=Object.fromEntries(Object.entries(glyphs).map(([letter,hex])=>[letter,Array.from({length:7},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16))]));
const normalize=s=>String(s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[—–]/g,'-');
const advance=ch=>ch===' '?4:['i','l','!',"'",'.',',',':',';'].includes(ch)?4:6;
export function pixelChatTextWidth(text){return [...normalize(text)].reduce((sum,ch)=>sum+advance(ch),0);}
export function drawPixelChatText(c,text,x,y,color){c.fillStyle=color;let at=Math.round(x);const top=Math.round(y);for(const ch of normalize(text)){const data=rows[ch]||rows['?'],narrow=advance(ch)===4,shift=narrow?1:0;for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(data[row]&(1<<(4-col)))c.fillRect(at+col-shift,top+row,1,1);at+=advance(ch);}return at;}
