import {drawVendingCabinet} from './vending-art.mjs';
import { drawRobotPortrait } from "./robot-art.mjs";
import { BACKPACK_SLOTS, ITEMS, sellValue } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
import { controllerButtonNames } from "./controls.mjs";
import {ROBOT_COLUMNS,robotBuybackIndices,robotBuying} from './robot-shop.mjs';
import {ensureVendingStock} from './shops.mjs';
const node = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
function icon(type) {
  const c = node("canvas");
  c.width = c.height = 24;
  c.className = "item-icon";
  drawItem(c.getContext("2d"), type, 12, 12, 24);
  return c;
}
export function shopPanel(panel, game, p, button,tooltip) {
  const owner = game.shopOwner(p),
    u = p.ui;
  if (u.shop === "robot") {
    const purchased=robotBuying(u),indices=robotBuybackIndices(owner);
    // Another player can buy from the same robot while this panel remains open.
    if(purchased&&!indices.includes(u.robotIndex))u.robotIndex=indices[0]??0;
    panel.classList.add('scrap-shop');
    const intro=node('div',null,'robot-intro'),portrait=node('canvas',null,'robot-portrait');
    portrait.width=96;portrait.height=80;portrait.setAttribute('aria-label','SCRAP-9 portrait');drawRobotPortrait(portrait,game.time);
    const greeting=node('div');greeting.append(node('strong','SCRAP-9'),node('p','Sell your finds. Buy them back for the same gold.'));intro.append(portrait,greeting);panel.append(intro);
    const page=Math.floor(Math.max(0,indices.indexOf(u.robotIndex))/ROBOT_COLUMNS),pages=Math.max(1,Math.ceil(indices.length/ROBOT_COLUMNS));
    const slot=(view,index,item,selected)=>{
      const def=ITEMS[item?.type],b=button('','robot-'+view+'-'+index,()=>game.inventoryAction(p,'robotSelect:'+view+':'+index));
      b.className='robot-item-slot';b.dataset.index=index;b.dataset.view=view;b.classList.toggle('selected',selected);b.classList.toggle('empty-slot',!item);
      b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',(view==='sell'?'Backpack':'Buyback')+' slot '+(index+1)+': '+(def?.name||'Empty')+(item?' ×'+item.qty+' · '+sellValue(item.type)*item.qty+' gold':''));
      if(item){const c=icon(item.type);c.width=c.height=48;drawItem(c.getContext('2d'),item.type,24,24,42);b.append(c);if(item.qty>1)b.append(node('span',String(item.qty),'inventory-quantity'));b.style.setProperty('--rarity',def?.color||'#82917b');b.dataset.mode='shop';b.dataset.tooltipExtra='Stack ×'+item.qty+' · '+sellValue(item.type)*item.qty+' gold '+(view==='sell'?'to sell':'to buy back');if(tooltip)tooltip(b,item);else b.title=def?.name||item.type;}
      return b;
    };
    const buyback=node('section',null,'robot-buyback'),buybackHead=node('header');
    const chooseBuyback=button('Buyback · '+indices.length,'robot-view-buyback',()=>game.inventoryAction(p,'robotView:buyback'));chooseBuyback.setAttribute('aria-pressed',String(purchased));buybackHead.append(chooseBuyback);
    if(pages>1){const pager=node('nav',null,'robot-buyback-pager');for(const [label,direction]of [['‹','prev'],['›','next']]){const b=button(label,'robot-page-'+direction,()=>game.inventoryAction(p,'robotPage:'+direction));b.setAttribute('aria-label',direction+' buyback page');pager.append(b);}pager.prepend(node('span',(page+1)+' / '+pages));buybackHead.append(pager);}
    buyback.append(buybackHead);const strip=node('div',null,'robot-buyback-slots');
    for(let n=0;n<ROBOT_COLUMNS;n++){const index=indices[page*ROBOT_COLUMNS+n],item=owner.robotStock[index];const b=slot('buyback',index??-1,item,purchased&&(u.robotIndex===index||!indices.length&&n===0));b.disabled=!item;strip.append(b);}buyback.append(strip);panel.append(buyback);
    const backpack=node('section',null,'robot-backpack'),packHead=button('Your backpack','robot-view-sell',()=>game.inventoryAction(p,'robotView:sell'));packHead.append(node('span',p.inventory.filter(Boolean).length+' / '+BACKPACK_SLOTS));packHead.setAttribute('aria-pressed',String(!purchased));backpack.append(packHead);
    const grid=node('div',null,'robot-backpack-slots');grid.style.setProperty('--robot-columns',ROBOT_COLUMNS);for(let i=0;i<BACKPACK_SLOTS;i++)grid.append(slot('sell',i,p.inventory[i],!purchased&&u.index===i));backpack.append(grid);panel.append(backpack);
    const item=purchased?owner.robotStock[u.robotIndex]:p.inventory[u.index],price=item?sellValue(item.type)*item.qty:0;
    const actions=node('footer',null,'robot-actions'),n=controllerButtonNames(p.controllerFamily||'generic'),accept=p.device==='keyboard'?'Enter':n[0],splitKey=p.device==='keyboard'?'2':n[3];
    const sell=button((!purchased?accept+' · ':'')+'Sell'+(!purchased&&item?' · '+price+'g':''),'robotSell',()=>game.inventoryAction(p,'robotSell'));sell.disabled=purchased||!item||p.field?.favorites?.includes(item.type);
    const back=button((purchased?accept+' · ':'')+'Buy back'+(purchased&&item?' · '+price+'g':''),'robotBuyback',()=>game.inventoryAction(p,'robotBuyback'));back.disabled=!purchased||!item||(p.coins||0)<price;
    const split=button(splitKey+' · Split','split',()=>game.inventoryAction(p,'split'));split.disabled=purchased||!(item?.qty>1);actions.append(sell,back,split);panel.append(actions,node('p',u.notice||(item?(ITEMS[item.type]?.name||item.type)+' · '+(purchased?'Buy back':'Sell stack')+' for '+price+' gold.':'Select an item. Sold items stay in buyback.'),'storage-notice'));
    if(u.split){const pop=node('div',null,'scrap-split');const amount=node('input');amount.type='number';amount.min=1;amount.max=Math.max(1,(item?.qty||1)-1);amount.value=u.split.amount;amount.oninput=()=>u.split.amount=Math.max(1,Math.min(Number(amount.max),Number(amount.value)||1));
      pop.append(node('strong','Split stack'),amount,button('Confirm split','split-confirm',()=>game.inventoryAction(p,'use')),button('Cancel','split-cancel',()=>game.inventoryAction(p,'close')));panel.append(pop);}
  } else {
    panel.classList.add('vending-refresh');
    panel.querySelector('header').textContent='BETWEEN-MART';
    const catalog=node('div',null,'vending-catalog');
    const machine = node("div", null, "vending-machine"),
      canvas = node("canvas");
    canvas.className = "vending-canvas";
    canvas.width = 360;
    canvas.height = 520;
    machine.append(canvas);
    const slots = node("div", null, "vending-slots");
    ensureVendingStock(owner).forEach((item, i) => {
      const b = button(
        '',
        "vend-" + i,
        () => game.purchaseVending(p, i),
      );
      b.append(icon(item.type),node('strong',ITEMS[item.type].name+(item.bundle>1?' ×'+item.bundle:''),'vending-item-name'),node('span',item.price+' gold','vending-price'),node('small',item.qty?'Stock: '+item.qty:'Sold out','vending-stock'));
      b.classList.toggle("selected", (!u.vendingView||u.vendingView==='catalog') && u.index === i);
      b.setAttribute('aria-disabled',String(!item.qty||(p.coins||0)<item.price));
      b.setAttribute('aria-label',ITEMS[item.type].name+' · '+item.price+' gold · '+item.qty+' in stock');
      b.dataset.mode='shop';b.dataset.tooltipExtra=(item.bundle||1)+' per purchase · '+item.price+' gold · '+item.qty+' in stock';
      tooltip?.(b,{type:item.type,qty:item.bundle||1});
      slots.append(b);
    });
    const display=node('div',null,'vending-display');display.append(machine);catalog.append(display,slots);
    const tray = node("div", null, "vending-tray");
    const orders = (p.vendingOrders || []).filter(
      (o) => o.owner === (owner.profileId || owner.id),
    );
    for (const order of orders.filter((o) => o.ready)) {
      const b = button("Collect", "collect-" + order.id, () =>
        game.collectVending(p, order.id),
      );
      b.prepend(icon(order.type));b.dataset.mode='shop';tooltip?.(b,{type:order.type,qty:order.qty});
      b.classList.toggle('selected',u.vendingView==='tray'&&u.vendingOrderId===order.id);
      b.setAttribute('aria-pressed',String(u.vendingView==='tray'&&u.vendingOrderId===order.id));
      b.setAttribute('aria-label','Collect '+ITEMS[order.type].name+(order.qty>1?' ×'+order.qty:''));
      b.title = "Collect " + ITEMS[order.type].name + (order.qty>1?" ×"+order.qty:"");
      tray.append(b);
    }
    if (!orders.some((o) => o.ready))
      tray.append(
        node("span", orders.length ? "Dispensing…" : "COLLECTION TRAY"),
      );
    const falling = node("canvas", null, "vending-falling");
    falling.width = 360;
    falling.height = 520;
    machine.append(falling);
    display.append(tray);
    const collectAll=button('Collect all','vending-collect-all',()=>game.inventoryAction(p,'collectAll'));
    collectAll.className='vending-collect-all';collectAll.classList.toggle('selected',u.vendingView==='collectAll');
    collectAll.setAttribute('aria-disabled',String(!orders.some(o=>o.ready)));
    panel.append(
      catalog,
      collectAll,
      node(
        "p",
        (u.notice?.startsWith('Dispensing')&&orders.some(o=>o.ready)?'Ready to collect. Move down to the tray or use quick collect.':u.notice) ||
          "Select a slot, then collect the falling item from the tray.",
        "storage-notice",
      ),
    );
    drawVending(canvas, game, p);
  }
  panel.append(
    node(
      "small",
      (() => {
        if (p.device === 'keyboard') return u.shop === "robot" ? "Arrows: select · Enter: confirm · 2: split · Tab: backpack / buyback · Esc: room" : "Arrows: select · Down from bottom row: tray · Enter: buy / collect · 2: quick collect · Esc: room";
        const n = controllerButtonNames(p.controllerFamily || 'generic');
        return u.shop === "robot" ? `D-pad: select · ${n[0]}: confirm · ${n[3]}: split · LB / RB: backpack / buyback · ${n[1]}: room` : `D-pad: select · ↓ from bottom row: tray · ${n[0]}: buy / collect · ${n[3]}: quick collect · ${n[1]}: room`;
      })(),
    ),
  );
}
export function drawVending(canvas, game, p) {
  if (!canvas) return;
  const c = canvas.getContext("2d"),
    owner = game.shopOwner(p);
  if (!owner) return;
  c.imageSmoothingEnabled = false;
  c.clearRect(0,0,360,520);
  drawVendingCabinet(c,ensureVendingStock(owner),game.time);
  const orders=(p.vendingOrders||[]).filter(o=>o.owner===(owner.profileId||owner.id));
  drawFalling(canvas, orders);
}

function drawFalling(canvas, orders) {
  const overlay = canvas.parentElement?.querySelector(".vending-falling");
  if (!overlay) return;
  const c = overlay.getContext("2d");
  c.clearRect(0, 0, 360, 520);
  c.imageSmoothingEnabled = false;
  for (const order of orders) {
    if (order.ready) continue;
    const t = order.elapsed,
      fall = Math.max(0, (t - 0.55) / 1.05),
      x = 65 + (order.slot % 3) * 92,
      y = 90 + Math.floor(order.slot / 3) * 83;
    drawItem(
      c,
      order.type,
      x + (155 - x) * fall,
      y + (466 - y) * fall * fall,
      30,
    );
  }
}
