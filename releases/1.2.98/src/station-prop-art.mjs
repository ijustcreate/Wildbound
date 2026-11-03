// Station study: stepped silhouettes, broad material planes, dark openings.
// Native pixels remain readable at gameplay size; no bitmap or save replacement.
export function drawStationCargo(c,kind,x,y,time=0){
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},p=(points,col)=>{c.fillStyle=col;const low=Math.floor(Math.min(...points.map(p=>p[1]))),high=Math.ceil(Math.max(...points.map(p=>p[1])));for(let row=low;row<high;row++){const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],yy=row+.5;if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))hits.push(a[0]+(yy-a[1])*(b[0]-a[0])/(b[1]-a[1]));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)c.fillRect(Math.round(x+hits[i]),Math.round(y+row),Math.round(hits[i+1])-Math.round(hits[i]),1);}};
 const box=(dx,dy,w,h,front,top,side)=>{p([[dx,dy],[dx+7,dy-5],[dx+w+7,dy-5],[dx+w,dy]],top);p([[dx+w,dy],[dx+w+7,dy-5],[dx+w+7,dy+h-5],[dx+w,dy+h]],side);r(x+dx,y+dy,w,h,front);};
 if(kind==='trunks'){
  p([[-25,-3],[-25,-24],[-22,-31],[-16,-35],[17,-35],[24,-30],[27,-24],[27,-3],[22,1],[-20,1]],'#302d2c');
  p([[-23,-24],[-20,-30],[-14,-33],[16,-33],[22,-29],[24,-24]],'#ae7650');
  p([[-23,-24],[19,-24],[19,-2],[-21,-2],[-23,-5]],'#764831');p([[19,-24],[24,-28],[25,-23],[25,-5],[19,-2]],'#503a30');
  r(x-22,y-23,40,4,'#c38f59');r(x-20,y-17,36,14,'#865139');r(x-23,y-22,47,2,'#382f29');
  for(const dx of[-15,10]){r(x+dx,y-31,4,29,'#bca06b');r(x+dx+1,y-30,1,26,'#ead19a');r(x+dx-1,y-16,6,6,'#e3bd76');r(x+dx+1,y-14,2,2,'#493d2e');}
  r(x-7,y-20,13,7,'#382f29');r(x-5,y-21,9,2,'#d9b779');r(x-4,y-19,7,3,'#5d4533');
  for(const [dx,dy]of[[-23,-24],[19,-24],[-23,-7],[19,-7]]){r(x+dx,y+dy,5,4,'#c2a16a');r(x+dx+1,y+dy+1,2,1,'#eed59d');}
  // Smaller plum suitcase leaning behind the domed leather trunk.
  box(-11,-45,29,10,'#6e4250','#a36465','#422f3c');r(x-6,y-49,3,5,'#c0a16c');r(x+11,y-49,3,5,'#c0a16c');r(x-1,y-53,9,2,'#2f3030');r(x-3,y-51,2,4,'#a88e66');r(x+8,y-51,2,4,'#a88e66');
 }else if(kind==='parcels'){
  box(-23,-21,32,19,'#ae8555','#dfbd85','#785b3e');box(-8,-39,26,17,'#c5a675','#edd3a0','#8b704d');box(-25,-49,20,12,'#c7b996','#ece0ba','#92866a');
  for(const [dx,dy,w,h]of[[-23,-21,32,19],[-8,-39,26,17],[-25,-49,20,12]]){r(x+dx+w*.6|0,y+dy,2,h,'#695b43');r(x+dx,y+dy+h*.45|0,w,2,'#e2cba0');r(x+dx+4,y+dy+3,8,5,'#f1e3bf');r(x+dx+5,y+dy+5,5,1,'#9b8a6b');}
  p([[6,-41],[2,-44],[-1,-43],[3,-40],[-2,-39],[2,-37],[6,-40],[10,-37],[13,-39],[9,-41],[12,-44],[9,-45]],'#7a6446');
 }else if(kind==='owl_crate'){
  // An open arched carrier with a side plane and a small owl inside.
  p([[-21,0],[-23,-30],[-19,-39],[-11,-45],[10,-45],[20,-39],[24,-30],[24,0]],'#302e2b');
  p([[-18,-30],[-15,-37],[-8,-41],[9,-41],[16,-36],[19,-30],[19,-4],[-18,-4]],'#202d30');
  p([[19,-30],[24,-33],[27,-27],[27,-4],[19,0]],'#71543c');
  p([[-11,-10],[-10,-25],[-6,-31],[7,-31],[12,-24],[11,-10],[6,-5],[-6,-5]],'#a28d68');
  p([[-11,-24],[-12,-34],[-5,-30],[5,-30],[12,-34],[11,-24],[7,-19],[-6,-19]],'#cebc91');
  for(const dx of[-6,5]){r(x+dx-3,y-28,7,7,'#eee0b6');r(x+dx,y-26,2,4,'#263237');}p([[-1,-22],[3,-22],[1,-18]],'#d7aa54');
  r(x-6,y-14,3,2,'#d8c49a');r(x+3,y-14,3,2,'#d8c49a');r(x-3,y-10,6,2,'#d8c49a');
  for(const dx of[-18,15]){r(x+dx,y-31,3,28,'#aa8758');r(x+dx,y-30,1,25,'#ddbe85');}
  for(const dx of[-12,10])r(x+dx,y-37,1,33,'#80755a');
  p([[-23,-30],[-19,-39],[-11,-45],[10,-45],[20,-39],[24,-30],[20,-30],[16,-36],[8,-41],[-8,-41],[-16,-36],[-19,-30]],'#c2a16c');
  r(x-23,y-5,47,5,'#b3905e');r(x-20,y-4,40,1,'#e0be84');r(x-6,y-50,12,2,'#322f29');r(x-8,y-48,2,6,'#a38459');r(x+6,y-48,2,6,'#a38459');
 }else if(kind==='flower_tub'){
  p([[-20,-20],[-16,-2],[-10,2],[11,2],[18,-2],[22,-20],[17,-25],[-14,-25]],'#353b2d');
  p([[-18,-19],[-13,-2],[10,0],[17,-3],[20,-20]],'#8f6945');p([[11,-20],[20,-20],[17,-3],[10,0]],'#594835');
  for(const dx of[-13,-6,2,10])r(x+dx,y-19,2,17,'#b28a58');r(x-18,y-19,38,3,'#657267');r(x-14,y-5,30,3,'#56635a');
  p([[-20,-21],[-13,-26],[14,-26],[22,-21],[16,-17],[-13,-17]],'#b19a69');p([[-16,-22],[-10,-24],[12,-24],[18,-21],[12,-19],[-11,-19]],'#3d382d');
  for(const [dx,dy]of[[-16,-32],[-8,-40],[3,-36],[13,-42],[20,-31]]){p([[dx,dy+13],[dx-8,dy+5],[dx-7,dy+1],[dx,dy+5],[dx+6,dy-1],[dx+9,dy+2],[dx+2,dy+12]],'#476d43');r(x+dx,y+dy,2,17,'#82935a');}
  for(const [i,[dx,dy]]of[[-15,-34],[-7,-46],[4,-38],[14,-47],[21,-33]].entries()){const col=i%2?'#ba7181':'#d8b568',light=i%2?'#e4a3a2':'#f1d891';p([[dx-5,dy-3],[dx-3,dy-6],[dx+2,dy-6],[dx+5,dy-3],[dx+5,dy+2],[dx+2,dy+5],[dx-3,dy+5],[dx-5,dy+2]],col);r(x+dx-3,y+dy-4,5,3,light);r(x+dx-1,y+dy-1,3,3,'#f6e6ad');}
 }else if(kind==='luggage_cart'){
  const bob=Math.sin(time*2+x)*.5;
  for(const dx of[-20,19]){p([[dx-5,1],[dx-3,-2],[dx+2,-2],[dx+5,1],[dx+5,6],[dx+2,9],[dx-3,9],[dx-5,6]],'#2e3533');r(x+dx-2,y+1,5,5,'#8b9383');r(x+dx,y+2,2,2,'#d7c89b');}
  r(x-28,y-6,57,5,'#343d37');r(x-26,y-7,53,2,'#b9a073');r(x+24,y-36,3,31,'#b99861');r(x+18,y-39,9,3,'#e1c28b');
  c.save();c.translate(0,Math.round(bob));box(-22,-27,29,19,'#70473b','#ab7453','#493a32');r(x-17,y-26,3,17,'#c7a36b');r(x+1,y-26,3,17,'#c7a36b');box(-6,-40,20,12,'#63776b','#9ca88c','#3c554c');r(x+1,y-43,7,2,'#343e36');r(x+3,y-38,4,5,'#d6bb87');c.restore();
 }else if(kind==='lantern'){
  p([[-7,0],[-7,-4],[-3,-7],[-3,-46],[1,-49],[8,-49],[11,-46],[11,-39],[8,-39],[8,-44],[1,-44],[1,-7],[5,-4],[5,0]],'#35453d');r(x-2,y-42,1,35,'#8c9677');
  p([[1,-37],[5,-42],[13,-42],[18,-37],[17,-34],[16,-22],[19,-19],[0,-19],[3,-23],[3,-34]],'#403e31');
  r(x+5,y-34,9,11,'#e9ac51');r(x+6,y-33,5,8,'#ffdda0');r(x+7,y-32,2,5,'#fff1bf');r(x+12,y-34,2,13,'#856b42');r(x+2,y-37,15,3,'#b89a60');r(x+1,y-22,17,3,'#a58652');
 }else if(kind==='brazier'){
  for(const dx of[-12,9]){r(x+dx,y-10,3,13,'#3c4139');r(x+dx-2,y+2,7,2,'#687360');}
  p([[-18,-16],[-15,-7],[-9,-3],[10,-3],[16,-8],[19,-16]],'#303c37');p([[-16,-16],[-12,-20],[12,-20],[17,-16],[12,-12],[-11,-12]],'#7f8470');r(x-11,y-17,22,4,'#282d29');
  for(let i=0;i<5;i++){const dx=-12+i*6,dy=-19-Math.round((Math.sin(time*9+i*2)+1)*5);p([[dx-3,-15],[dx-3,dy],[dx,dy-6],[dx+2,dy-2],[dx+4,-16]],i%2?'#d96f39':'#f2a449');r(x+dx,y+dy,2,6,'#ffe1a0');}
  for(let i=0;i<4;i++){const f=(time*.65+i*.23)%1;r(x+Math.round(Math.sin(i+time)*11),y-24-Math.floor(f*30),2,2,f>.6?'#b87d48':'#ffe4a2');}
 }else if(kind==='steam_vent'){
  box(-14,-9,26,8,'#54675e','#91a08b','#354b46');r(x-3,y-21,9,14,'#3b514b');r(x-2,y-21,3,12,'#9ca68e');r(x-7,y-23,17,4,'#b2a47a');r(x+9,y-16,9,3,'#7c6345');r(x+15,y-21,3,12,'#b08253');
  for(let i=0;i<4;i++){const f=(time*.5+i*.24)%1,dx=Math.round(Math.sin(i+time)*6),dy=-27-Math.floor(f*32),w=4+Math.floor(f*5);c.save();c.globalAlpha*=(1-f)*.4;p([[dx-w,dy-2],[dx-w+2,dy-5],[dx+w-2,dy-5],[dx+w,dy-2],[dx+w,dy+2],[dx+w-2,dy+4],[dx-w+2,dy+4],[dx-w,dy+2]],'#d4ded0');c.restore();}
 }else if(kind==='pennants'){
  r(x-37,y-56,75,2,'#695c42');for(let i=0;i<5;i++){const dx=-32+i*14,tip=dx+6+Math.round(Math.sin(time*2+i)*2);p([[dx,-54],[dx+11,-54],[tip,-36]],i%2?'#a75e61':'#c8ab6b');r(x+dx,y-54,11,2,i%2?'#d18b80':'#e4ca88');}
 }else if(kind==='weathercock'){
  r(x-2,y-54,4,54,'#47584a');r(x-1,y-52,1,50,'#9ca27a');const shift=Math.round(Math.sin(time*.5)*3);c.save();c.translate(shift,0);p([[-18,-58],[-21,-66],[-18,-69],[-14,-64],[-12,-68],[-8,-65],[-10,-59],[-4,-55],[7,-55],[11,-60],[11,-68],[15,-72],[20,-70],[20,-65],[24,-63],[19,-61],[18,-56],[13,-52],[4,-51],[-6,-52]],'#b59757');r(x+13,y-71,6,2,'#ddc37b');r(x+16,y-68,1,1,'#3b4939');r(x-3,y-52,3,7,'#8c7548');r(x+7,y-52,3,7,'#8c7548');r(x-24,y-46,48,2,'#b4a16d');c.restore();
 }else if(kind==='newspaper'){
  const dy=Math.round(Math.sin(time*2+x));p([[-20,-9],[-4,-12],[1,-10],[20,-12],[18,1],[0,3],[-5,1],[-21,3]],'#d3c79e');r(x-17,y-8+dy,12,2,'#687564');r(x+3,y-8+dy,13,2,'#7b806b');for(let i=0;i<3;i++){r(x-17,y-4+i*2+dy,11-i,1,'#9b9a7e');r(x+3,y-4+i*2+dy,12,1,'#9b9a7e');}r(x-2,y-9,2,11,'#aea786');
 }else if(kind==='fireflies'){
  for(let i=0;i<7;i++){const dx=Math.round(Math.sin(time*.7+i*2)*25),dy=Math.round(-12+Math.cos(time*.9+i)*18);c.save();c.globalAlpha*=.4+Math.sin(time*2+i)*.3;r(x+dx-1,y+dy-1,3,3,'#9fb77b');r(x+dx,y+dy,1,1,'#eff0a0');c.restore();}
 }else return false;
 return true;
}
