import { drawRobotPortrait } from "./robot-art.mjs";
import { ITEMS, sellValue } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
import { controllerButtonNames } from "./controls.mjs";
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
export function shopPanel(panel, game, p, button) {
  const owner = game.shopOwner(p),
    u = p.ui;
  if (u.shop === "robot") {
    const purchased=u.robotView==='stock', list=purchased?(owner.robotStock||[]):p.inventory;
    panel.classList.add('scrap-shop');
    const intro=node('div',null,'robot-intro'),portrait=node('canvas',null,'robot-portrait');
    portrait.width=96;portrait.height=80;portrait.setAttribute('aria-label','SCRAP-9 portrait');drawRobotPortrait(portrait,game.time);
    const greeting=node('div');greeting.append(node('strong','SCRAP-9'),node('p','Scrap in. Gold out. Select a stack, then confirm the sale.'));intro.append(portrait,greeting);panel.append(intro);
    const tabs=node('nav',null,'scrap-tabs');
    for(const [label,view]of [['Sell items','sell'],['Purchased items','stock']]){
      const b=button(label,'robot-view-'+view,()=>game.inventoryAction(p,'robotView:'+view));b.classList.toggle('selected',(u.robotView||'sell')===view);tabs.append(b);
    }panel.append(tabs);
    const perPage=8,pages=Math.max(1,Math.ceil(list.length/perPage)),page=Math.min(pages-1,purchased?(u.robotStockPage||0):Math.floor(u.index/perPage));
    const grid=node('div',null,'scrap-item-list');
    for(let i=page*perPage;i<Math.min(list.length,(page+1)*perPage);i++){
      const item=list[i];if(!item)continue;
      const b=purchased?node('div',null,'scrap-item-row'):button('','item'+i,()=>{u.index=i;game.uiRevision=(game.uiRevision||0)+1;});b.classList.add('scrap-item-row');
      b.dataset.index=i;b.classList.toggle('selected',!purchased&&u.index===i);
      const c=icon(item.type);c.width=c.height=48;drawItem(c.getContext('2d'),item.type,24,24,42);
      const text=node('span',null,'scrap-item-copy'),name=node('strong',ITEMS[item.type]?.name||item.type);
      text.append(name,node('span','Stack ×'+item.qty),node('b',sellValue(item.type)*item.qty+' gold'+(purchased?' paid':' total'),'scrap-price'));
      b.append(c,text);grid.append(b);
    }
    if(!grid.children.length)grid.append(node('p',purchased?'Nothing purchased yet. Your sold items appear here.':'No items on this page.','scrap-empty'));panel.append(grid);
    const pager=node('nav',null,'scrap-pager');
    const setPage=next=>{if(purchased)u.robotStockPage=next;else u.index=next*perPage;game.uiRevision=(game.uiRevision||0)+1;};
    const prev=button('Previous','robot-prev',()=>setPage(page-1)),next=button('Next','robot-next',()=>setPage(page+1));prev.disabled=page===0;next.disabled=page>=pages-1;
    pager.append(prev,node('span','Page '+(page+1)+' / '+pages),next);panel.append(pager);
    const item=p.inventory[u.index],actions=node('footer',null,'scrap-sale-actions');
    if(!purchased){
      actions.append(node('p',item?(ITEMS[item.type]?.name||item.type)+' · '+sellValue(item.type)+' gold each':'Select a stack to sell.','sale-detail'));
      const sell=button(item?'Sell stack · '+sellValue(item.type)*item.qty+' gold':'Sell stack','use',()=>game.inventoryAction(p,'use'));sell.disabled=!item;
      const split=button('Split stack','split',()=>game.inventoryAction(p,'split'));split.disabled=!(item?.qty>1);actions.append(sell,split);
    }else actions.append(node('p','Purchased items are a sales record, not a buyback shop.'));
    panel.append(actions,node('p',u.notice||'Sales transfer the whole selected stack to SCRAP-9.','storage-notice'));
    if(u.split){const pop=node('div',null,'scrap-split');const amount=node('input');amount.type='number';amount.min=1;amount.max=Math.max(1,(item?.qty||1)-1);amount.value=u.split.amount;amount.oninput=()=>u.split.amount=Math.max(1,Math.min(Number(amount.max),Number(amount.value)||1));
      pop.append(node('strong','Split stack'),amount,button('Confirm split','split-confirm',()=>game.inventoryAction(p,'use')),button('Cancel','split-cancel',()=>game.inventoryAction(p,'close')));panel.append(pop);}
  } else {
    panel.classList.add('vending-refresh');
    panel.append(node("h3", "BETWEEN-MART · Potion dispenser"));
    const catalog=node('div',null,'vending-catalog');
    const machine = node("div", null, "vending-machine"),
      canvas = node("canvas");
    canvas.className = "vending-canvas";
    canvas.width = 360;
    canvas.height = 520;
    machine.append(canvas);
    const slots = node("div", null, "vending-slots");
    owner.vendingStock.forEach((item, i) => {
      const b = button(
        '',
        "vend-" + i,
        () => game.purchaseVending(p, i),
      );
      b.append(icon(item.type),node('strong',ITEMS[item.type].name,'vending-item-name'),node('span',item.price+' gold','vending-price'),node('small',item.qty?'Stock: '+item.qty:'Sold out','vending-stock'));
      b.classList.toggle("selected", u.index === i);
      b.disabled = !item.qty||(p.coins||0)<item.price;
      b.title = "Buy " + ITEMS[item.type].name;
      slots.append(b);
    });
    catalog.append(machine,slots);
    const tray = node("div", null, "vending-tray");
    const orders = (p.vendingOrders || []).filter(
      (o) => o.owner === (owner.profileId || owner.id),
    );
    for (const order of orders.filter((o) => o.ready)) {
      const b = button("Collect", "collect-" + order.id, () =>
        game.collectVending(p, order.id),
      );
      b.prepend(icon(order.type));
      b.title = "Collect " + ITEMS[order.type].name;
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
    panel.append(
      catalog,
      tray,
      node(
        "p",
        u.notice ||
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
        if (p.device === 'keyboard') return u.shop === "robot" ? "Arrows: select · Enter: sell · 2: split · Tab: switch view · Esc: room" : "Arrows: select slot · Enter: buy · 2: collect tray · Esc: room";
        const n = controllerButtonNames(p.controllerFamily || 'generic');
        return u.shop === "robot" ? `D-pad: select · ${n[0]}: sell · ${n[3]}: split · LB / RB: switch view · ${n[1]}: room` : `D-pad: select slot · ${n[0]}: buy · ${n[3]}: collect tray · ${n[1]}: room`;
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
  c.fillStyle = "#503d60";
  c.fillRect(0, 0, 360, 520);
  c.fillStyle = "#9b7da5";
  c.fillRect(5, 5, 350, 7);
  c.fillStyle = "#e0c984";
  c.font = "bold 18px monospace";
  c.textAlign = "center";
  c.fillText("BETWEEN-MART", 180, 36);
  c.fillStyle = "#111e28";
  c.fillRect(15, 51, 288, 351);
  c.fillStyle = "#253c42";
  c.fillRect(20, 56, 278, 341);
  const orders = (p.vendingOrders || []).filter(
    (o) => o.owner === (owner.profileId || owner.id),
  );
  owner.vendingStock.forEach((item, i) => {
    const x = 65 + (i % 3) * 92,
      y = 90 + Math.floor(i / 3) * 83;
    const order = orders.find((o) => o.slot === i && !o.ready);
    const t = order?.elapsed || 0;
    c.fillStyle = "#14252b";
    c.fillRect(x - 40, y - 28, 80, 78);
    c.fillStyle = "#6c7b78";
    c.fillRect(x - 40, y + 44, 80, 3);
    c.strokeStyle = "#aeb8ba";
    c.lineWidth = 2;
    c.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 6 + Math.min(1, t / 0.55) * Math.PI * 2,
        xx = x - 28 + (k / 48) * 56,
        yy = y + 8 + Math.sin(a) * 8;
      if (k === 0) c.moveTo(xx, yy);
      else c.lineTo(xx, yy);
    }
    c.stroke();
    if (item.qty > 0) drawItem(c, item.type, x, y, 30);
  });
  c.fillStyle = "#141e24";
  c.fillRect(312, 62, 33, 213);
  c.fillStyle = "#87d1bb";
  c.fillRect(317, 70, 23, 24);
  c.fillStyle = "#e3d599";
  c.font = "8px monospace";
  c.fillText("GOLD", 328, 113);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = "#a6aba8";
    c.fillRect(318 + (i % 2) * 13, 133 + Math.floor(i / 2) * 17, 8, 9);
  }
  c.fillStyle = "#10181e";
  c.fillRect(21, 426, 316, 75);
  c.fillStyle = "#8d7694";
  c.fillRect(21, 423, 316, 5);
  c.fillStyle = "#d2c2a4";
  c.font = "10px monospace";
  c.fillText("TAKE YOUR PURCHASE BELOW", 180, 418);
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
