import { PAD_NAMES, renderPlayerMappings, controllerButtonNames } from "./controls.mjs";
import { ITEMS, SLOTS, give, take, equip, itemStats } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
import { drawPlayer, directionVector } from "./player-motion.mjs";
import { appearanceControls, DEFAULT_APPEARANCE } from "./appearance.mjs";
import {
  SYMBOLS,
  BOONS,
  SKILLS,
  RECIPES,
  initializeField,
  protectedItem,
  allContainers,
  searchStorage,
  transferBatch,
  sortContainer,
  craft,
  applyLoadout,
  compareItem,
  choosePath,
  regroup,
} from "./field-systems.mjs";

const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
export class FieldKit {
  constructor({ game, profiles, metrics, mapping, onPause, onResume }) {
    Object.assign(this, {
      game,
      profiles,
      metrics,
      mapping,
      onPause,
      onResume,
    });
    this.marked = new Map();
    this.tab = "Craft";
    this.page = 0;
    this.filter = "All";
    this.query = "";
    this.container = 0;
    this.direction = 0;
    this.pose = "idle";
    this.dialog = node("dialog", null, "field-kit");
    this.dialog.id = "field-kit-dialog";
    document.body.append(this.dialog);
    this.dialog.oncancel = (e) => {
      e.preventDefault();
      this.close();
    };
    this.dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
      if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        !["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        this.moveFocus(e.key === "ArrowDown" ? 1 : -1);
      }
    });
    this.button = node("button", "Field Kit · G / R3", "field-open");
    this.button.onclick = () => this.open();
    document.getElementById("play").append(this.button);
    this.status = node("div", null, "field-status");
    this.status.setAttribute("aria-live", "polite");
    document.getElementById("play").append(this.status);
    this.statusObserver=new ResizeObserver(()=>{
      document.getElementById('play').style.setProperty('--event-top',(this.status.offsetTop+this.status.offsetHeight+12)+'px');
    });
    this.statusObserver.observe(this.status);
  }
  open(player) {
    if (this.dialog.open || document.querySelector("dialog[open]")) return;
    this.player = player || this.game().players[0];
    if (!this.player) return;
    initializeField(this.player);
    this.page = 0;
    this.onPause();
    this.render();
    this.dialog.showModal();
    this.dialog.querySelector("button")?.focus();
  }
  close() {
    this.dialog.close();
    this.onResume();
  }
  moveFocus(step) {
    const nodes = [
      ...this.dialog.querySelectorAll("button:not(:disabled),select,input"),
    ].filter((n) => n.getClientRects().length);
    nodes[
      (nodes.indexOf(document.activeElement) + step + nodes.length) %
        nodes.length
    ]?.focus();
  }
  action(text, fn, parent = this.body) {
    const b = node("button", text);
    b.type = "button";
    b.dataset.focus = text;
    b.onclick = async () => {
      try {
        const result = await fn();
        if (result) this.notice = result;
        if (!this.recovering && !text.toLowerCase().includes("recover"))
          this.game().persist();
      } catch (e) {
        this.notice = e.message;
      }
      this.render();
    };
    parent.append(b);
    return b;
  }
  select(label, values, value, fn, parent = this.body) {
    const l = node("label", label),
      s = node("select");
    for (const [v, t] of values) s.append(new Option(t, v));
    s.value = value;
    s.dataset.focus = label;
    s.onchange = () => {
      fn(s.value);
      this.render();
    };
    l.append(s);
    parent.append(l);
    return s;
  }
  render() {
    const focused = document.activeElement?.dataset.focus;
    const scroll = this.body?.scrollTop || 0;
    const g = this.game(),
      p = this.player,
      f = initializeField(p);
    this.dialog.replaceChildren();
    const header = node("header");
    header.append(
      node("span", "FIELD KIT", "eyebrow"),
      node("h2", p.name),
    );
    const close = node("button", "Close · B / Esc");
    close.dataset.focus = "close";
    close.onclick = () => this.close();
    header.append(close);
    this.dialog.append(header);
    const nav = node("nav");
    for (const tab of ["Craft", "Skills"]) {
      const b = node("button", tab);
      b.dataset.focus = "tab:" + tab;
      b.classList.toggle("active", tab === this.tab);
      b.onclick = () => {
        this.tab = tab;
        this.page = 0;
        this.notice = "";
        this.render();
      };
      nav.append(b);
    }
    this.dialog.append(nav);
    this.body = node("section", null, "field-body");
    this.dialog.append(this.body);
    if (this.tab === "Craft") this.crafting(g, p, f);
    if (this.tab === "Skills") this.skills(g, p, f);
    const footer = node("footer");
    const buttons = p.device === 'keyboard' ? { tab:'LB/RB', select:'A / Enter', close:'B / Esc' } : (() => {
      const names = controllerButtonNames(p.controllerFamily || 'generic');
      return { tab:`${names[4]}/${names[5]}`, select:names[0], close:names[1] };
    })();
    footer.append(
      node(
        "p",
        this.notice ||
          `${buttons.tab}: tab · D-pad: focus · left/right: choice · ${buttons.select}: select · ${buttons.close}: close`,
        "field-notice",
      ),
    );
    this.dialog.append(footer);
    this.body.scrollTop = scroll;
    if (focused)
      [...this.dialog.querySelectorAll("[data-focus]")]
        .find((b) => b.dataset.focus === focused)
        ?.focus({ preventScroll: true });
  }
  trail(g, p, f) {
    this.body.append(
      node(
        "p",
        `${g.enemies.filter((e) => e.hp > 0).length} creatures · ${g.current?.name || "First hits establish order"} · ${p.progress}/48 spaces`,
      ),
    );
    this.body.append(
      node(
        "p",
        "Rolling with creatures alive earns 2 gold. New encounters can overlap while the jungle is still dangerous.",
      ),
    );
    for(const hunter of g.enemies.filter(e=>e.kind==='hunter'&&e.night?.objective?.status==='active'))
      this.body.append(node('p',`Hunter pursuit · ${Math.ceil(120-hunter.night.objective.elapsed)}s remaining · defeat him or survive in the world · 20 gold each`,'field-card'));
    if (g.objective)
      this.body.append(
        node(
          "p",
          `${g.objective.done ? "✓ " : ""}${g.objective.name} · ${Math.floor(g.objective.progress)}/${g.objective.target} · reward: 10 gold each`,
          "field-card",
        ),
      );
    if (f.choice) {
      this.body.append(node("h3", "The board offers a path"));
      for (const [id, title] of [
        ["supplies", "Restock · a tonic"],
        ["treasure", "Challenge · another encounter + Amber charm"],
        ["curse", "Bargain · 20 gold, +15% damage taken"],
      ])
        this.action(title, () => choosePath(g, p, id));
    }
    if (f.boonReady && !f.boon) {
      this.body.append(node("h3", "Choose an expedition boon"));
      for (const b of BOONS)
        this.action(`${b.name} · ${b.detail}`, () => {
          f.boon = b.id;
          f.boonReady = false;
          return `${b.name} chosen until the next expedition.`;
        });
    }
    if (f.boon)
      this.body.append(
        node("p", `Boon: ${BOONS.find((b) => b.id === f.boon)?.name}`),
      );
    this.action("Regroup safely", () => regroup(g, p));
    this.body.append(
      node(
        "p",
        "Rescue: hold Interact near a downed friend. Hold Block + Interact while moving to drag them out of danger.",
        "subtle",
      ),
    );
    if (g.debrief) {
      this.body.append(node("h3", "Last expedition"));
      for (const entry of g.debrief)
        this.body.append(
          node(
            "p",
            `${entry.name} · ${entry.rescues || 0} rescues · ${Math.round(entry.damagePrevented || 0)} damage blocked · ${entry.trapsPlaced || 0} traps · ${entry.boldRolls || 0} bold rolls · ${entry.explored || 0} tiles explored`,
            "field-card",
          ),
        );
    }
  }
  storage(g, p, f) {
    const containers = allContainers(g, p),
      c = containers[this.container] || containers[0];
    this.body.append(
      node(
        "p",
        "Mark items, choose a destination, then Move marked here. Locks protect every copy of that item type.",
        "subtle",
      ),
    );
    this.select(
      "Container",
      containers.map((c, i) => [
        String(i),
        `${c.name} · ${c.list.filter(Boolean).length}${Number.isFinite(c.capacity) ? "/" + c.capacity : ""}`,
      ]),
      String(this.container),
      (v) => {
        this.container = +v;
        this.page = 0;
      },
    );
    this.select(
      "Category",
      ["All", "Equipment", "Supplies", "Materials", "Relics"].map((v) => [
        v,
        v,
      ]),
      this.filter,
      (v) => {
        this.filter = v;
        this.page = 0;
      },
    );
    const label = node("label", "Search all storage"),
      input = node("input");
    input.value = this.query;
    input.dataset.focus = "search";
    input.placeholder = "Name, rarity or stat";
    input.onchange = () => {
      this.query = input.value;
      this.page = 0;
      this.render();
    };
    label.append(input);
    this.body.append(label);
    const found = searchStorage(g, p, this.query, this.filter).filter(
        (r) => this.query || r.list === c.list,
      ),
      pages = Math.max(1, Math.ceil(found.length / 6));
    this.page = Math.min(this.page, pages - 1);
    const list = node("div", null, "field-items");
    for (const row of found.slice(this.page * 6, this.page * 6 + 6)) {
      const card = node("article", null, "field-item"),
        icon = node("canvas");
      icon.width = icon.height = 24;
      drawItem(icon.getContext("2d"), row.item.type, 12, 12, 24);
      card.append(
        icon,
        node(
          "strong",
          `${protectedItem(p, row.item.type) ? "◆ " : ""}${ITEMS[row.item.type].name} ×${row.item.qty}`,
        ),
        node(
          "small",
          `${row.name} · ${itemStats(row.item.type)} · ${compareItem(p, row.item.type)}`,
        ),
      );
      const markKey = row.name + ":" + row.index;
      this.action(
        this.marked.has(markKey) ? "Unmark" : "Mark",
        () => {
          if (this.marked.has(markKey)) this.marked.delete(markKey);
          else this.marked.set(markKey, row);
        },
        card,
      );
      this.action(
        protectedItem(p, row.item.type) ? "Unlock" : "Lock",
        () => {
          f.favorites = protectedItem(p, row.item.type)
            ? f.favorites.filter((t) => t !== row.item.type)
            : [...f.favorites, row.item.type];
          return "Item protection updated for this item type.";
        },
        card,
      );
      if (row.list !== p.inventory)
        this.action(
          "Take",
          () =>
            transferBatch(p, row.list, p.inventory, 24, (i) => i === row.item),
          card,
        );
      else if (this.container !== 0)
        this.action(
          "Store",
          () =>
            transferBatch(
              p,
              p.inventory,
              c.list,
              c.capacity,
              (i) => i === row.item,
            ),
          card,
        );
      list.append(card);
    }
    this.body.append(list);
    const pager = node("div", null, "field-actions");
    this.action(
      "Previous",
      () => {
        this.page = Math.max(0, this.page - 1);
      },
      pager,
    );
    pager.append(node("span", `${this.page + 1} / ${pages}`));
    this.action(
      "Next",
      () => {
        this.page = Math.min(pages - 1, this.page + 1);
      },
      pager,
    );
    this.body.append(pager);
    const actions = node("div", null, "field-actions");
    this.action(
      "Move marked here",
      () => {
        let n = 0;
        for (const row of this.marked.values()) {
          if (
            row.list !== c.list &&
            row.list.includes(row.item) &&
            !protectedItem(p, row.item.type) &&
            give(c.list, row.item.type, row.item.qty, c.capacity,row.item)
          ) {
            row.list[row.list.indexOf(row.item)] = null;
            n++;
          }
        }
        this.marked.clear();
        return `${n} marked stacks moved. Items that could not fit remain at their source.`;
      },
      actions,
    );
    this.action(
      "Sort this container",
      () => {
        sortContainer(c.list);
        return "Sorted by category and name.";
      },
      actions,
    );
    if (c.list !== p.inventory) {
      this.action(
        "Deposit matching",
        () =>
          transferBatch(p, p.inventory, c.list, c.capacity, (item) =>
            c.list.some((i) => i?.type === item.type),
          ),
        actions,
      );
      this.action(
        "Deposit category",
        () =>
          transferBatch(
            p,
            p.inventory,
            c.list,
            c.capacity,
            (item) =>
              this.filter === "All" ||
              searchStorage(g, p, "", this.filter).some((r) => r.item === item),
          ),
        actions,
      );
      this.action(
        "Take category",
        () =>
          transferBatch(
            p,
            c.list,
            p.inventory,
            24,
            (item) =>
              this.filter === "All" ||
              searchStorage(g, p, "", this.filter).some((r) => r.item === item),
          ),
        actions,
      );
    }
    this.body.append(actions);
    this.select(
      "Guest access to my chests",
      [
        ["owner", "Owner only"],
        ["deposit", "Guests may deposit"],
        ["shared", "Party may take and deposit"],
      ],
      f.access,
      (v) => {
        f.access = v;
        g.persist();
      },
    );
    this.body.append(node("h3", "Loadouts"));
    for (let i = 0; i < 3; i++) {
      const row = node("div", null, "field-actions");
      this.action(
        `Save set ${i + 1}`,
        () => {
          f.loadouts[i] = { name: `Set ${i + 1}`, gear: { ...p.equipment } };
          return "Loadout saved.";
        },
        row,
      );
      this.action(
        `Equip ${f.loadouts[i]?.name || "set " + (i + 1)}`,
        () => applyLoadout(g, p, i),
        row,
      );
      this.body.append(row);
    }
  }
  crafting(g, p, f) {
    this.select(
      "Trap mode",
      [
        ["snare", "Snare · capture"],
        ["slow", "Bramble · slow an area"],
        ["lure", "Lure · draw nearby hunters"],
        ["interrupt", "Flash · interrupt an attack"],
      ],
      f.trap,
      (v) => {
        f.trap = v;
        g.persist();
      },
    );
    this.body.append(
      node(
        "p",
        "All modes consume one snare trap. Craft supplies from harvested materials.",
      ),
    );
    for (const r of RECIPES) {
      const card = node("article", null, "field-card"),
        icon = node("canvas");
      icon.width = icon.height = 24;
      drawItem(icon.getContext("2d"), r.output, 12, 12, 24);
      card.append(
        icon,
        node("strong", `${r.name} ×${r.qty}`),
        node(
          "p",
          Object.entries(r.ingredients)
            .map(([t, n]) => `${n} ${ITEMS[t]?.name || t}`)
            .join(" + "),
        ),
      );
      this.action("Craft", () => craft(p, r.id), card);
      this.body.append(card);
    }
    this.action("Deploy barricade · lasts 30 seconds", () => {
      if (p.room || p.hp <= 0 || g.openingBoard)
        return "Deploy in an active expedition.";
      const x = p.x + p.faceX * 60,
        y = p.y + p.faceY * 60;
      if (
        g.blocked(x, y, 24) ||
        g.players.some((q) => Math.hypot(q.x - x, q.y - y) < 40)
      )
        return "Find clear ground in front of you.";
      if (!take(p.inventory, "barricade")) return "Craft a barricade first.";
      (g.barricades ||= []).push({ x, y, life: 30 });
      return "Barricade placed.";
    });
  }
  skills(g, p, f) {
    this.body.append(node("p", `Spend XP on permanent field skills. XP: ${p.xp || 0} · Next level: ${p.level || 1} · ${((p.level || 1) * 50) - (p.xp || 0)} to go.`, "field-card"));
    for (const s of SKILLS) {
      const rank = f.skills?.[s.id] || 0;
      const card = node("article", null, "field-card");
      card.append(node("h3", `${s.name} · ${rank}/${s.max}`), node("p", s.detail));
      const button = this.action(rank >= s.max ? "Mastered" : `Train · ${s.cost} XP`, () => {
        if (rank >= s.max) return "This skill is mastered.";
        if ((p.xp || 0) < s.cost) return `Need ${s.cost} XP.`;
        p.xp -= s.cost;
        f.skills[s.id] = rank + 1;
        return `${s.name} upgraded.`;
      }, card);
      button.disabled = rank >= s.max;
      this.body.append(card);
    }
    this.body.append(node("p", "More possible skills: silent movement, stronger parries, faster gathering, better lantern range, and a once-per-round emergency dodge.", "subtle"));
  }
  look(g, p, f) {
    const preview = node("canvas", null, "field-preview");
    preview.width = 300;
    preview.height = 220;
    this.body.append(preview);
    this.preview = preview;
    this.select(
      "Facing",
      Array.from({ length: 8 }, (_, i) => [
        String(i),
        [
          "South",
          "Southwest",
          "West",
          "Northwest",
          "North",
          "Northeast",
          "East",
          "Southeast",
        ][i],
      ]),
      String(this.direction),
      (v) => (this.direction = +v),
    );
    this.select(
      "Pose",
      ["idle", "run", "slash", "block"].map((v) => [v, v]),
      this.pose,
      (v) => (this.pose = v),
    );
    p.appearance ||= structuredClone(DEFAULT_APPEARANCE);
    const controls = node("div", null, "look-controls");
    appearanceControls(controls, p.appearance, () => g.persist());
    this.body.append(controls);
    this.select(
      "Party symbol",
      SYMBOLS.map((v) => [v, v]),
      f.symbol,
      (v) => {
        f.symbol = v;
        g.persist();
      },
    );
    this.select(
      "Helmet",
      [
        ["show", "Visible"],
        ["hide", "Hidden"],
      ],
      f.cosmetics.hideHelmet ? "hide" : "show",
      (v) => {
        f.cosmetics.hideHelmet = v === "hide";
        g.persist();
      },
    );
    this.select(
      "Equipment dye",
      [
        ["", "Original"],
        ["#39745b", "Jungle"],
        ["#8c5368", "Berry"],
        ["#557699", "River"],
        ["#a58b54", "Sand"],
        ["#6d5d8c", "Amethyst"],
      ],
      f.cosmetics.dye || "",
      (v) => {
        f.cosmetics.dye = v;
        g.persist();
      },
    );
    this.select(
      "Stowed weapons",
      [
        ["off", "Always in hand"],
        ["on", "Sheathe while idle"],
      ],
      f.cosmetics.stow ? "on" : "off",
      (v) => {
        f.cosmetics.stow = v === "on";
        g.persist();
      },
    );
    for (const slot of ["head", "chest", "cape"])
      this.select(
        "Cosmetic " + slot,
        [
          ["", "Use equipped appearance"],
          ...Object.entries(ITEMS)
            .filter(
              ([id, d]) =>
                d.slot === slot &&
                allContainers(g, p).some((c) =>
                  c.list.some((i) => i?.type === id),
                ),
            )
            .map(([id, d]) => [id, d.name]),
        ],
        f.cosmetics[slot] || "",
        (v) => {
          f.cosmetics[slot] = v;
          g.persist();
        },
      );
    this.action("Save appearance preset", () => {
      const presets = JSON.parse(
        localStorage.getItem("wildbound-looks") || "[]",
      );
      presets.push(structuredClone(p.appearance));
      localStorage.setItem(
        "wildbound-looks",
        JSON.stringify(presets.slice(-8)),
      );
      return "Appearance saved locally.";
    });
    const presets = JSON.parse(localStorage.getItem("wildbound-looks") || "[]");
    if (presets.length)
      this.select(
        "Saved looks",
        [
          ["", "Choose a preset"],
          ...presets.map((_, i) => [String(i), `Look ${i + 1}`]),
        ],
        "",
        (v) => {
          if (v !== "") {
            p.appearance = structuredClone(presets[+v]);
            g.persist();
          }
        },
      );
  }
  settings(g, p, f) {
    this.select(
      "Interface size",
      [
        ["1", "Standard"],
        ["1.15", "Large"],
        ["1.3", "Couch"],
      ],
      localStorage.getItem("wildbound-ui-scale") || "1",
      (v) => {
        localStorage.setItem("wildbound-ui-scale", v);
        document.documentElement.style.setProperty("--ui-scale", v);
      },
    );
    this.select(
      "Board view",
      [
        ["compact", "Compact"],
        ["expanded", "Expanded"],
      ],
      localStorage.getItem("wildbound-board-size") || "compact",
      (v) => {
        localStorage.setItem("wildbound-board-size", v);
        document.body.dataset.boardSize = v;
      },
    );
    this.select(
      "Event messages",
      [
        ["7", "Brief · 7 seconds"],
        ["12", "Comfortable · 12 seconds"],
        ["20", "Extended · 20 seconds"],
      ],
      localStorage.getItem("wildbound-event-duration") || "7",
      (v) => {
        localStorage.setItem("wildbound-event-duration", v);
        g.eventDuration = +v;
      },
    );
    this.select(
      "Performance overlay",
      [
        ["off", "Off"],
        ["on", "Frame timings"],
      ],
      this.metrics.enabled ? "on" : "off",
      (v) => (this.metrics.enabled = v === "on"),
    );
    this.body.append(
      node(
        "p",
        "Timings show mean / 95th percentile over the last 240 samples. Graphics remain pixel sharp.",
      ),
    );
    this.body.append(node("h3", "Controls"));
    const controlsByPlayer = node("div");
    renderPlayerMappings(controlsByPlayer, g, this.mapping);
    this.body.append(controlsByPlayer);
    this.action("Save now", () => {
      g.persist();
      return "Save requested.";
    });
    this.action("Export character backup", () => {
      const blob = new Blob([JSON.stringify(this.profiles.data, null, 2)], {
          type: "application/json",
        }),
        a = node("a");
      a.href = URL.createObjectURL(blob);
      a.download = "wildbound-characters.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return "Backup exported.";
    });
    const file = node("input");
    file.type = "file";
    file.accept = ".json";
    file.setAttribute("aria-label", "Import character backup");
    file.onchange = async () => {
      try {
        const data = JSON.parse(await file.files[0].text());
        if (
          data.version !== 1 ||
          !Array.isArray(data.heroes) ||
          data.heroes.length > 200
        )
          throw Error("Invalid character backup");
        for (const h of data.heroes) {
          if (
            typeof h.id !== "string" ||
            typeof h.name !== "string" ||
            h.name.length < 2 ||
            h.name.length > 20 ||
            !Array.isArray(h.inventory) ||
            !Array.isArray(h.chests) ||
            h.chests.length !== 3 ||
            !h.equipment
          )
            throw Error("Invalid character");
          for (const list of [h.inventory, ...h.chests])
            if (
              !Array.isArray(list) ||
              list.length > 24 ||
              list.some(
                (i) =>
                  i &&
                  (!ITEMS[i.type] || !Number.isInteger(i.qty) || i.qty < 1),
              )
            )
              throw Error("Invalid inventory");
        }
        let added = 0;
        for (const h of data.heroes) {
          if (!this.profiles.data.heroes.some((x) => x.id === h.id)) {
            if (
              this.profiles.data.heroes.some(
                (x) => x.name.toLowerCase() === h.name.toLowerCase(),
              )
            )
              h.name = h.name.slice(0, 12) + " " + h.id.slice(-6);
            this.profiles.data.heroes.push(h);
            added++;
          }
        }
        await this.profiles.save();
        this.notice = `Imported ${added} new characters. Existing heroes were preserved.`;
      } catch (e) {
        this.notice = e.message;
      }
      this.render();
    };
    this.body.append(file);
    if (window.desktop?.restoreBackup)
      this.action(
        this.confirmRecovery
          ? "Confirm recovery · replace current progress"
          : "Recover previous save",
        async () => {
          if (!this.confirmRecovery) {
            this.confirmRecovery = true;
            return "This replaces saved progress with the previous backup. Select Confirm recovery to continue.";
          }
          this.recovering = true;
          await window.desktop.restoreBackup();
          location.reload();
        },
      );
  }
  tick(time) {
    this.button.textContent =
      "Field Kit · G / " +
      (PAD_NAMES[this.mapping.field] || this.mapping.field);
    const g = this.game();
    if (!this.lastStatus || time - this.lastStatus > 0.12) {
      this.lastStatus = time;
      this.status.textContent = [
        g.current
          ? `${g.current.name} · roll next`
          : g.openingBoard
            ? "Strike the board to begin"
            : "First hits set turn order",
        g.objective && !g.objective.done
          ? `${g.objective.name} ${Math.floor(g.objective.progress)}/${g.objective.target}`
          : "",
        g.players.some((p) => p.field?.choice || p.field?.boonReady)
          ? "Choice available · Field Kit"
          : "",
        g.players.some(
          (q) =>
            !q.room &&
            g.players.some(
              (r) => !r.room && Math.hypot(q.x - r.x, q.y - r.y) > 650,
            ),
        )
          ? "Party spread out · regroup in Field Kit"
          : "",
        this.profiles.error || g.saveError
          ? "Save failed · open Settings to retry"
          : this.profiles.saving || g.saving
            ? "Saving…"
            : "",
        this.metrics.enabled ? this.metrics.summary() : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    if (this.dialog.open && this.tab === "Look" && this.preview?.isConnected) {
      const c = this.preview.getContext("2d");
      c.clearRect(0, 0, 300, 220);
      c.save();
      c.translate(150, 185);
      c.scale(4, 4);
      const [faceX, faceY] = directionVector(this.direction);
      drawPlayer(
        c,
        {
          ...this.player,
          faceX,
          faceY,
          animationAction: this.pose,
          moving: this.pose === "run",
          step: undefined,
          playerFrame: undefined,
          blocking: this.pose === "block",
        },
        time,
      );
      c.restore();
    }
  }
}
