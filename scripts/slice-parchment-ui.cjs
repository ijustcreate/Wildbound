const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'../assets/ui-parchment');
const src=PNG.sync.read(fs.readFileSync(path.join(root,'ui-atlas.png')));
const names=['panel','header','slot-dark','slot-paper','button','button-selected','button-pressed','button-disabled','close','settings','inventory','speaker','music','coin','left','right'];
const manifest={width:src.width,height:src.height,sprites:{}};
for(let i=0;i<16;i++){
 const bands=[0,360,590,920,1254].map(y=>Math.round(y*src.height/1254)),row=Math.floor(i/4);
 const x0=Math.floor(i%4*src.width/4),y0=bands[row],x1=Math.floor((i%4+1)*src.width/4),y1=bands[row+1];
 let l=x1,t=y1,r=x0,b=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(src.data[(y*src.width+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 const out=new PNG({width:r-l+1,height:b-t+1});PNG.bitblt(src,out,l,t,out.width,out.height,0,0);
 fs.writeFileSync(path.join(root,names[i]+'.png'),PNG.sync.write(out));manifest.sprites[names[i]]={x:l,y:t,width:out.width,height:out.height};
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest);
