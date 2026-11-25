import {drawEmbeddedArrow} from './embedded-arrow.mjs';

const rect = (c,x,y,w,h,ink) => {
  c.fillStyle = ink;
  c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
};

function mark(c,x,y,ink) {
  rect(c,x-5,y-2,11,5,ink);
  rect(c,x-2,y-5,5,11,ink);
}

function logBridge(c,y,{log}) {
  const left = log.left, length = log.right-log.left;
  rect(c,left+2,y+8,length-4,10,'#264b4e9a');
  rect(c,left,y-11,length,20,'#42342b');
  rect(c,left+2,y-9,length-4,14,'#86644a');
  rect(c,left+5,y-8,length-10,5,'#b0885c');
  rect(c,left+3,y+2,length-6,4,'#634a38');
  for (let i=1;i<12;i++) {
    const at=left+13+i*14;
    rect(c,at,y-8,6+i%4,1,'#9b754e');
    rect(c,at-4,y-1,3+i%4,2,'#735338');
    if (i%3===0) rect(c,at+3,y+2,7,1,'#4b3b30');
  }
  for (const at of [left+3,left+length-10]) {
    rect(c,at,y-11,7,19,'#483828');
    rect(c,at+1,y-10,5,16,'#bea176');
    rect(c,at+2,y-10,1,16,'#dbbd8b');
  }
  rect(c,left+49,y-10,19,2,'#63724a');
  rect(c,left+71,y-9,11,2,'#8b9360');
  rect(c,left+143,y-8,14,2,'#778a58');
}

function post(c,x,y,high) {
  rect(c,x-7,y-1,14,3,'#30291d66');
  rect(c,x-3,y-high,6,high,'#46382c');
  rect(c,x-2,y-high+1,3,high-1,'#9a7952');
}

function gate(c,x,y,{pin}) {
  rect(c,x-29,y-9,57,14,'#2b302333');
  post(c,x-23,y,41);
  post(c,x+23,y,41);
  rect(c,x-21,y-38,43,6,'#554333');
  rect(c,x-21,y-37,43,2,'#ba8c56');
  const bottom=pin?y-16:y;
  for (let i=-15;i<=18;i+=8) {
    rect(c,x+i,y-32,3,bottom-y+32,'#423c37');
    rect(c,x+i,y-32,1,bottom-y+32,'#929087');
  }
  rect(c,x-18,bottom-2,38,3,'#5e4e43');
  rect(c,x-1,y-36,2,pin?16:24,'#b4975d');
  rect(c,x-4,y-23,8,4,pin?'#a08d63':'#ffdb7a');
  rect(c,x-2,y-24,4,6,'#e5b875');
  if (pin) drawEmbeddedArrow(c,pin);
}

function brassKey(c,x,y) {
  rect(c,x-3,y-3,6,6,'#5f4333');
  rect(c,x-2,y-2,4,4,'#d3a652');
  rect(c,x-1,y-1,2,2,'#382e2d');
  rect(c,x+2,y-1,5,2,'#e8bf65');
  rect(c,x+4,y+1,2,2,'#c79452');
}

function keyPost(c,x,y,{step,time,keyDropped},height) {
  post(c,x,y,42);
  rect(c,x-7,y-34,14,3,'#4b3a2e');
  rect(c,x-6,y-34,11,1,'#a88a59');
  rect(c,x-6,y-31,2,6,'#8b9185');
  if (!['key','signal','arrival','done'].includes(step)) brassKey(c,x,y-height);
  else if (step==='key') {
    const lift=Math.max(3,height-(time-keyDropped)*91);
    brassKey(c,x+Math.min(7,(time-keyDropped)*24),y-lift);
  }
}

function signalPost(c,x,y,{down,lookout}) {
  post(c,x,y,39);
  rect(c,x-3,y-38,13,3,'#715236');
  const lampY=down?y-14:y-27;
  rect(c,x+6,y-37,2,lampY-(y-37),'#6a6953');
  rect(c,x+3,lampY-3,9,10,'#362e2b');
  rect(c,x+5,lampY-1,5,6,lookout?'#8ccabb':down?'#6e6855':'#e6b05d');
  rect(c,x+6,lampY,2,4,lookout?'#c2e6bc':'#f5d98d');
}

function rails(c,x,y) {
  rect(c,x-134,y-14,315,28,'#72735a');
  for (let dx=-131;dx<180;dx+=14) {
    rect(c,x+dx,y-14,5,28,'#624f3d');
    rect(c,x+dx,y-14,3,26,'#937354');
  }
  for (const dy of [-9,9]) {
    rect(c,x-134,y+dy,315,3,'#3e3c35');
    rect(c,x-134,y+dy,315,1,'#a29a81');
  }
}

function train(c,x,y,{time,travel}) {
  c.save();
  c.beginPath();
  c.rect(17471,y-98,334,130);
  c.clip();
  for (const dx of [-103,-74,-22,12,45]) {
    rect(c,x+dx-8,y-7,16,13,'#302e2b');
    rect(c,x+dx-5,y-5,10,9,'#54534a');
    rect(c,x+dx-2,y-2,4,4,'#968b6b');
  }
  rect(c,x-122,y-18,181,12,'#302d29');
  rect(c,x-120,y-24,55,8,'#59473d');
  rect(c,x-123,y-36,35,12,'#4c614f');
  rect(c,x-122,y-33,33,6,'#647e61');
  rect(c,x-87,y-48,23,24,'#344a43');
  rect(c,x-83,y-45,11,12,'#aeb78d');
  rect(c,x-81,y-43,7,9,'#424a46');
  rect(c,x-92,y-51,33,4,'#263a35');
  rect(c,x-117,y-44,7,12,'#3c3a33');
  rect(c,x-119,y-47,12,4,'#514a3b');
  rect(c,x-119,y-33,4,6,'#e4ad65');
  rect(c,x-55,y-35,111,18,'#40342c');
  rect(c,x-53,y-33,107,14,'#825545');
  rect(c,x-51,y-32,103,3,'#b17d53');
  rect(c,x-52,y-24,105,1,'#583e34');
  for (const dx of [-51,-24,25,48]) rect(c,x+dx,y-35,3,17,'#bb925e');
  rect(c,x-2,y-34,13,14,'#d3b878');
  rect(c,x,y-32,9,8,'#a2754d');
  rect(c,x+1,y-31,6,2,'#e6c887');
  if (Math.abs(travel)>.001) for (let i=0;i<4;i++) {
    const drift=((time*18+i*9)%35);
    const px=x-115+drift*.5,py=y-48-drift;
    rect(c,px,py,4+i,4+i,'#9c9b8670');
    rect(c,px+2,py-2,4+i,4+i,'#d1c6ad82');
  }
  c.restore();
}

function payChest(c,x,y,{open}) {
  rect(c,x-14,y-3,28,5,'#32291d65');
  rect(c,x-12,y-14,24,15,'#382b24');
  rect(c,x-10,y-12,20,11,'#844e39');
  rect(c,x-10,y-6,20,2,'#603b30');
  rect(c,x-9,y-17,18,open?6:4,open?'#4c332a':'#ab774d');
  rect(c,x-8,y-14,3,14,'#c49b5d');
  rect(c,x+5,y-14,3,14,'#c49b5d');
  rect(c,x-2,y-11,4,5,open?'#5d4939':'#e6be6d');
}

export function drawGreyhavenOutlawProp(c,kind,{x,y,z},detail) {
  switch (kind) {
    case 'log': logBridge(c,y,detail); break;
    case 'rope': gate(c,x,y,detail); break;
    case 'hook': keyPost(c,x,y,detail,z); break;
    case 'signal': signalPost(c,x,y,detail); break;
    case 'rail': rails(c,x,y); break;
    case 'archeryMark':
      rect(c,x-13,y+2,26,2,'#5c6245');
      rect(c,x-14,y+1,8,3,'#b5ad88');
      rect(c,x+5,y+1,8,3,'#b5ad88');
      rect(c,x-2,y-1,4,3,'#dccda0');
      break;
    case 'train': train(c,x,y,detail); break;
    case 'payChest': payChest(c,x,y,detail); break;
    case 'music':
      if (detail.active) for (let i=0;i<3;i++) {
        const at=(detail.time*17+i*13)%38, bx=x+9+i*7+at*.18, by=y-40-at;
        rect(c,bx,by,2,7,'#f1d69d');rect(c,bx,by,5,2,'#e7bf82');rect(c,bx-3,by+5,5,3,'#f5e1ac');
      }
      break;
    case 'escape':
      mark(c,x,y,'#bdab6777');
      rect(c,x-15,y-1,8,1,'#d3bb7a99');
      rect(c,x+7,y-1,8,1,'#d3bb7a99');
      break;
    case 'johnFloat': {
      const ripple=Math.round(Math.sin(detail.time*15)*3);
      rect(c,x-15-ripple,y+1,30+ripple*2,2,'#8db0a9a0');
      rect(c,x-9,y-2,18,4,'#ad7350');
      rect(c,x-6,y-7,12,7,'#46362e');
      rect(c,x-4,y-5,8,5,'#bd8f6c');
      rect(c,x-3,y-6,5,2,'#80533c');
      rect(c,x-12,y+5,24,1,'#c7d3b3a0');
      break;
    }
  }
}
