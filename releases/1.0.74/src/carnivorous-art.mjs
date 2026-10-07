import {projectPoint} from './player-motion.mjs';
import {paintLayers} from './render-order.mjs';
import {pixelLine,pixelPolygon,pixelVolume} from './pixel-shapes.mjs';
export function flowerDefaults(legacy){
 const m=structuredClone(legacy);m.artGeneration=2;m.name='Carnivorous bloom / four thorned petals';
 Object.assign(m.palette,{body:'#658c36',shade:'#2c4d31',light:'#a3bc4a',face:'#d76782',detail:'#f1c35e',outline:'#1c3728',eye:'#a5c464'});
 Object.assign(m.shape,{bodyWidth:9,headRadius:12,limbWidth:7,flowerVariety:1});
 for(const action of ['grab','attack'])for(const key of m.clips[action].keys){const t=key.frame/(m.clips[action].length-1),open=t<.55?6+Math.sin(t/.55*Math.PI)*4:Math.max(.2,5*(1-(t-.55)/.15));key.joints.jawTop[2]=open;key.joints.jawBottom[2]=-open;}
 return m;
}
export function upgradeFlowerMotion(saved,legacy){
 const copy=structuredClone(saved);if(copy.artGeneration===2)return copy;const fresh=flowerDefaults(legacy);
 for(const field of ['palette','shape','clips']){copy[field]={...fresh[field],...copy[field]};for(const [name,value]of Object.entries(fresh[field]))if(JSON.stringify(saved[field]?.[name])===JSON.stringify(legacy[field]?.[name]))copy[field][name]=structuredClone(value);}
 if(copy.name===legacy.name)copy.name=fresh.name;copy.artGeneration=2;return copy;
}
export function drawCarnivorous(c,actor,model,pose,d){
 const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),pal=model.palette,s=model.shape;
 const orchid=actor.plantVariant==='orchid'||s.flowerVariety>=1.5,queue=[],visible=n=>model.visibility?.[n]?.[d]!==false;
 const add=(id,bones,fn,depth=p[bones[0]].depth)=>{if(visible(bones[0]))queue.push({id,bone:bones[0],bones,fn,depth});};
 const v=(x,y,z)=>projectPoint([x,y,z],d),head=pose.head,open=Math.max(.12,Math.min(1,(pose.jawTop[2]-pose.jawBottom[2]-5)/18));
 const wilt=Math.max(.22,Math.min(1,head[2]/31)),radius=s.headRadius*1.65*wilt;
 // A rooted rosette of pointed leaves, not a rectangular base tile.
 add('Root',['pelvis'],()=>{for(let i=0;i<7;i++){const a=i*Math.PI*2/7,base=pose.pelvis,tip=[base[0]+Math.cos(a)*17,base[1]+Math.sin(a)*13,base[2]+1];pixelPolygon(c,[v(base[0],base[1],base[2]),v(base[0]+Math.cos(a+.45)*9,base[1]+Math.sin(a+.45)*7,3),projectPoint(tip,d),v(base[0]+Math.cos(a-.45)*9,base[1]+Math.sin(a-.45)*7,3)],i%2?pal.body:pal.shade);pixelLine(c,p.pelvis,projectPoint(tip,d),pal.light);}},-100);
 for(const [a,b]of [['pelvis','stem1'],['stem1','stem2'],['stem2','neck'],['neck','head']])add('Stem '+b,[b,a],()=>{
  pixelLine(c,p[a],p[b],pal.outline,s.limbWidth+3);pixelLine(c,p[a],p[b],pal.shade,s.limbWidth+1);pixelLine(c,{x:p[a].x-1,y:p[a].y},{x:p[b].x-1,y:p[b].y},pal.body,s.limbWidth-1);
  const top=p[b];pixelLine(c,{x:top.x-3,y:top.y},{x:top.x+3,y:top.y},pal.light,2);
  pixelPolygon(c,[{x:top.x+3,y:top.y+2},{x:top.x+7,y:top.y+4},{x:top.x+3,y:top.y+6}],pal.shade);
 });
 for(const n of ['leafL','leafR'])add('Stem '+n,[n,'stem1'],()=>{const q=p[n],a=p.stem1;pixelPolygon(c,[a,{x:q.x-4,y:q.y+2},{x:q.x+(n==='leafL'?-5:5),y:q.y-3},{x:q.x+2,y:q.y-6}],pal.body);pixelLine(c,a,q,pal.light);});
 add('Head',['head'],()=>pixelVolume(c,[head[0],head[1]+2,head[2]],5,3,4,d,{body:pal.face,shade:pal.shade,light:pal.detail,outline:pal.outline}));
 const front=d<3||d>5,count=orchid?5:4;
 for(let i=0;i<count;i++){
  const a=Math.PI/2+i*Math.PI*2/count,u=[Math.cos(a),Math.sin(a)],name=i===0?'jawTop':i===2?'jawBottom':i===1?'eyeL':'eyeR';
  const at=(r,w,depth=0)=>v(head[0]+u[0]*r-u[1]*w,head[1]+7+depth+(1-open)*r*.6,head[2]+u[1]*r+u[0]*w);
  const len=radius*(.65+open*.35),width=(orchid?5:7.5)*wilt;
  add(i===0?'jawTop':i===2?'jawBottom':'Petal '+i,i===0||i===2?[name,'head']:['head',name],()=>{
   const outer=[at(1,0),at(len*.35,-width),at(len*.8,-width*.6),at(len*1.15,0,-3),at(len*.8,width*.6),at(len*.35,width)];
   pixelPolygon(c,outer,pal.outline);pixelPolygon(c,[at(2,0),at(len*.36,-width*.85),at(len*.8,-width*.48),at(len*1.08,0,-3),at(len*.8,width*.48),at(len*.36,width*.85)],orchid?'#a73988':pal.body);
   if(front){
    pixelPolygon(c,[at(2,0,1),at(len*.36,-width*.6,1),at(len*.78,-width*.35,1),at(len,0,-1),at(len*.78,width*.35,1),at(len*.36,width*.6,1)],orchid?'#d451ac':pal.detail);
    pixelPolygon(c,[at(1,0,2),at(len*.4,-width*.48,2),at(len*.57,0,2),at(len*.4,width*.48,2)],orchid?'#e987c6':pal.face);
    for(const sign of [-1,1])pixelLine(c,at(3,0,3),at(len*.87,sign*width*.25,2),orchid?'#ef8cca':'#f5d979');
   }else pixelLine(c,at(1,0),at(len,0,-2),pal.light);
   for(const sign of [-1,1])for(const t of [.4,.65,.85]){
    const q=at(len*t,sign*width*(t>.8?.5:.82));pixelPolygon(c,[q,{x:q.x+sign*2,y:q.y-3},{x:q.x+sign*3,y:q.y+1}],orchid?'#7c2a68':pal.body);
   }
  },at(len*.6,0).depth);
 }
 if(orchid&&front)add('Orchid stamens',['jawTop','head'],()=>{for(const offset of [-2,2]){const a=atHead(head,0,8,0,d),b=atHead(head,offset,13,14*wilt,d);pixelLine(c,a,b,'#c59d8b',2);pixelLine(c,{x:a.x-1,y:a.y},{x:b.x-1,y:b.y},'#eed1b1');}},p.head.depth+20);
 paintLayers(queue,model,d,c,p);return p;
}
function atHead(head,x,y,z,d){return projectPoint([head[0]+x,head[1]+y,head[2]+z],d);}
