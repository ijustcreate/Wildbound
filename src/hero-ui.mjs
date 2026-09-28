import {drawTempleRoom} from './temple.mjs';
import { compareItem, itemStatDelta } from "./field-systems.mjs";
import { controllerButtonNames, CONTROLLER_NAMES } from "./controls.mjs";
import { chestName } from "./items.mjs";
import { ROOM_STATIONS } from "./shops.mjs";
import { robotRig, drawRobotPortrait } from "./robot-art.mjs";
import { drawPortal } from "./portal-art.mjs";
import { shopPanel, drawVending } from "./shop-ui.mjs";
import { defaultPlayerMotion, drawPlayer } from "./player-motion.mjs";
import { ITEMS, SLOTS, count, itemStats, sellValue } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
export class HeroUI {
  constructor(root) {
    this.root = root;
    this.panels = new Map();
    this.panelAnchors = new Map();
  }
  controllerText(game, p) {
    if (p.device === 'keyboard') return { accept:'A / Enter', close:'B / Esc', select:'D-pad / arrows', tabs:'LB / RB' };
    const names = controllerButtonNames(p.controllerFamily || 'generic');
    return { accept:names[0], close:names[1], select:'D-pad', tabs:`${names[4]} / ${names[5]}` };
  }
  itemTooltip(panel, button, game, p, item) {
    const def = ITEMS[item?.type];
    if (!def) return;
    const show = () => {
      let tip = panel.querySelector('.item-tooltip');
      if (!tip) { tip = el('div', null, 'item-tooltip'); panel.append(tip); }
      tip.replaceChildren(el('strong', def.name));
      if (def.description) tip.append(el('p', def.description));
      const stats = el('div', null, 'item-tooltip-stats');
      const base = itemStats(item.type);
      if (base) stats.append(el('span', base, 'item-tooltip-base'));
      for (const delta of itemStatDelta(p, item.type)) {
        const sign = delta.value > 0 ? '+' : '';
        stats.append(el('span', `${delta.label} ${sign}${delta.value}  (${delta.current} → ${delta.next})`, delta.value > 0 ? 'stat-up' : 'stat-down'));
      }
      if (!stats.children.length) stats.append(el('span', 'No equipment stat change', 'item-tooltip-muted'));
      tip.append(stats);
      const r = button.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      const bx = r.left - pr.left, by = r.top - pr.top;
      const candidates = [
        [r.right - pr.left + 6, by],
        [bx - tip.offsetWidth - 6, by],
        [bx, by - tip.offsetHeight - 6],
        [bx, r.bottom - pr.top + 6],
      ];
      const fits = ([x, y]) => x >= 4 && y >= 4 && x + tip.offsetWidth <= pr.width - 4 && y + tip.offsetHeight <= pr.height - 4;
      const clear = ([x, y]) => x + tip.offsetWidth < bx - 2 || x > r.right - pr.left + 2 || y + tip.offsetHeight < by - 2 || y > r.bottom - pr.top + 2;
      const [x, y] = candidates.find((candidate) => fits(candidate) && clear(candidate)) || candidates.find(fits) || candidates[2];
      tip.style.left = `${Math.max(4, Math.min(pr.width - tip.offsetWidth - 4, x))}px`;
      tip.style.top = `${Math.max(4, Math.min(pr.height - tip.offsetHeight - 4, y))}px`;
      tip.hidden = false;
    };
    const hide = () => { const tip = panel.querySelector('.item-tooltip'); if (tip) tip.hidden = true; };
    button.addEventListener('pointerenter', show, { passive:true });
    button.addEventListener('pointerleave', hide, { passive:true });
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
  }
  draw(game, renderer, onlyId = null) {
    const wanted = new Set();
    const open = game.players.filter((p) => (onlyId === null || p.id === onlyId) && (p.ui || p.room));
    const bounds = this.root.getBoundingClientRect();
    const layoutKey = [bounds.width, bounds.height, ...open.map((p) => p.id)].join('|');
    let layoutChanged = layoutKey !== this.layoutKey;
    for (const p of game.players) {
      if (onlyId !== null && p.id !== onlyId) continue;
      if (!p.ui && !p.room) continue;
      wanted.add(p.id);
      let panel = this.panels.get(p.id);
      if (!panel) {
        panel = el("section", null, "hero-panel");
        this.root.append(panel);
        this.panels.set(p.id, panel);
      }
      const focus = panel.contains(document.activeElement)
        ? document.activeElement.dataset.action
        : null;
      const portal = game.portals.find((door) => door.id === p.room);
      const owner = game.players.find((q) => q.id === portal?.owner);
      const signature = [
        game.uiRevision || 0,
        p.name,
        p.level,
        p.coins,
        p.room,
        p.ui?.panel,
        p.ui?.index,
        p.ui?.storage,
        p.ui?.shop,
        p.ui?.notice,
        (p.vendingOrders || []).map((o) => o.ready).join(","),
        portal?.closing == null ? "" : Math.ceil(portal.closing),
      ].join("|");
      this.preview(panel, p, game.time);
      // Keep interactive nodes alive between pointerdown and pointerup.
      // Recreating buttons every animation frame prevents native clicks.
      if (panel.uiSignature === signature && panel.hero === p) {
        const canvas = panel.querySelector("canvas.room-view");
        if (canvas) this.room(canvas, game, p, portal, renderer);
        if (p.ui?.shop === "vending")
          drawVending(panel.querySelector(".vending-canvas"), game, p);
        drawRobotPortrait(panel.querySelector(".robot-portrait"), game.time);
        continue;
      }
      panel.uiSignature = signature;
      const selectionKey=p.ui?`${p.ui.panel}:${p.ui.index}`:'';
      panel.revealSelection=panel.selectionKey!==undefined&&panel.selectionKey!==selectionKey;
      panel.selectionKey=selectionKey;
      layoutChanged = true;
      panel.hero = p;
      panel.classList.toggle(
        "storage-session",
        !!(p.ui && p.ui.shop !== "vending"),
      );
      panel.classList.toggle("vending-panel", p.ui?.shop === "vending");
      panel.replaceChildren();
      panel.style.borderColor = p.color;
      const head = el(
        "header",
        p.name +
          " · " +
          (p.room === "temple-upper" ? "UPPER SANCTUM" : p.room ? "THE BETWEEN" : "BACKPACK") +
          " · LV " +
          p.level,
      );
      panel.append(head, el("p", (p.coins || 0) + " GOLD", "coin-balance"));
      const button = (text, action, fn) => {
        const b = el("button", text);
        b.dataset.action = action;
        b.onclick = fn;
        return b;
      };
      panel.append(
        button(
          p.ui ? "Close inventory" : p.room === "temple-upper" ? "Return downstairs" : p.room ? "Return through portal" : "Close",
          "close",
          () => {
            if (p.ui) p.ui = null;
            else if (p.room) game.leaveRoom(p);
          },
        ),
      );
      const d = game.portals.find((d) => d.id === p.room);
      if (d?.closing !== null && d?.closing !== undefined)
        panel.append(
          el(
            "strong",
            "PORTAL COLLAPSES IN " +
              Math.ceil(d.closing) +
              "s · EJECTION COSTS 50% MAX HP",
            "portal-warning",
          ),
        );
      if (p.room && !p.ui) {
        const canvas = el("canvas");
        canvas.className = "room-view";
        canvas.width = 320;
        canvas.height = 240;
        panel.append(canvas);
        this.room(canvas, game, p, d, renderer);
        if(d.temple){panel.append(el("p","Upper Sanctum · walk to the ritual chest and press Interact. The south doorway returns downstairs."),button("Open ritual chest","temple-chest",()=>game.openInventory(p,"temple")));}
        else {
        const owner = game.players.find((q) => q.id === d.owner);
        panel.append(
          el(
            "p",
            owner.name +
              "’s private storage · chests are north. Move to a chest and press Interact. P / D-pad up returns.",
          ),
        );
        for (let n = 0; n < 3; n++)
          panel.append(
            button(
              chestName(owner, n) +
                " · " +
                owner.chests[n].filter(Boolean).length +
                "/24",
              "chest" + n,
              () => game.openInventory(p, n),
            ),
          );
        panel.append(
          button("Robot · sell items", "robot", () =>
            game.openShop(p, "robot"),
          ),
          button("Vending machine · potions", "vending", () =>
            game.openShop(p, "vending"),
          ),
        );
        }
      } else if (p.ui?.shop) {
        shopPanel(panel, game, p, button);
      } else if (p.ui && !p.ui.shop) {
        this.storagePanels(panel, game, p, button);
      }
      this.preview(panel, p, game.time);
      if (focus)
        panel
          .querySelector('[data-action="' + focus + '"]')
          ?.focus({ preventScroll: true });
    }
    for (const [id, panel] of this.panels)
      if (!wanted.has(id)) {
        panel.remove();
        this.panels.delete(id);
      }
    // Content caching must not freeze a neighbour's position when a panel opens,
    // closes, changes chest mode, or the game window is resized.
    if (layoutChanged) {
      for (const p of open) this.place(this.panels.get(p.id), p, game, renderer, bounds, open);
      this.layoutKey = layoutKey;
    }
    for(const panel of this.panels.values())if(panel.revealSelection){panel.querySelector('.storage-sheet.active .selected')?.scrollIntoView({block:'nearest',inline:'nearest'});panel.revealSelection=false;}
  }
  storagePanels(panel, game, p, button) {
    const u = p.ui,
      storage = game.storageFor(p),
      layout = el("div", null, "storage-layout");
    layout.classList.toggle("has-chest", !!storage);
    const select = (mode, index) => {
      game.inventoryAction(p, "panel:" + mode);
      if (index !== undefined) game.inventoryAction(p, "select:" + index);
    };
    const act = (mode, action) => {
      if (u.panel !== mode) select(mode);
      game.inventoryAction(p, action);
    };
    const door = game.portals.find((d) => d.id === p.room),
      owner = game.players.find((q) => q.id === door?.owner);
    const title =
      u.storage === "temple" ? "Ritual chest" : u.storage === "victory"
        ? "Victory chest"
        : u.storage === "shared"
          ? "Shared table stash"
          : (owner?.name || p.name) +
            " · " +
            chestName(owner, Number(u.storage));
    for (const mode of ["gear", "pack", ...(storage ? ["chest"] : [])]) {
      const active = u.panel === mode,
        gear = mode === "gear";
      const sheet = el(
        "section",
        null,
        "storage-sheet " +
          (gear
            ? "equipment-window"
            : mode === "pack"
              ? "inventory-window"
              : "chest-window"),
      );
      sheet.classList.toggle("active", active);
      sheet.setAttribute(
        "aria-label",
        gear ? "Equipped gear" : mode === "pack" ? "Backpack" : title,
      );
      sheet.append(
        el(
          "header",
          gear ? "Paper doll" : mode === "pack" ? "Backpack" : title,
        ),
      );
      if (gear) {
        const portrait = el("canvas");
        portrait.width = 140;
        portrait.height = 180;
        portrait.className = "equipment-preview";
        sheet.append(portrait);
      }
      const controls = el("nav");
      controls.append(
        button(
          gear
            ? "Select equipment"
            : mode === "pack"
              ? "Select backpack"
              : "Select chest",
          mode,
          () => select(mode),
        ),
      );
      if (mode === "chest")
        controls.append(
          button("Close chest", "close-chest", () =>
            game.inventoryAction(p, "closeStorage"),
          ),
        );
      if (
        mode === "chest" &&
        typeof u.storage === "number" &&
        owner?.id === p.id
      ) {
        controls.append(
          button("Rename", "rename-chest", () => {
            if (sheet.querySelector(".chest-rename")) return;
            const form = el("form", null, "chest-rename"),
              label = el("label", "Chest name "),
              input = el("input");
            input.maxLength = 24;
            input.value = chestName(owner, u.storage);
            input.setAttribute("aria-label", "Chest name");
            label.append(input);
            form.append(label);
            const save = el("button", "Save");
            save.type = "submit";
            const cancel = el("button", "Cancel");
            cancel.type = "button";
            cancel.onclick = () => form.remove();
            form.append(save, cancel);
            form.onsubmit = (e) => {
              e.preventDefault();
              game.inventoryAction(p, "rename:" + input.value);
              form.remove();
            };
            form.onkeydown = (e) => e.stopPropagation();
            controls.after(form);
            input.focus();
            input.select();
          }),
        );
      }
      sheet.append(controls);
      const list = gear
        ? SLOTS.map((slot) => ({ slot, type: p.equipment[slot], qty: 1 }))
        : mode === "pack"
          ? p.inventory
          : storage;
      const index = active ? u.index : u.selections?.[mode] || 0;
      const page = mode === "chest" ? Math.floor(index / 24) : 0;
      if (mode === "chest" && list.length > 24) {
        const pages = Math.ceil(list.length / 24);
        controls.append(
          button("Previous page", "chest-prev", () =>
            select(mode, Math.max(0, page - 1) * 24),
          ),
          el("span", `${page + 1} / ${pages}`),
          button("Next page", "chest-next", () =>
            select(mode, Math.min(pages - 1, page + 1) * 24),
          ),
        );
      }
      const grid = el("div", null, "item-grid " + (gear ? "paper-doll" : ""));
      grid.dataset.container = mode;
      const dropTarget = (node, to) => {
        node.ondragover = (e) => {
          if (this.dragItem?.player === p) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            node.classList.add("drop-target");
          }
        };
        node.ondragleave = () => node.classList.remove("drop-target");
        node.ondrop = (e) => {
          e.preventDefault();
          e.stopPropagation();
          node.classList.remove("drop-target");
          const source = this.dragItem;
          this.dragItem = null;
          if (source?.player !== p) return;
          const current =
            source.from.mode === "gear"
              ? p.equipment[source.from.slot]
              : (source.from.mode === "pack"
                  ? p.inventory
                  : game.storageFor(p))?.[source.from.index];
          if (current !== source.ref) {
            u.notice = "Item changed while dragging. Try again.";
            return;
          }
          game.moveInventoryItem(p, source.from, to);
        };
      };
      if (!gear) dropTarget(grid, { mode, index: list.length });
      for (let n = page * 24; n < page * 24 + (gear ? SLOTS.length : 24); n++) {
        const item = list[n],
          def = ITEMS[item?.type];
        const action = storage
          ? "storage-" + mode + "-" + n
          : active
            ? "item" + n
            : mode + "-item" + n;
        const b = button(
          (gear ? item.slot.toUpperCase() : (item?.type === "occupied" ? "BOTH" : def ? "" : "—")) +
            (item?.qty > 1 ? " ×" + item.qty : ""),
          action,
          () => select(mode, n),
        );
        b.classList.toggle("selected", active && n === index);
        b.setAttribute('aria-label',(gear?item.slot+': ':'')+(def?.name||'Empty slot')+(item?.qty>1?' ×'+item.qty:''));
        b.style.setProperty("--item", def?.color || "#405047");
        if (gear) b.dataset.slot = item.slot;
        b.title = def
          ? def.name +
            " · " +
            itemStats(item.type) +
            " · " +
            compareItem(p, item.type) +
            (def.relic && mode === "chest"
              ? " · Stored relics give no bonuses"
              : "") +
            (gear
              ? " · Drag to backpack to unequip"
              : " · Drag onto an equipment slot")
          : "Empty slot";
        if (def) this.itemTooltip(panel, b, game, p, item);
        if (def?.slot) b.style.color = def.color;
        if (def) {
          const icon = el("canvas");
          icon.width = icon.height = 24;
          icon.className = "item-icon";
          drawItem(icon.getContext("2d"), item.type, 12, 12, 24);
          b.prepend(icon);
        }
        b.draggable = !!def || item?.type === "occupied";
        b.ondragstart = (e) => {
          this.dragItem = {
            player: p,
            from: gear ? { mode, slot: item.slot } : { mode, index: n },
            ref: gear ? item.type : list[n],
          };
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(
            "text/plain",
            def?.name || "Two-handed weapon",
          );
        };
        b.ondragend = () => {
          this.dragItem = null;
          panel
            .querySelectorAll(".drop-target")
            .forEach((e) => e.classList.remove("drop-target"));
        };
        dropTarget(b, gear ? { mode, slot: item.slot } : { mode, index: n });
        grid.append(b);
      }
      sheet.append(grid);
      const item = list[index],
        def = ITEMS[item?.type];
      sheet.append(
        el(
          "p",
          def
            ? def.name +
                " · " +
                itemStats(item.type) +
                " · " +
                compareItem(p, item.type) +
                (def.relic && mode === "chest"
                  ? " · Stored relics give no bonuses"
                  : "")
            : gear
              ? "Drag an item onto its slot."
              : "Select or drag an item.",
          "storage-detail",
        ),
      );
      const actions = el("div", null, "inventory-actions");
      const add = (label, key, action) =>
        actions.append(button(label, key, () => act(mode, action)));
      if (gear && def) add("Unequip", active ? "use" : "gear-use", "use");
      else if (mode === "pack" && def) {
        add(
          "Use / Equip",
          storage ? "storage-equip" : active ? "use" : "pack-use",
          "equip",
        );
        if (def.slot === "hand1" && !def.twoHanded)
          add("Equip hand 2", "offhand", "offhand");
        if (storage) add("Store selected →", "transfer-pack", "store");
        if (item?.qty > 1)
          add("Split stack", storage ? "split-pack" : "split", "split");
        if (item?.qty > 1) {
          const amount = el("input");
          amount.type = "number";
          amount.min = 1;
          amount.max = item.qty - 1;
          amount.value = Math.floor(item.qty / 2);
          amount.setAttribute("aria-label", "Amount to split");
          amount.style.width = "60px";
          actions.append(
            amount,
            button("Split amount", "split-amount", () =>
              act(mode, "split:" + amount.value),
            ),
          );
        }
        if (!p.room) {
          add("Drop one", "dropOne", "dropOne");
          add("Drop stack", "drop", "drop");
        }
      } else if (mode === "chest" && def) {
        add("← Take selected", "transfer-chest", "store");
        add("Split stack", "split-chest", "split");
      }
      sheet.append(actions);
      layout.append(sheet);
    }
    panel.append(
      layout,
      el(
        "p",
        u.notice || "",
        "storage-notice",
      ),
    );
    const controls = this.controllerText(game, p);
    const family = p.device === 'keyboard' ? 'Keyboard + mouse' : (p.controllerName || CONTROLLER_NAMES[p.controllerFamily] || 'Game controller');
    panel.append(el('small',`${family} · ${controls.select}: select · ${controls.tabs}: equipment / bag · ${controls.accept}: use · Y: split / offhand · X: drop / transfer · ${controls.close}: close`));
  }

  preview(panel, p, time) {
    const canvas = panel.querySelector(".equipment-preview");
    if (!canvas) return;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(canvas.width / 2, 170);
    c.scale(4.15, 4.15);
    drawPlayer(
      c,
      {
        ...p,
        faceX: 0,
        faceY: 1,
        animationAction: "idle",
        moving: false,
        playerFrame: undefined,
      },
      time,
    );
    c.restore();
  }
  place(panel, p, game, r, bounds = this.root.getBoundingClientRect(), open = game.players.filter((q) => q.ui || q.room)) {
    if(panel.classList.contains('storage-session')&&!p.ui?.shop){
      const index=Math.max(0,open.findIndex(q=>q.id===p.id)),cols=Math.min(3,open.length),rows=Math.ceil(open.length/3);
      const width=Math.min(440,(bounds.width-32)/3),height=(bounds.height-16)/rows;
      const left=cols===1?8:cols===2?(index%cols===0?8:bounds.width-width-8):(index%3)*(bounds.width/3)+8;
      panel.classList.toggle('party-panel',open.length>1);panel.style.width=width+'px';panel.style.height=height+'px';panel.style.maxHeight=height+'px';panel.style.left=left+'px';panel.style.top=8+Math.floor(index/3)*height+'px';return;
    }
    panel.style.height='';
    const compactRobot = p.ui?.shop === "robot" && bounds.height < 760,
      w = Math.min(
        panel.classList.contains("storage-session")
          ? game.storageFor(p)
            ? 1160
            : 820
          : p.room && !p.ui
            ? Math.min(
                800,
                Math.max(410, ((bounds.height - 260) * 320) / 240 + 28),
              )
            : 410,
        bounds.width - 20,
      ),
      h = Math.min(panel.scrollHeight, Math.max(240, bounds.height - 40));
    panel.classList.toggle("compact-robot-shop", compactRobot);
    panel.style.width = w + "px";
    panel.style.maxHeight = bounds.height - 30 + "px";
    if (p.ui?.shop === "vending") {
      const machine = panel.querySelector(".vending-machine");
      if (machine) {
        const chrome =
          panel.scrollHeight - machine.getBoundingClientRect().height;
        machine.style.width =
          Math.min(
            360,
            w - 32,
            (Math.max(100, bounds.height - 55 - chrome) * 360) / 520,
          ) + "px";
      }
    }
    const anchors = ["top-left", "top-right", "bottom-left", "bottom-right"];
    const positions = {
      "top-left": [12, 12],
      "top-right": [bounds.width - w - 12, 12],
      "bottom-left": [12, bounds.height - h - 12],
      "bottom-right": [bounds.width - w - 12, bounds.height - h - 12],
      center: [(bounds.width - w) / 2, (bounds.height - h) / 2],
    };
    if (!panel.dataset.anchor) {
      let anchor = this.panelAnchors.get(p.id);
      if (!anchor) {
        const index = Math.max(
          0,
          game.players.findIndex((q) => q.id === p.id),
        );
        anchor = anchors[index % anchors.length];
        this.panelAnchors.set(p.id, anchor);
      }
      panel.dataset.anchor = anchor;
    }
    if (open.length > 1) {
      const index = open.findIndex((q) => q.id === p.id),
        cols = open.length > 4 ? 3 : 2,
        rows = Math.ceil(open.length / cols),
        cellW = bounds.width / cols,
        cellH = bounds.height / rows;
      panel.classList.add("party-panel");
      panel.style.width = cellW - 12 + "px";
      panel.style.maxHeight = cellH - 16 + "px";
      panel.style.left = (index % cols) * cellW + 6 + "px";
      panel.style.top = Math.floor(index / cols) * cellH + 8 + "px";
      return;
    }
    panel.classList.remove("party-panel");
    const [x, y] = positions[panel.dataset.anchor] || positions["top-left"];
    panel.style.left = Math.max(0, Math.min(bounds.width - w, x)) + "px";
    panel.style.top = Math.max(0, Math.min(bounds.height - h, y)) + "px";
  }
  room(canvas, g, p, d, renderer) {
    const c = canvas.getContext("2d");
    if(d?.temple){drawTempleRoom(c,g,p,renderer.animator);return;}
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#100e20";
    c.fillRect(0, 0, 320, 240);
    // Fixed room coordinates show every chest, shop and exit at once.
    canvas.dataset.roomFit = "true";
    c.save();
    c.fillStyle = "#49483b";
    c.fillRect(15, 35, 290, 187);
    for (let y = 40; y < 222; y += 32)
      for (let x = 20; x < 305; x += 32) {
        c.strokeStyle = "#171c234a";
        c.strokeRect(x, y, Math.min(32, 305 - x), Math.min(32, 222 - y));
      }
    c.fillStyle = "#7b7962";
    c.fillRect(15, 25, 290, 13);
    // Peeling paint, utility pipes, shelves and a forgotten mop bucket.
    c.fillStyle = "#343a34";
    c.fillRect(18, 38, 5, 152);
    c.fillRect(18, 38, 284, 4);
    for (let i = 0; i < 38; i++) {
      c.fillStyle = i % 2 ? "#34382d" : "#66614b";
      c.fillRect(
        25 + ((i * 73) % 271),
        40 + ((i * 31) % 151),
        2 + (i % 5),
        1 + (i % 3),
      );
    }
    c.fillStyle = "#272c27";
    c.fillRect(285, 95, 17, 64);
    c.fillStyle = "#858572";
    c.fillRect(284, 98, 18, 3);
    c.fillRect(284, 125, 18, 3);
    c.fillRect(284, 152, 18, 3);
    c.fillStyle = "#b6a46b";
    c.fillRect(289, 109, 5, 15);
    c.fillStyle = "#55736b";
    c.fillRect(296, 115, 4, 9);
    c.fillStyle = "#796846";
    c.fillRect(27, 99, 3, 57);
    c.fillStyle = "#bbb29a";
    c.fillRect(23, 148, 11, 12);
    c.fillStyle = "#5c756b";
    c.fillRect(31, 153, 16, 17);
    c.strokeStyle = "#a6aaa0";
    c.strokeRect(32, 149, 14, 8);
    c.fillStyle = "#393d35";
    c.fillRect(123, 26, 74, 9);
    c.fillStyle = "#d6d4ac";
    c.fillRect(126, 28, 68, 3);
    c.fillStyle = "#363d35";
    c.fillRect(116, 161, 10, 15);
    c.fillStyle = "#7b9180";
    c.fillRect(117, 162, 8, 2);
    c.strokeStyle = "#b0b09b";
    c.strokeRect(117, 157, 8, 8);
    c.fillStyle = "#8d7954";
    c.fillRect(122, 143, 2, 21);
    c.fillStyle = "#b6ac8d";
    c.fillRect(119, 145, 8, 3);
    c.fillStyle = "#b487db";
    drawPortal(
      c,
      {
        x: 160,
        y: 214,
        closing: d.closing,
        color: g.players.find((p) => p.id === d.owner)?.color || d.color,
      },
      g.time,
      "RETURN",
    );
    [60, 160, 260].forEach((x, i) => {
      c.fillStyle = "#4e3547";
      c.fillRect(x - 19, 67, 38, 25);
      c.fillStyle = "#997c5f";
      c.fillRect(x - 19, 65, 38, 9);
      c.fillStyle = "#d4bd80";
      c.fillRect(x - 2, 72, 4, 9);
      c.font = "8px monospace";
      c.textAlign = "center";
      c.fillText(
        chestName(
          g.players.find((q) => q.id === d.owner),
          i,
        ).toUpperCase(),
        x,
        58,
        86,
      );
    });
    // SCRAP-9 uses the same humanoid pose evaluator, joint anchors and renderer.
    c.save();
    const robot = ROOM_STATIONS.robot;
    c.translate(robot.x, robot.y);
    c.scale(1.15, 1.15);
    drawPlayer(
      c,
      {
        faceX: p.roomX - robot.x,
        faceY: p.roomY - robot.y,
        equipment: {},
        animationAction: "idle",
      },
      g.time,
      robotRig,
    );
    c.restore();
    const nearRobot = Math.hypot(p.roomX - robot.x, p.roomY - robot.y) < 35;
    c.fillStyle = nearRobot ? "#f0d383" : "#bed7d6";
    c.fillRect(robot.x - 10, robot.y - 76, 20, 12);
    c.fillRect(robot.x - 3, robot.y - 64, 4, 3);
    c.fillStyle = "#20343c";
    c.font = "bold 7px monospace";
    c.textAlign = "center";
    c.fillText(
      nearRobot ? g.controlLabels?.interact || "E / Y" : "···",
      robot.x,
      robot.y - 67,
    );
    c.save();
    c.translate(0, 23);
    c.fillStyle = "#7a527f";
    c.fillRect(244, 105, 23, 36);
    c.fillStyle = "#263442";
    c.fillRect(247, 109, 13, 19);
    c.fillStyle = "#ef698b";
    c.fillRect(251, 114, 5, 9);
    c.fillStyle = "#ffdb78";
    c.fillRect(262, 114, 2, 3);
    c.fillRect(248, 132, 13, 3);
    c.font = "7px monospace";
    c.textAlign = "center";
    c.fillStyle = "#ebd9b3";
    c.fillText("SCRAP-9", robot.x, robot.y - 13);
    const nearMachine = Math.hypot(p.roomX - 255, p.roomY - 158) < 35;
    c.fillStyle = nearMachine ? "#f0d383" : "#bed7d6";
    c.fillRect(239, 82, 32, 12);
    c.fillRect(253, 94, 4, 3);
    c.fillStyle = "#20343c";
    c.font = "bold 6px monospace";
    c.fillText(
      nearMachine ? g.controlLabels?.interact || "E / Y" : "SHOP",
      255,
      90,
    );
    c.restore();
    for (const q of g.players
      .filter((q) => q.room === d.id)
      .sort((a, b) => a.roomY - b.roomY)) {
      c.fillStyle = "#091c1680";
      c.beginPath();
      c.ellipse(q.roomX, q.roomY + 1, 43 * 0.31, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = q.color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(q.roomX, q.roomY + 1, 18, 8, 0, 0, Math.PI * 2);
      c.stroke();
      renderer.animator.draw(
        c,
        {
          ...q,
          x: q.roomX,
          y: q.roomY,
          moving: !!q.roomMoving,
          step: q.roomStep || 0,
        },
        g.time,
        43,
      );
      c.fillStyle = q.color;
      c.textAlign = "center";
      c.font = "8px monospace";
      c.fillText(q.name, q.roomX, q.roomY + 12);
    }
    c.restore();
  }
}
