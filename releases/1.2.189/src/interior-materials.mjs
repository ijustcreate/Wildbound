const materials={
  wood:['#795c42','#9e764f','#b18a61','#c59e70','#dfbd8b','#8a674b'],
  panel:['#57473d','#755846','#916d50','#ad835c','#cda671','#634c41'],
  plaster:['#625847','#a5977a','#bdad8b','#cdbc99','#e1cfab','#8a7d64'],
  masonry:['#52574d','#6e7467','#838675','#999986','#b5b09a','#656c60'],
  cement:['#666d64','#83897d','#929487','#9da092','#b1ad99','#777e72'],
  checker:['#68756c','#537068','#cccaaf','#719087','#e6dfc2','#718175'],
  carpet:['#485751','#47645d','#52736a','#6e8980','#a8b399','#3b5954'],
  metal:['#444849','#626e6a','#818c85','#a4aaa0','#d1c7ae','#565d5d'],
};

const block=(c,x,y,w,h,color)=>{
  if(w<=0||h<=0)return;
  c.fillStyle=color;
  c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
};
const cell=(x,y)=>((Math.imul(x+217,0x1f123bb5)^Math.imul(y+183,0x5274a13))>>>2)%29;

function wood(c,r,m,vertical){
  const a=vertical?10:47,b=vertical?36:9;
  for(let row=Math.floor(r.y/b);row<Math.ceil((r.y+r.h)/b);row++){
    const shift=vertical?0:(row%2?22:0);
    for(let col=Math.floor((r.x-shift)/a);col<Math.ceil((r.x+r.w-shift)/a);col++){
      const value=cell(col,row),x=col*a+shift,y=row*b;
      block(c,x+1,y+1,a-1,b-1,m[1+value%3]);
      if(vertical){
        block(c,x+1,y+2,1,b-3,m[4]);
        block(c,x+4+(value%3),y+5,1,9+value%11,m[5]);
        if(value%4===0)block(c,x+3,y+18,4,1,m[0]);
      }else{
        block(c,x+2,y+1,a-4,1,m[4]+'69');
        const line=x+4+value%21;
        block(c,line,y+5,7+value%8,1,m[5]+'85');
        if(value%6===0){
          block(c,line+2,y+4,4,1,m[5]);
          block(c,line+5,y+5,4,1,m[5]);
        }
      }
    }
  }
}

function masonry(c,r,m){
  for(let row=Math.floor(r.y/10);row<Math.ceil((r.y+r.h)/10);row++){
    const shift=row%2?11:0;
    for(let col=Math.floor((r.x-shift)/22);col<Math.ceil((r.x+r.w-shift)/22);col++){
      const x=col*22+shift,y=row*10,v=cell(col,row);
      block(c,x+1,y+2,20,7,m[1+v%3]);
      block(c,x+2,y+1,17,2,m[1+v%3]);
      block(c,x+2,y+2,7+v%10,1,m[4]+'7a');
      if(v%5===0){
        block(c,x+3+v%6,y+6,9,2,m[5]+'9a');
        block(c,x+6+v%4,y+5,3,1,m[5]+'9a');
      }
    }
  }
}

function masonrySlabs(c,r,m,isMetal){
  const size=isMetal?28:36,rows=isMetal?23:27;
  for(let row=Math.floor(r.y/rows);row<Math.ceil((r.y+r.h)/rows);row++){
    const shift=row%2?9:0;
    for(let col=Math.floor((r.x-shift)/size);col<Math.ceil((r.x+r.w-shift)/size);col++){
      const x=col*size+shift,y=row*rows,v=cell(col,row);
      block(c,x+1,y+1,size-1,rows-1,m[1+v%3]);
      block(c,x+2,y+1,size-5,1,m[4]+'83');
      block(c,x+3+v%7,y+7,9,1,m[4]+'4a');
      block(c,x+6+v%14,y+rows-5,10,2,m[5]+'68');
      if(isMetal){
        block(c,x+3,y+3,2,2,m[0]);block(c,x+size-5,y+rows-5,2,2,m[0]);
      }else if(v%7===0){
        block(c,x+8,y+9,6,1,m[5]);block(c,x+13,y+10,7,1,m[5]);
      }
    }
  }
}

export function paintInteriorMaterial(c,r,material='wood',palette){
  const m=palette||materials[material]||materials.wood;
  if(r.w<1||r.h<1)return;
  c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
  block(c,r.x,r.y,r.w,r.h,m[0]);
  if(material==='wood'||material==='panel')wood(c,r,m,material==='panel');
  else if(material==='masonry')masonry(c,r,m);
  else if(material==='cement'||material==='metal')masonrySlabs(c,r,m,material==='metal');
  else if(material==='checker'){
    for(let row=Math.floor(r.y/16);row<Math.ceil((r.y+r.h)/16);row++){
      for(let col=Math.floor(r.x/16);col<Math.ceil((r.x+r.w)/16);col++){
        const x=col*16,y=row*16,v=(row+col)&1;
        block(c,x+1,y+1,15,15,m[v+1]);block(c,x+2,y+1,13,1,m[v+3]);
        if(cell(col,row)%4===0)block(c,x+3,y+11,7,2,m[v+3]+'76');
      }
    }
  }else if(material==='carpet'){
    block(c,r.x+1,r.y+1,r.w-2,r.h-2,m[2]);
    block(c,r.x+4,r.y+4,r.w-8,1,m[4]);
    block(c,r.x+4,r.y+r.h-5,r.w-8,1,m[4]);
    block(c,r.x+4,r.y+4,1,r.h-8,m[4]);
    block(c,r.x+r.w-5,r.y+4,1,r.h-8,m[4]);
    for(let y=9;y<r.h-7;y+=8)for(let x=9+(y%16?3:0);x<r.w-7;x+=12){
      block(c,r.x+x,r.y+y,3,1,m[3]+'8a');
      block(c,r.x+x+2,r.y+y+1,2,1,m[5]+'a5');
    }
  }else{
    block(c,r.x,r.y,r.w,r.h,m[2]);
    for(let y=3;y<r.h;y+=8){
      for(let x=2+(y%16?7:0);x<r.w;x+=19){
        const v=cell(x,y);
        if(v%3===0)block(c,r.x+x,r.y+y,8+v%6,2,m[1]+'59');
        if(v%7===0)block(c,r.x+x+3,r.y+y-2,7,1,m[4]+'85');
      }
    }
  }
  c.restore();
}

// y is the wall's meeting point with the floor. The face projects upward,
// and is painted in the background pass so actors can always stand in front.
export function drawInteriorFace(c,{x,y,w,height,material='plaster',palette,trim=['#554337','#987350','#c29a6b']}){
  if(w<2||height<3)return;
  const h=Math.round(height),skirt=Math.min(8,Math.max(4,Math.floor(h*.24)));
  paintInteriorMaterial(c,{x,y:y-h,w,h},material,palette);
  block(c,x,y-h,w,2,trim[0]);
  block(c,x+1,y-h+2,w-2,1,trim[2]);
  block(c,x,y-skirt-2,w,2,trim[0]);
  block(c,x+1,y-skirt,w-2,skirt-1,trim[1]);
  block(c,x+1,y-skirt,w-2,1,trim[2]);
  for(let x2=x+23;x2<x+w-5;x2+=26)block(c,x2,y-skirt+1,1,skirt-2,trim[0]);
  block(c,x,y-1,w,1,trim[0]);
  block(c,x,y,w,2,'#312c2945');
}

// Low foreground and side cross-sections stay inside the authored footprint.
// The small contact band is applied before actors and furniture.
export function drawInteriorCutawayEdge(c,{x,y,w,h},{side='south',trim=['#524839','#897054','#b99b70'],height=5}={}){
  const [shadow,body,highlight]=trim;
  const depth=Math.max(2,Math.min(6,height));
  if(side==='south'){
    block(c,x,y-2,w,2,'#251d2140');
    block(c,x,y,w,Math.min(depth,h),shadow);
    block(c,x,y+1,w,Math.min(depth-1,h-1),body);
    block(c,x,y,w,1,highlight);
    for(let u=x+14;u<x+w-4;u+=25)block(c,u,y+2,1,Math.min(depth-2,h-2),shadow);
  }else{
    const west=side==='west',lineX=west?x+w-1:x;
    block(c,x,y,w,h,shadow);
    block(c,west?x+1:x,y,Math.min(depth,w)-1,h,body);
    block(c,lineX,y,1,h,highlight);
    for(let v=y+13;v<y+h-4;v+=22)block(c,x+1,v,Math.max(1,w-2),1,shadow);
  }
}

