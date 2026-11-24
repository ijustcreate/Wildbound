const games=new WeakMap();
function records(g){let value=games.get(g);if(!value){value=new Map();games.set(g,value);}return value;}
export function actionFeedback(g,p,{key,text,quantity=0,kind='success'}){
  if(!p||!text)return;
  const time=g.time||0,all=records(g),list=(all.get(p.id)||[]).filter(item=>time-item.at<2.8);
  const prior=list.find(item=>item.key===key&&time-item.at<.65);
  if(prior){prior.quantity+=quantity;prior.at=time;prior.text=text;prior.kind=kind;list.splice(list.indexOf(prior),1);list.unshift(prior);}
  else list.unshift({key,text,quantity,kind,at:time});
  list.length=Math.min(list.length,3);all.set(p.id,list);
  if(p.ui&&kind==='failure')p.ui.notice=text;
}
export function playerFeedback(g,p){return (records(g).get(p.id)||[]).filter(item=>(g.time||0)-item.at<2.8);}
export function drawActionFeedback(c,g,camera,w,h,owners=null){
  c.save();c.font='bold 12px monospace';c.textAlign='center';c.textBaseline='middle';
  for(const p of g.players||[]){
    if(p.room||owners&&!owners.includes(p.id))continue;
    const x=(p.x-camera.x)*camera.zoom+w/2,feet=(p.y-camera.y)*camera.zoom+h/2;
    if(x<0||x>w||feet<-60||feet>h+60)continue;
    const list=playerFeedback(g,p);
    // Follow the rendered head height as the camera zooms. A fixed screen
    // offset covered the explorer's face in close views.
    const above=feet-60*camera.zoom,below=above<20+list.length*25;
    list.forEach((item,index)=>{
      const label=(g.players.length>1?p.name+' · ':'')+item.text+(item.quantity?' +'+item.quantity:'');
      const width=Math.min(w-16,c.measureText(label).width+16),cx=Math.max(width/2+8,Math.min(w-width/2-8,x)),cy=Math.max(14,Math.min(h-14,below?feet+24+index*25:above-index*25));
      c.globalAlpha=Math.min(1,(2.8-(g.time-item.at))*2);
      c.fillStyle='#11251ff0';c.fillRect(cx-width/2,cy-11,width,22);
      c.fillStyle=item.kind==='failure'?'#ffd3a6':'#eff0cc';c.fillText(label,cx,cy,width-12);
    });
  }
  c.restore();
}
