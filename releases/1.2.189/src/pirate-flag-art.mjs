const width=56,height=26,padding=5,frames=12;
const cache=[];
const emblem=[
  '......########......',
  '.....##########.....',
  '....############....',
  '....###..##..###....',
  '....###..##..###....',
  '.....#####.####.....',
  '.......######.......',
  '.##....#.##.#....##.',
  '..##............##..',
  '...###........###...',
  '.....###....###.....',
  '.......######.......',
  '......###..###......',
  '...####......####...',
  '..##............##..',
  '.##..............##.'
];

function paintFrame(c,phase){
  const folds=['#242932','#303641','#383d46','#2a3039'];
  for(let x=0;x<width;x++){
    const length=x/(width-1),tail=Math.max(0,x-width+10);
    const wave=Math.round(Math.sin(length*6-phase)*length*3.6+length*1.6);
    const top=wave+(x>2?1:0);
    const bottom=top+height-2-Math.floor(tail*.36);
    const end=x>=width-2;
    const crease=Math.sin(length*12-phase*.7);
    c.fillStyle='#20232c';c.fillRect(x,top+padding,1,bottom-top+1);
    if(end)continue;
    c.fillStyle=folds[crease>.75?2:crease>.15?1:crease<-.7?0:3];
    c.fillRect(x,top+padding+1,1,bottom-top-1);
    if(x%9!==8){c.fillStyle='#5a5753';c.fillRect(x,top+padding+1,1,1);}
    if(x%9===5){c.fillStyle='#5d5147';c.fillRect(x,bottom+padding-1,1,1);}
    const glyph=x-16;
    if(glyph<0||glyph>=emblem[0].length)continue;
    c.fillStyle=crease<-.32?'#c4b9a2':'#e7ddbf';
    for(let y=0;y<emblem.length;y++)if(emblem[y][glyph]==='#')c.fillRect(x,top+padding+4+y,1,1);
  }
}

export function drawJollyRoger(c,hoist,time){
  const frame=Math.floor(Math.max(0,time)*10)%frames;
  const phase=frame/frames*Math.PI*2;
  let canvas=cache[frame];
  if(!canvas){
    if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(width,height+padding*2);
    else if(typeof document!=='undefined'){
      canvas=document.createElement('canvas');canvas.width=width;canvas.height=height+padding*2;
    }else{
      c.save();c.translate(hoist.x,hoist.y-padding);paintFrame(c,phase);c.restore();return;
    }
    paintFrame(canvas.getContext('2d'),phase);cache[frame]=canvas;
  }
  c.drawImage(canvas,hoist.x,hoist.y-padding);
}
