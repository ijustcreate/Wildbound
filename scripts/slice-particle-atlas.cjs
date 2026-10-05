const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs'),root=path.resolve(__dirname,'../assets/particles/cartoon-v1');
const source=PNG.sync.read(fs.readFileSync(path.join(root,'atlas.png'))),names=['spark','streak','smoke','flame','leaf','lightning','ring','rune','heart','ghost','splat','droplet','crescent','orb','burst','swirl'],manifest={sourceWidth:source.width,sourceHeight:source.height,sprites:{}};
for(let i=0;i<16;i++){
 const x=Math.floor(i%4*source.width/4),y=Math.floor(Math.floor(i/4)*source.height/4),w=Math.floor((i%4+1)*source.width/4)-x,h=Math.floor((Math.floor(i/4)+1)*source.height/4)-y,out=new PNG({width:128,height:128});
 // Area-average downsample preserves real alpha and avoids aliasing of thin bolts.
 for(let yy=0;yy<128;yy++)for(let xx=0;xx<128;xx++){
  const sx=x+Math.floor(xx*w/128),sy=y+Math.floor(yy*h/128),ex=x+Math.ceil((xx+1)*w/128),ey=y+Math.ceil((yy+1)*h/128);let alpha=0,r=0,g=0,b=0,n=0;
  for(let py=sy;py<ey;py++)for(let px=sx;px<ex;px++){const j=(py*source.width+px)*4,a=source.data[j+3];alpha+=a;r+=source.data[j]*a;g+=source.data[j+1]*a;b+=source.data[j+2]*a;n++;}
  const j=(yy*128+xx)*4;out.data[j]=alpha?r/alpha:0;out.data[j+1]=alpha?g/alpha:0;out.data[j+2]=alpha?b/alpha:0;out.data[j+3]=alpha/n;
 }fs.writeFileSync(path.join(root,names[i]+'.png'),PNG.sync.write(out));manifest.sprites[names[i]]={x,y,width:w,height:h,output:128};
}fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Extracted 16 transparent 128px particle sprites');
