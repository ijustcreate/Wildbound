// Procedural world art, with the same pixel scale and lighting as the forest.
export function drawBiomeSprite(c,kind,x,y,width,height=width*1.5){
 if(!['pillar','guardian','brazier'].includes(kind))return false;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(width/40,height/60);
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 r(-18,-5,36,5,'#253e35');r(-17,-9,34,5,'#78876b');r(-15,-10,30,2,'#b2b68a');
 if(kind==='pillar'){
  r(-12,-53,24,43,'#4b6656');r(-11,-52,6,41,'#849879');r(7,-52,5,41,'#314d42');
  for(let j=-47;j<-12;j+=11){r(-9,j,15,1,'#2c4b40');r(-7,j+2,10,2,'#acac73');r(1,j+4,2,4,'#acac73');r(-4,j+7,7,1,'#acac73');}
  r(-16,-57,32,5,'#a5ae89');r(-14,-53,28,3,'#647b61');r(-16,-59,31,2,'#c0c3a0');
  for(let j=0;j<6;j++)r(-14+j%2*3,-53+j*5,4,3,j%2?'#778a4a':'#436a40');
 }else if(kind==='guardian'){
  r(-15,-43,30,33,'#506a57');r(-11,-50,23,9,'#7d8e70');r(-15,-43,6,27,'#87987a');r(10,-43,5,30,'#354f44');
  r(-12,-39,11,5,'#2a443b');r(3,-39,10,5,'#2a443b');r(-10,-37,6,2,'#8dccaf');r(5,-37,6,2,'#8dccaf');
  r(-3,-36,7,13,'#a6ad84');r(-10,-21,20,5,'#324c3e');r(-7,-21,14,2,'#939e78');r(-17,-33,3,9,'#b4a575');r(15,-33,3,9,'#b4a575');
  for(let j=0;j<7;j++)r(-12+j*3,-48+(j%3)*3,4,3,j%2?'#506e43':'#8f9e59');
 }else{r(-8,-33,16,23,'#3b5b4e');r(-6,-31,5,19,'#87916b');r(-10,-17,20,3,'#b1a36c');r(-17,-40,34,8,'#4a5a43');r(-18,-42,36,3,'#b9a36d');r(-13,-39,26,2,'#dfc38a');}
 c.restore();return true;
}
