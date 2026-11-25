// Native color regions share one vertex mesh. Moving an edge moves both of its
// neighbors, so rounding a shoulder/collar never uncovers a transparent seam.
export function buildCutoutMesh(rgba,width,height){
 const count=width*height,parent=new Int32Array(count).fill(-1),size=new Int32Array(count);
 const sums=new Float64Array(count*4),low=new Uint8Array(count*4),high=new Uint8Array(count*4);
 for(let i=0;i<count;i++)if(rgba[i*4+3]>=32){parent[i]=i;size[i]=1;for(let k=0;k<4;k++)sums[i*4+k]=low[i*4+k]=high[i*4+k]=rgba[i*4+k];}
 const find=i=>{let root=i;while(parent[root]!==root)root=parent[root];while(i!==root){const next=parent[i];parent[i]=root;i=next;}return root;};
 const join=(a,b)=>{
  if(parent[a]<0||parent[b]<0)return;a=find(a);b=find(b);if(a===b)return;
  let distance=0;for(let k=0;k<4;k++){
   const delta=sums[a*4+k]/size[a]-sums[b*4+k]/size[b];
   if(k<3)distance+=delta*delta;
   if(Math.max(high[a*4+k],high[b*4+k])-Math.min(low[a*4+k],low[b*4+k])>(k===3?8:12))return;
  }
  if(distance>144)return;
  if(size[a]<size[b])[a,b]=[b,a];parent[b]=a;size[a]+=size[b];
  for(let k=0;k<4;k++){sums[a*4+k]+=sums[b*4+k];low[a*4+k]=Math.min(low[a*4+k],low[b*4+k]);high[a*4+k]=Math.max(high[a*4+k],high[b*4+k]);}
 };
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x)join(i,i-1);if(y)join(i,i-width);}
 const labels=new Int32Array(count).fill(-1),regions=new Map();
 for(let i=0;i<count;i++)if(parent[i]>=0){const root=find(i);labels[i]=root;let region=regions.get(root);if(!region){region={id:root,color:Array.from({length:4},(_,k)=>Math.round(sums[root*4+k]/size[root])),cells:[]};regions.set(root,region);}region.cells.push(i);}
 const stride=width+1,nodes=stride*(height+1),vertices=new Float32Array(nodes*2),neighbors=Array.from({length:nodes},()=>[]),outline=Array.from({length:nodes},()=>[]),small=new Uint8Array(nodes);
 const at=(x,y)=>x<0||y<0||x>=width||y>=height?-1:labels[y*width+x];
 const edge=(a,b,outer)=>{if(!neighbors[a].includes(b))neighbors[a].push(b);if(!neighbors[b].includes(a))neighbors[b].push(a);if(outer){outline[a].push(b);outline[b].push(a);}};
 for(let y=0;y<=height;y++)for(let x=0;x<=width;x++){
  const node=y*stride+x;vertices[node*2]=x;vertices[node*2+1]=y;
  if(x<width&&at(x,y-1)!==at(x,y))edge(node,node+1,at(x,y-1)<0||at(x,y)<0);
  if(y<height&&at(x-1,y)!==at(x,y))edge(node,node+stride,at(x-1,y)<0||at(x,y)<0);
  const classes=new Set([at(x-1,y-1),at(x,y-1),at(x-1,y),at(x,y)]);
  if([...classes].some(id=>id>=0&&size[id]<=12))small[node]=1;
 }
 for(let pass=0;pass<5;pass++){
  const next=vertices.slice();
  for(let node=0;node<nodes;node++)if(neighbors[node].length>=2){
   const links=outline[node].length===2?outline[node]:neighbors[node],ox=node%stride,oy=Math.floor(node/stride),limit=small[node] ? .25 : .8;
   let x=0,y=0;for(const other of links){x+=vertices[other*2];y+=vertices[other*2+1];}
   next[node*2]=Math.max(ox-limit,Math.min(ox+limit,vertices[node*2]*.5+x/links.length*.5));
   next[node*2+1]=Math.max(oy-limit,Math.min(oy+limit,vertices[node*2+1]*.5+y/links.length*.5));
  }
  // Keep thin pieces of equipment and one-pixel connections from folding over.
  for(let check=0;check<2;check++)for(let cell=0;cell<count;cell++)if(labels[cell]>=0){
   const n=Math.floor(cell/width)*stride+cell%width,points=[n,n+1,n+stride+1,n+stride];let area=0;
   for(let k=0;k<4;k++){const a=points[k]*2,b=points[(k+1)%4]*2;area+=next[a]*next[b+1]-next[b]*next[a+1];}
   if(area<.1)for(const p of points){next[p*2]=vertices[p*2];next[p*2+1]=vertices[p*2+1];}
  }
  vertices.set(next);
 }
 return {width,height,labels,vertices,regions:[...regions.values()]};
}

const cache=new Map(),LIMIT=32*1024*1024;let bytes=0,scratch;
export function cutoutSurface(source,{pixelScale=1,outputScale=4}={}){
 const width=Math.max(1,Math.round(source.width/pixelScale)),height=Math.max(1,Math.round(source.height/pixelScale));
 scratch||=document.createElement('canvas');scratch.width=width;scratch.height=height;
 const c=scratch.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(source,0,0,width,height);
 const data=c.getImageData(0,0,width,height).data;let a=2166136261,b=5381;
 for(let i=0;i<data.length;i++){a=Math.imul(a^data[i],16777619);b=((b<<5)+b)^data[i];}
 const key=width+':'+height+':'+outputScale+':'+(a>>>0)+':'+(b>>>0);
 if(cache.has(key)){const hit=cache.get(key);cache.delete(key);cache.set(key,hit);return hit;}
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const canvas=document.createElement('canvas');canvas.width=width*outputScale;canvas.height=height*outputScale;
 if(maxX<0)return canvas;
 const cropWidth=maxX-minX+1,cropHeight=maxY-minY+1,crop=new Uint8ClampedArray(cropWidth*cropHeight*4);
 for(let y=0;y<cropHeight;y++)crop.set(data.subarray(((y+minY)*width+minX)*4,((y+minY)*width+minX+cropWidth)*4),y*cropWidth*4);
 const mesh=buildCutoutMesh(crop,cropWidth,cropHeight);
 const paint=canvas.getContext('2d');paint.scale(outputScale,outputScale);paint.translate(minX,minY);paint.lineJoin='round';paint.lineWidth=.22;
 const stride=cropWidth+1,v=mesh.vertices;
 for(const region of mesh.regions){
  const [r,g,b,alpha]=region.color;paint.fillStyle=paint.strokeStyle='rgba('+r+','+g+','+b+','+(alpha/255)+')';paint.beginPath();
  for(const cell of region.cells){const x=cell%cropWidth,y=Math.floor(cell/cropWidth),n=y*stride+x;
   paint.moveTo(v[n*2],v[n*2+1]);for(const p of [n+1,n+stride+1,n+stride])paint.lineTo(v[p*2],v[p*2+1]);paint.closePath();
  }
  paint.fill();if(alpha===255)paint.stroke();
 }
 const cost=canvas.width*canvas.height*4;
 while(bytes+cost>LIMIT&&cache.size){const oldest=cache.keys().next().value,old=cache.get(oldest);bytes-=old.width*old.height*4;cache.delete(oldest);}
 if(cost<=LIMIT){cache.set(key,canvas);bytes+=cost;}
 return canvas;
}
