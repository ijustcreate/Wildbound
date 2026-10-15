import {ITEMS,itemStats} from './items.mjs';
import {drawItem} from './item-art.mjs';
import {protectedItem} from './field-systems.mjs';
import {merchantRows,merchantAction,marlowVisual} from './traveling-merchant.mjs';
const el=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
function icon(type,size=48){const c=el('canvas','','merchant-icon');c.width=c.height=size;c.setAttribute('aria-hidden','true');drawItem(c.getContext('2d'),type,size/2,size/2,size*.82);return c;}
export function merchantPanel(panel,g,p,button,animator,controls){
 const m=g.merchant;if(!m)return;const u=p.ui,rows=merchantRows(g,p);
 if(!rows.some(row=>row.index===u.index))u.index=rows[0]?.index??0;
 const box=el('section','','merchant-ledger'),intro=el('div','','merchant-intro'),portrait=el('canvas','','merchant-portrait');
 portrait.width=96;portrait.height=96;portrait.setAttribute('aria-label','Marlow Moss, traveling merchant');
 const c=portrait.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#283f31';c.fillRect(0,0,96,96);
 animator.draw(c,{...marlowVisual(m),x:48,y:150,faceX:0,faceY:1,moving:false,step:0},0,160);
 const greeting=el('div','','merchant-greeting');greeting.append(el('small','TRAVELING MERCHANT'),el('h2',m.name||'Marlow Moss'),el('small',p.name+'’s trade','merchant-owner'),el('p','“The board takes chances. I take coins.”'));
 const gold=el('div','','merchant-gold');gold.append(el('strong',(p.coins||0).toLocaleString()),el('small','GOLD'));intro.append(portrait,greeting,gold);box.append(intro);
 const tabs=el('nav','','merchant-tabs');tabs.setAttribute('aria-label','Trade category');
 for(const [mode,label]of [['stock','Buy'],['pack','Sell'],['buyback','Buy Back']]){
  const b=button(label,'merchant-'+mode,()=>merchantAction(g,p,'panel:'+mode));b.setAttribute('aria-pressed',String(u.panel===mode));tabs.append(b);
 }box.append(tabs);
 const body=el('div','','merchant-body'),list=el('div','','merchant-list');list.setAttribute('aria-label','Items available to '+(u.panel==='pack'?'sell':u.panel==='buyback'?'buy back':'buy'));
 for(const row of rows){
  const {index,item,price}=row,def=ITEMS[item.type],b=button('','merchant-item-'+index,()=>merchantAction(g,p,'select:'+index));
  b.className='merchant-row';b.classList.toggle('selected',u.index===index);b.classList.toggle('unaffordable',u.panel!=='pack'&&(p.coins||0)<price);b.setAttribute('aria-pressed',String(u.index===index));
  const name=el('span','','merchant-row-name');name.append(el('strong',def?.name||item.type),el('small',u.panel==='stock'?'Each purchase ×'+item.qty:'Stack ×'+item.qty));
  b.append(el('span',u.index===index?'▸':'','merchant-marker'),icon(item.type),name,el('span',price+' g','merchant-price'));list.append(b);
  if(u.index===index){const summary=el('span','','merchant-inline-detail');summary.append(el('span',def?.description||itemStats(item.type)||'A useful find for the road ahead.'),el('small','In backpack: '+p.inventory.reduce((sum,i)=>sum+(i?.type===item.type?i.qty:0),0)+' · Stack ×'+item.qty));b.append(summary);}
 }
 if(!rows.length)list.append(el('p',u.panel==='buyback'?'Your sold treasures will wait here.':u.panel==='pack'?'Your backpack is empty.':'Marlow’s shelves are empty.','merchant-empty'));
 const detail=el('section','','merchant-detail'),actions=el('div','','merchant-actions'),selected=rows.find(row=>row.index===u.index);
 if(selected){
  const {item,price}=selected,def=ITEMS[item.type],owned=p.inventory.reduce((sum,i)=>sum+(i?.type===item.type?i.qty:0),0),selling=u.panel==='pack',verb=selling?'Sell':u.panel==='buyback'?'Buy back':'Buy';
  const art=el('div','','merchant-display');art.append(icon(item.type,112));detail.append(art,el('h3',def?.name||item.type),el('p',def?.description||itemStats(item.type)||'A useful find for the road ahead.','merchant-description'));
  const stats=def?.utility?'':itemStats(item.type);if(def?.description&&stats)detail.append(el('p',stats,'merchant-stats'));
  detail.append(el('p','In backpack: '+owned+' · '+(selling?'Selling':'Purchase')+' ×'+item.qty,'merchant-owned'));
  const reason=selling?(protectedItem(p,item.type)?'Unlock this item in Field Kit first.':''):(p.coins||0)<price?'You need '+(price-(p.coins||0))+' more gold.':p.inventory.length>=24&&!p.inventory.some(i=>!i)?'Make one free backpack slot.':'';
  const action=button(verb+' · '+price+' gold','merchant-confirm',()=>merchantAction(g,p,'use'));action.className='merchant-confirm';action.disabled=!!reason;
  actions.append(action);if(reason)actions.append(el('p',reason,'merchant-reason'));
 }else detail.append(el('h3','A little room for adventure'),el('p','Choose an item to inspect it before you trade.'));
 body.append(list,detail);box.append(body,actions);
 const notice=el('p',u.notice||'Select an item, then confirm your trade.','merchant-status'+(u.notice?'':' is-idle'));notice.setAttribute('role','status');box.append(notice);
 const verb=u.panel==='pack'?'Sell':u.panel==='buyback'?'Buy back':'Buy';
 box.append(el('footer',`${controls.select}: select · ${controls.tabs}: tabs · ${controls.accept}: ${verb} · ${controls.close}: close`,'merchant-controls'));
 panel.append(box);
 if(u.tradeSerial&&panel.merchantTradeSerial!==u.tradeSerial)box.querySelector('.merchant-confirm')?.animate([{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:160});
 panel.merchantTradeSerial=u.tradeSerial;
}
