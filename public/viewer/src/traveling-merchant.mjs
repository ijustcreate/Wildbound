import {ITEMS,sellValue} from './items.mjs';
import {protectedItem} from './field-systems.mjs';
import {drawTorchFlame} from './torch-flame.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
export function merchantSites(g){
 const queue=[[25,25]],seen=new Set(['25:25']),sites=[];
 for(let i=0;i<queue.length;i++){const [tx,ty]=queue[i],x=tx*32+16,y=ty*32+16;
  if(Math.hypot(x-800,y-800)>230&&!g.blocked(x,y,24,false,false,false,0)&&!g.blocked(x+48,y+12,22,false,false,false,0)&&!g.blocked(x-32,y+8,12,false,false,false,0))sites.push({x,y});
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=tx+dx,ny=ty+dy,key=nx+':'+ny;if(nx<2||ny<2||nx>47||ny>47||seen.has(key))continue;seen.add(key);const px=nx*32+16,py=ny*32+16;
   // The table itself occupies the seed cell; exit its immediate area first.
   if(Math.hypot(px-800,py-800)<110||!g.blocked(px,py,8,false,false,true,0))queue.push([nx,ny]);
  }
 }return sites;
}
export function spawnMerchant(g){
 if(g.merchant)return true;
 const sites=merchantSites(g),site=sites[Math.min(sites.length-1,Math.floor(g.random()*sites.length))];
 if(site){const {x,y}=site;
  g.merchant={x,y,campX:x,campY:y,faceX:0,faceY:1,step:0,name:'Marlow Moss',stock:[{item:{type:'critter_net',qty:1},price:24},{item:{type:'empty_jar',qty:1},price:4},{item:{type:'critter_cage',qty:1},price:8}],horse:{x:x+48,y:y+12,faceX:-1,faceY:0,step:0},revision:0};
  g.message('Marlow Moss has made camp. “The board takes chances. I take coins.”');return true;
 }return false;
}
export function tickMerchant(g,dt){
 const m=g.merchant;if(!m||g.phase!=='play')return;
 m.campX??=m.x;m.campY??=m.y;
 const trade=g.players.some(p=>p.ui?.shop==='merchant'||(!p.room&&p.hp>0&&Math.hypot(p.x-m.x,p.y-m.y)<70));
 const walk=(a,x,y,speed,radius)=>{const dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy);a.moving=false;if(d<3)return;const step=Math.min(d,speed*dt),mx=dx/d*step,my=dy/d*step,ox=a.x,oy=a.y;if(!g.blocked(a.x+mx,a.y,radius,false,false,false,0))a.x+=mx;if(!g.blocked(a.x,a.y+my,radius,false,false,false,0))a.y+=my;const moved=Math.hypot(a.x-ox,a.y-oy);if(moved>.001){a.faceX=dx/d;a.faceY=dy/d;a.step=(a.step||0)+moved*.19;a.moving=true;}};
 if(!trade){const t=(g.time||0)*.13;walk(m,m.campX+Math.sin(t)*28,m.campY+Math.cos(t)*20,10,8);}else m.moving=false;
 const h=m.horse;if(h){const gap=Math.hypot(h.x-m.x,h.y-m.y);if(gap>44)walk(h,m.x-(m.faceX||1)*35,m.y-(m.faceY||0)*35,25,14);else h.moving=false;}
}
export function openMerchant(g,p){const m=g.merchant;if(!m||p.room||Math.hypot(p.x-m.x,p.y-m.y)>65)return false;p.ui={shop:'merchant',panel:'stock',index:0,page:0,notice:'“Mind the horse. She counts your change.”'};return true;}
export function merchantAction(g,p,action){
 const u=p.ui;if(u?.shop!=='merchant')return false;const m=g.merchant;
 if(!m||action==='close'||p.room||Math.hypot(p.x-m.x,p.y-m.y)>100){p.ui=null;return true;}
 const list=u.panel==='pack'?p.inventory:m.stock;
 if(action.startsWith('panel:')||action==='tab'||action==='panel'||action==='panelNext'||action==='panelPrev'){u.panel=action.startsWith('panel:')?action.slice(6):u.panel==='pack'?'stock':'pack';u.index=0;u.page=0;}
 else if(action.startsWith('select:')){const n=Number(action.slice(7));if(Number.isInteger(n)&&n>=0&&n<Math.max(1,list.length))u.index=n;}
 else if(action==='pageNext'||action==='pagePrev'){const pages=Math.max(1,Math.ceil(list.length/8));u.page=((u.page||0)+(action==='pageNext'?1:-1)+pages)%pages;u.index=u.page*8;}
 else if(['next','prev','up','down'].includes(action)){const step=action==='next'?1:action==='prev'?-1:action==='down'?2:-2;u.index=Math.max(0,Math.min(Math.max(0,list.length-1),u.index+step));u.page=Math.floor(u.index/8);}
 else if(action==='use'){
  if(u.panel==='pack'){
   const item=p.inventory[u.index];if(!item)return true;
   if(protectedItem(p,item.type)){u.notice='Unlock this item in Field Kit first.';return true;}
   const price=sellValue(item.type)*item.qty;m.stock.push({item:structuredClone(item),price,seller:p.profileId||p.id});p.inventory[u.index]=null;p.coins=(p.coins||0)+price;u.notice=`Sold for ${price} gold. Buy it back for exactly ${price}.`;
  }else{
   const entry=m.stock[u.index];if(!entry)return true;
   if(entry.seller&&entry.seller!==(p.profileId||p.id)){u.notice='Reserved for its original owner.';return true;}
   if((p.coins||0)<entry.price){u.notice='Not enough gold.';return true;}
   const slot=p.inventory.findIndex(i=>!i);if(slot<0&&p.inventory.length>=24){u.notice='Make one free backpack slot.';return true;}
   if(slot<0)p.inventory.push(structuredClone(entry.item));else p.inventory[slot]=structuredClone(entry.item);
   p.coins-=entry.price;if(entry.seller)m.stock.splice(u.index,1);u.index=Math.min(u.index,Math.max(0,m.stock.length-1));u.page=Math.floor(u.index/8);u.notice='“A fine trade. Try not to get eaten.”';
  }m.revision++;g.uiRevision=(g.uiRevision||0)+1;g.persist?.();
 }return true;
}
export function merchantPanel(panel,g,p,button){
 const m=g.merchant;if(!m)return;const u=p.ui,el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text||'';if(cls)e.className=cls;return e;};
 const box=el('section','', 'merchant-workshop');box.append(el('h2','Marlow Moss'),el('p','“Six roads, no refunds. Except yours—I kept the receipt.”'));
 const tabs=el('div');for(const [key,title]of [['stock','Buy / buy back'],['pack','Sell from backpack']]){const b=button(title,'merchant-'+key,()=>{merchantAction(g,p,'panel:'+key);});b.classList.toggle('selected',u.panel===key);tabs.append(b);}box.append(tabs);
 const list=u.panel==='pack'?p.inventory:m.stock,start=(u.page||0)*8,grid=el('div','','merchant-grid');
 for(let n=start;n<start+8;n++){const entry=list[n],item=u.panel==='pack'?entry:entry?.item,price=item?(u.panel==='pack'?sellValue(item.type)*item.qty:entry.price):0;const b=button(item?`${ITEMS[item.type]?.name||item.type} ×${item.qty} · ${price} gold${entry?.seller?' · Buy back':''}`:'—','merchant-item-'+n,()=>{u.index=n;merchantAction(g,p,'use');});b.disabled=!item;b.classList.toggle('selected',u.index===n);grid.append(b);}box.append(grid);
 const pages=el('div','','merchant-pages');pages.append(button('‹ Previous','merchant-prev',()=>merchantAction(g,p,'pagePrev')),el('span',`${(u.page||0)+1} / ${Math.max(1,Math.ceil(list.length/8))}`),button('Next ›','merchant-next',()=>merchantAction(g,p,'pageNext')));box.append(pages,el('p',u.notice||'','merchant-notice'),el('small','D-pad: select · LB/RB: buy / sell · A: trade · B: close'));panel.append(box);
}
export function drawMerchant(c,g,animator){const m=g.merchant;if(!m)return;
 animator.draw(c,{...m,hp:100,equipment:{},appearance:{...DEFAULT_APPEARANCE,skin:'#c29b73',shirt:'#647c54',pants:'#51493b',hairColor:'#5b4632'}},g.time,43);
 c.save();c.translate(m.x,m.y);c.fillStyle='#c5ac66';c.fillRect(-13,-37,26,3);c.fillStyle='#e1c47a';c.fillRect(-8,-44,16,7);c.fillStyle='#6e643e';c.fillRect(-8,-38,16,2);
 c.restore();c.save();c.translate((m.campX??m.x)-32,(m.campY??m.y)+5);c.fillStyle='#644730';c.fillRect(-9,5,20,4);c.fillRect(-3,0,5,12);drawTorchFlame(c,0,0,g.time,m.x);c.restore();
 if(m.horse)drawPackHorse(c,m.horse,g.time);
 c.save();c.textAlign='center';c.font='9px sans-serif';c.fillStyle='#f1e1b9';c.fillText('Marlow Moss · Trade E / Y',m.x,m.y+33);c.restore();
}
export function drawPackHorse(c,h,time){
 c.save();c.translate(Math.round(h.x),Math.round(h.y));const side=Math.abs(h.faceX||0)>.45,sign=(h.faceX||0)<0?-1:1;c.scale(sign,1);
 const r=(x,y,w,hh,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,hh);};
 c.fillStyle='#172a2355';c.beginPath();c.ellipse(0,4,side?25:15,7,0,0,7);c.fill();
 const stride=h.moving?Math.sin(h.step||0)*5:0,bob=h.moving?Math.abs(Math.sin(h.step||0)):Math.sin(time*1.7)*.4;
 for(const [x,phase]of [[-13,1],[10,-1]]){r(side?x:-8,-4+stride*phase,4,14,'#594837');r(side?x+3:6,-4-stride*phase,4,14,'#80664b');r(side?x:-8,8+stride*phase,5,3,'#302c26');}
 r(side?-19:-12,-23-bob,side?38:24,24,'#927354');r(side?-16:-10,-24-bob,side?31:20,5,'#b6996b');r(side?12:-6,-37-bob,10,25,'#91704c');r(side?16:-8,-39-bob,side?16:16,14,'#ab895d');r(side?24:-6,-29-bob,side?10:13,6,'#d2bd8c');r(side?19:-7,-46-bob,3,8,'#7b603f');r(side?27:5,-45-bob,3,7,'#7b603f');r(side?24:-4,-35-bob,2,2,'#1b2924');if(!side)r(5,-35-bob,2,2,'#1b2924');r(side?11:-9,-37,3,20,'#3e372d');r(side?-23:-2,-21,3,20,'#46392c');
 for(const x of side?[-15,2]:[-15,5]){r(x,-19-bob,13,19,'#62573b');r(x+1,-18-bob,11,14,'#b1a178');r(x+2,-17-bob,9,4,'#d0bc8a');r(x+5,-12-bob,2,4,'#695b3f');r(x+5,-10-bob,2,1,'#ecda99');}
 c.restore();
}
