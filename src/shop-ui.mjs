import { drawRobotPortrait } from "./robot-art.mjs";
import { ITEMS, sellValue } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
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
    const intro = node("div", null, "robot-intro"),
      portrait = node("canvas", null, "robot-portrait");
    portrait.width = 96;
    portrait.height = 80;
    portrait.setAttribute(
      "aria-label",
      "Portrait of SCRAP-9, the robot merchant",
    );
    drawRobotPortrait(portrait, game.time);
    const greeting = node("div");
    greeting.append(
      node("strong", "SCRAP-9"),
      node(
        "p",
        "Salvage accepted. Gold delivered. Select an item below to sell.",
      ),
    );
    intro.append(portrait, greeting);
    panel.append(intro);
    const layout = node("div", null, "storage-layout robot-trade");
    const bag = node("section", null, "storage-sheet inventory-window"),
      stock = node("section", null, "storage-sheet robot-stock");
    bag.append(node("header", "Your backpack"));
    stock.append(node("header", "SCRAP-9 · Purchased items"));
    const grid = node("div", null, "item-grid"),
      goods = node("div", null, "item-grid");
    const detail = node("p", null, "sale-detail");
    let selected = u.index;
    const sell = button("Sell", "use", () => {
      u.index = selected;
      game.inventoryAction(p, "use");
    });
    function highlight(i) {
      selected = i;
      const item = p.inventory[i];
      detail.textContent = item
        ? ITEMS[item.type].name +
          " ×" +
          item.qty +
          " · " +
          sellValue(item.type) +
          " gold each · " +
          sellValue(item.type) * item.qty +
          " gold total"
        : "Select an item to sell.";
      sell.disabled = !item;
      sell.textContent = item
        ? "Sell for " + sellValue(item.type) * item.qty + " gold"
        : "Sell";
      grid
        .querySelectorAll("button")
        .forEach((b, n) => b.classList.toggle("selected", n === i));
    }
    for (let i = 0; i < 24; i++) {
      const item = p.inventory[i];
      const b = button(
        item ? ITEMS[item.type].name + " ×" + item.qty : "—",
        "item" + i,
        () => {
          u.index = i;
          highlight(i);
        },
      );
      if (item) {
        b.prepend(icon(item.type));
        b.title =
          "Sell " +
          item.qty +
          " for " +
          sellValue(item.type) * item.qty +
          " gold";
        b.onpointerenter = () => highlight(i);
        b.onfocus = () => highlight(i);
      }
      grid.append(b);
    }
    for (const item of owner.robotStock || []) {
      const tile = node(
        "div",
        ITEMS[item.type].name + " ×" + item.qty,
        "merchant-item",
      );
      tile.prepend(icon(item.type));
      goods.append(tile);
    }
    if (!owner.robotStock?.length)
      goods.append(node("p", "Items you sell appear here."));
    bag.append(
      grid,
      detail,
      sell,
      button("Split stack", "split", () => {
        u.index = selected;
        game.inventoryAction(p, "split");
      }),
    );
    stock.append(goods);
    layout.append(bag, stock);
    panel.append(
      layout,
      node(
        "p",
        u.notice ||
          "Hover or select an item to see its sell price. Sales transfer the selected stack to SCRAP-9.",
        "storage-notice",
      ),
    );
    highlight(selected);
  } else {
    panel.append(node("h3", "BETWEEN-MART · Potion dispenser"));
    const machine = node("div", null, "vending-machine"),
      canvas = node("canvas");
    canvas.className = "vending-canvas";
    canvas.width = 360;
    canvas.height = 520;
    machine.append(canvas);
    const slots = node("div", null, "vending-slots");
    owner.vendingStock.forEach((item, i) => {
      const b = button(
        ITEMS[item.type].name +
          " · " +
          item.price +
          " gold · " +
          item.qty +
          " left",
        "vend-" + i,
        () => game.purchaseVending(p, i),
      );
      b.classList.toggle("selected", u.index === i);
      b.disabled = !item.qty;
      b.title = "Buy " + ITEMS[item.type].name;
      slots.append(b);
    });
    machine.append(slots);
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
    machine.append(tray);
    const falling = node("canvas", null, "vending-falling");
    falling.width = 360;
    falling.height = 520;
    machine.append(falling);
    panel.append(
      machine,
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
      u.shop === "robot"
        ? "D-pad / arrows: select · A / Enter: sell · Y / 2: split · B / Esc: room"
        : "D-pad / arrows: select slot · A / Enter: buy · Y / 2: collect tray · B / Esc: room",
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
