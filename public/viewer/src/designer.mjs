import {START_AREAS,START_AREA_LABELS,eventStartingAreas} from './starting-area.mjs';
import {NpcQuestEditor} from './npc-quest-editor.mjs';
import {MYSTERY_EVENTS} from './mysteries.mjs';
import {BoardEditor} from './board-editor.mjs';
import {ComboEditor} from './combo-editor.mjs';
import {forestSettings,saveForestSettings,TREE_TYPES,drawForestTree} from './forest.mjs';
import {ParticleEditor} from './particle-editor.mjs';
import {HouseBuilder} from './house-builder.mjs';
import { rigSubject } from "./rig-subjects.mjs";
import {
  creatures,
  rules,
  rigPreset,
  creatureDefaults,
  definitionPack,
  applyDefinitions,
  validateRig,
} from "./definitions.mjs";
import { Animator } from "./animation.mjs";
import { RigStudio } from "./player-studio.mjs";
import { saveProjectRigs } from './project-rigs.mjs';
import { ItemStudioPreview } from './item-studio-preview.mjs';
const element = (tag, text) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};
export class Designer {
  constructor(assets, events, items, onSave) {
    this.assets = assets;
    this.events = events;
    this.items = items;
    this.onSave = onSave;
    this.kind = "lion";
    this.tab = "Creature";
    this.part = 0;
    this.facing = "down";
    this.action = "walk";
    this.playing = true;
    this.time = 0;
    this.poseTime = 0;
    this.animator = new Animator(assets);
    this.playerStudio = new RigStudio(async () => {
      this.npcQuestEditor?.apply();
      localStorage.setItem(
        "wildbound-design",
        JSON.stringify(definitionPack(this.events, this.items)),
      );
      this.onSave();
      return await saveProjectRigs(this.events, this.items);
    });
    this.dialog = element("dialog");
    this.dialog.className = "designer-dialog";
    document.body.append(this.dialog);
    this.render();
  }
  open() {
    this.render();
    this.dialog.showModal();
  }
  button(parent, label, fn) {
    const b = element("button", label);
    b.type = "button";
    b.onclick = fn;
    parent.append(b);
    return b;
  }
  field(parent, label, object, key, opts = {}) {
    const row = element("label", label.replace(/([A-Z])/g, " $1")),
      v = object[key],
      input = opts.options ? element("select") : element("input");
    if (opts.options) {
      for (const val of opts.options)
        input.append(new Option(opts.optionLabels?.[val] || val || "none", val));
      input.value = v ?? "";
    } else if (typeof v === "boolean") {
      input.type = "checkbox";
      input.checked = v;
    } else {
      input.type =
        typeof v === "number"
          ? "number"
          : key.toLowerCase().includes("color")
            ? "color"
            : "text";
      input.value = v ?? "";
      if (input.type === "number") {
        input.step = opts.step || 0.1;
        input.min = opts.min ?? -100;
        input.max = opts.max ?? 1000;
      }
    }
    input.onchange = () => {
      const before = object[key];
      object[key] =
        input.type === "checkbox"
          ? input.checked
          : typeof v === "number"
            ? Math.max(
                Number(input.min),
                Math.min(Number(input.max), Number(input.value) || 0),
              )
            : input.value;
      if (opts.change && !opts.change(object[key])) {
        if (opts.validate) object[key] = before;
      }
      if (this.tab === "Creature") creatures[this.kind].edited = true;
      this.status.textContent = "Unsaved changes · preview is live";
    };
    row.append(input);
    parent.append(row);
    return input;
  }
  creatureModuleCatalog() {
    return [
      { key: "health", title: "Health", eyebrow: "Vitals", description: "Makes this unit damageable and keeps it in the world until defeated.", icon: "♡", fields: [["Hit points", "hp", 1, 1500]] },
      { key: "loot", title: "Loot", eyebrow: "Rewards", description: "Adds a loot table with multiple drops and conditional rewards.", icon: "◇", fields: [] },
      { key: "hunt", title: "Hunt", eyebrow: "Navigation", description: "Tracks nearby targets and keeps the unit engaged.", icon: "◎", fields: [["Detection radius", "detection", 0, 1500]] },
      { key:"requiredStartArea",title:"Required starting area",eyebrow:"Spawning",description:"Only starts on matching terrain. Events containing this unit require that area on the map.",icon:"◇",fields:[] },
      { key: "jump", title: "Jump", eyebrow: "Locomotion", description: "Adds a vertical leap to the unit's movement kit.", icon: "↟", fields: [["Jump impulse", "jumpImpulse", 0, 600]] },
      { key: "dash", title: "Dash", eyebrow: "Locomotion", description: "A fast directional burst with a tunable reach.", icon: "➜", fields: [["Cooldown", "dashCooldown", 0, 10], ["Distance", "dashDistance", 0, 500], ["Speed", "dashSpeed", 0, 1000]] },
      { key: "circle", title: "Circle", eyebrow: "Navigation", description: "Orbits the target to create a less predictable threat.", icon: "◌", fields: [["Attack range", "attackRange", 0, 500]] },
      { key: "melee", title: "Melee", eyebrow: "Combat", description: "Closes distance and delivers a close-range strike.", icon: "✦", fields: [["Reach", "attackRange", 0, 500], ["Windup", "windup", 0, 10], ["Recovery", "recovery", 0, 10]] },
      { key: "ranged", title: "Ranged", eyebrow: "Combat", description: "Maintains distance and fires a projectile at targets.", icon: "⌁", fields: [["Cooldown", "rangedCooldown", 0, 10], ["Range", "attackRange", 0, 500]] },
      { key: "fireball", title: "Fireball", eyebrow: "Ability", description: "Launches a damaging elemental projectile.", icon: "✹", fields: [["Cooldown", "fireCooldown", 0, 10], ["Damage", "fireDamage", 0, 500]] },
      { key: "flameBreath", title: "Flame breath", eyebrow: "Ability", description: "Projects a close cone of persistent flame.", icon: "◒", fields: [["Range", "flameRange", 0, 500], ["Damage", "fireDamage", 0, 500]] },
      { key: "banana", title: "Banana throw", eyebrow: "Ability", description: "Throws a banana projectile at the player.", icon: "⌁", fields: [["Cooldown", "bananaCooldown", 0, 10], ["Projectile speed", "bananaSpeed", 0, 800]] },
      { key: "poisonSpit", title: "Poison spit", eyebrow: "Ability", description: "Spits a projectile that applies a damage-over-time effect.", icon: "✣", fields: [["Cooldown", "spitCooldown", 0, 10], ["Projectile speed", "spitSpeed", 0, 800], ["Duration", "poisonDuration", 0, 30], ["Tick damage", "poisonDamage", 0, 100]] },
      { key: "steal", title: "Steal", eyebrow: "Utility", description: "Can take an item from the player on contact.", icon: "◇", fields: [] },
      { key: "root", title: "Root", eyebrow: "Control", description: "Pins a target in place with a rooted attack.", icon: "⌘", fields: [["Duration", "stunDuration", 0, 10]] },
      { key: "tailSwipe", title: "Tail swipe", eyebrow: "Combat", description: "A wide rear-facing sweep for nearby targets.", icon: "◜", fields: [["Reach", "attackRange", 0, 500], ["Damage", "damage", 0, 500]] },
    ];
  }
  addModule(editor, def, key) {
    def.behaviors[key] = true;
    def.edited = true;
    this.render();
  }
  removeModule(def, key) {
    def.behaviors[key] = false;
    def.edited = true;
    this.render();
  }
  creatureLootDefaults(def) {
    if (!def.lootDrops || (!def.lootDrops.length && def.dropType)) {
      def.behaviors.loot = true;
      def.lootDrops = def.dropType
        ? [{ item: def.dropType, qty: 1, chance: Math.round((def.stats.dropChance ?? 1) * 100), condition: { type: "always" } }]
        : [];
    }
    return def.lootDrops;
  }
  lootConditionFields(parent, condition) {
    condition.type ??= "always";
    this.field(parent, "Condition", condition, "type", { options: ["always", "has_item", "encountered_event", "killed_creature", "player_level"], optionLabels: { always: "Always", has_item: "Player has an item", encountered_event: "Player encountered an event", killed_creature: "Player killed a creature", player_level: "Player level" } });
    if (condition.type === "has_item") {
      condition.item ??= Object.keys(this.items)[0];
      this.field(parent, "Required item", condition, "item", { options: Object.keys(this.items) });
    } else if (condition.type === "encountered_event") {
      condition.event ??= this.events[0]?.name || "";
      this.field(parent, "Required event", condition, "event", { options: this.events.map((event) => event.name).filter(Boolean) });
    } else if (condition.type === "killed_creature") {
      condition.creature ??= this.kind;
      this.field(parent, "Required creature", condition, "creature", { options: Object.keys(creatures) });
    } else if (condition.type === "player_level") {
      this.field(parent, "Level rule", condition, "mode", { options: ["at_least", "at_most", "exactly", "between"], optionLabels: { at_least: "At least", at_most: "At most", exactly: "Exactly", between: "Between" } });
      this.field(parent, condition.mode === "between" ? "Minimum level" : "Player level", condition, "level", { min: 1, max: 99, step: 1 });
      if (condition.mode === "between") this.field(parent, "Maximum level", condition, "maxLevel", { min: 1, max: 99, step: 1 });
    }
  }
  lootEntry(parent, def, entry, index, drops) {
    entry.item ??= Object.keys(this.items)[0]; entry.qty ??= 1; entry.chance ??= 100; entry.condition ??= { type: "always" };
    const card = element("article"); card.className = "loot-entry";
    const head = element("div"); head.className = "loot-entry-head";
    head.append(element("strong", `Loot ${index + 1}`));
    this.button(head, "Remove", () => { drops.splice(index, 1); this.render(); }).className = "quiet-button";
    card.append(head);
    const fields = element("div"); fields.className = "field-grid three-up loot-fields";
    this.field(fields, "Item", entry, "item", { options: Object.keys(this.items) });
    this.field(fields, "Quantity", entry, "qty", { min: 1, max: 999, step: 1 });
    this.field(fields, "Drop chance (%)", entry, "chance", { min: 0, max: 100, step: 1 });
    card.append(fields);
    const condition = element("div"); condition.className = "loot-condition";
    const conditionTitle = element("span", "Optional condition"); conditionTitle.className = "loot-condition-title"; condition.append(conditionTitle);
    const conditionFields = element("div"); conditionFields.className = "field-grid three-up"; this.lootConditionFields(conditionFields, entry.condition); condition.append(conditionFields);
    card.append(condition); parent.append(card);
  }
  moduleCard(parent, def, module) {
    const card = element("article");
    card.className = "behavior-card";
    const top = element("div"); top.className = "behavior-card-top";
    const mark = element("span", module.icon); mark.className = "behavior-icon";
    const heading = element("div"); heading.className = "behavior-card-heading";
    const eyebrow = element("span", module.eyebrow); eyebrow.className = "eyebrow";
    heading.append(eyebrow, element("h4", module.title));
    const remove = this.button(top, "Remove", () => this.removeModule(def, module.key)); remove.className = "quiet-button";
    top.prepend(mark, heading); card.append(top);
    card.append(element("p", module.description));
    const fields = element("div"); fields.className = "module-fields";
    for (const [label, key, min, max] of module.fields) {
      if (def.stats[key] === undefined) def.stats[key] = key === "jumpImpulse" ? 125 : key === "damage" ? def.stats.damage : 0;
      this.field(fields, label, def.stats, key, { min, max, step: key.includes("Cooldown") || key.includes("Duration") || key.includes("windup") || key.includes("recovery") ? 0.1 : 1 });
    }
    if(module.key==='requiredStartArea'){def.startArea ||= 'deep_water';this.field(fields,'Starting area',def,'startArea',{options:START_AREAS,optionLabels:START_AREA_LABELS});}
    if (!module.fields.length&&module.key!=='requiredStartArea') fields.append(element("span", module.key === "loot" ? "Configure entries in the Loot table below" : "No tuning required"));
    card.append(fields); parent.append(card);
  }
  eventEnemyDefaults(event) {
    if (!event.enemies) {
      const kinds = event.squad?.length ? [...new Set(event.squad)] : [event.kind || this.kind];
      event.enemies = kinds.map((kind) => {
        const count = event.squad?.filter((entry) => entry === kind).length || event.count || 1;
        const cfg = creatures[kind], stats = event.squadStats?.[kind] || {};
        return { kind, count, manualOverride: false, hp: stats.hp || cfg?.stats?.hp || event.hp || 100, speed: stats.speed || cfg?.stats?.speed || event.speed || 50, damage: stats.damage || cfg?.stats?.damage || event.damage || 10 };
      });
    }
    for (const enemy of event.enemies) {
      const cfg = creatures[enemy.kind];
      enemy.manualOverride ??= false;
      if (!enemy.manualOverride && cfg) {
        enemy.hp = cfg.stats.hp;
        enemy.speed = cfg.stats.speed;
        enemy.damage = cfg.stats.damage;
      }
    }
    return event.enemies;
  }
  eventChainDefaults(event) {
    event.chain ??= [];
    return event.chain;
  }
  eventRewardDefaults(event) {
    event.rewards ??= [];
    return event.rewards;
  }
  shell(){
    const header=this.dialog.querySelector(':scope > header'),nav=this.dialog.querySelector(':scope > nav'),body=element('main');body.className='studio-body';body.id='studio-panel';body.setAttribute('role','tabpanel');body.setAttribute('aria-label',this.tab);
    for(const child of [...this.dialog.children])if(child!==header&&child!==nav)body.append(child);this.dialog.append(body);
    nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Editor jobs');
    const labels=['Players','Creature','Rules','Items','Events','NPC & quests','House Builder','Particles','Combos','Forest','Board'];
    [...nav.children].forEach((b,i)=>{const active=labels[i]===this.tab;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(active));b.setAttribute('aria-controls','studio-panel');b.tabIndex=active?0:-1;b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?labels.length-1:(i+(e.key==='ArrowLeft'?-1:1)+labels.length)%labels.length;this.tab=labels[next];this.render();this.dialog.querySelector('[aria-selected="true"]')?.focus();};});
  }
  render() {
    this.particleEditor?.stop();
    this.boardEditor?.stop();
    this.comboEditor?.stop();
    if (rigSubject(this.kind) && this.tab === "Rig & animation") {
      this.tab = "Players";
      this.playerStudio.setSubject(
        this.kind.startsWith("explorer") ? "player" : this.kind,
      );
    }
    if (this.kind.startsWith("explorer") && this.tab === "Rig & animation")
      this.tab = "Players";
    if (this.kind.startsWith("explorer") && this.tab === "Creature")
      this.kind = "lion";
    this.dialog.replaceChildren();
    const header = element("header");
    header.append(element("h2", "Wildbound Studio"));
    this.button(header, "Close", () => this.dialog.close());
    this.dialog.append(header);
    const nav = element("nav");
    for (const tab of [
      "Players",
      "Creature",
      "Rules",
      "Items",
      "Events",
      "NPC & quests",
      "House Builder",
      "Particles",
      "Combos",
      "Forest",
      "Board",
    ])
      this.button(
        nav,
        tab === "Players"
          ? "Rig studio"
          : tab,
        () => {
          this.tab = tab;
          this.render();
        },
      );
    this.dialog.append(nav);
    this.dialog.classList.toggle("player-designer", this.tab === "Players");
    if (this.tab === "Players") {
      const root = element("section");
      this.dialog.append(root);
      this.playerStudio.mount(root);
      this.shell();return;
    }
    if(this.tab==='Board'){this.boardEditor ||= new BoardEditor(this.events);const root=element('section');this.dialog.append(root);this.boardEditor.mount(root);this.shell();return;}
    if(this.tab==='Forest'){
      const root=element('section');root.style.padding='20px';root.append(element('h2','Procedural forest'));
      root.append(element('p','Trees use seeded trunk, branch and foliage layers. Seasons and leaf habits apply live; save to retain them on this device.'));
      this.field(root,'Season',forestSettings,'season',{options:['auto','summer','autumn','winter'],change:()=>{this.render();return true;}});
      for(const type of TREE_TYPES)this.field(root,type+' leaf habit',forestSettings,type,{options:['deciduous','evergreen'],change:()=>{this.render();return true;}});
      this.button(root,'Save forest settings',()=>{saveForestSettings();});
      const canvas=element('canvas');canvas.width=900;canvas.height=300;canvas.style.width='100%';canvas.style.maxWidth='900px';const c=canvas.getContext('2d');c.fillStyle='#344c40';c.fillRect(0,0,900,300);
      for(let i=0;i<9;i++)drawForestTree(c,{kind:'tree',treeType:TREE_TYPES[Math.floor(i/3)],x:50+i*100,y:190,size:110,procedural:true},0,{});
      root.append(canvas);this.dialog.append(root);this.shell();return;
    }
    if(this.tab==='Combos'){this.comboEditor ||= new ComboEditor();const root=element('section');this.dialog.append(root);this.comboEditor.mount(root);this.shell();return;}
    if(this.tab==='Particles'){this.particleEditor ||= new ParticleEditor();const root=element('section');this.dialog.append(root);this.particleEditor.mount(root);this.shell();return;}
    if(this.tab==='House Builder'){this.houseBuilder ||= new HouseBuilder();const root=element('section');this.dialog.append(root);this.houseBuilder.mount(root);this.shell();return;}
    this.status = element(
      "p",
      "Changes preview live. Save to keep them between sessions.",
    );
    this.status.setAttribute("role", "status");
    const controls = element("div");
    controls.className = "studio-controls";
    if (this.tab !== 'NPC & quests') this.dialog.append(controls);
    if (this.tab === 'NPC & quests') {
      this.npcQuestEditor ||= new NpcQuestEditor(this.items);
      const root = element('section'); this.dialog.append(root); this.npcQuestEditor.mount(root);
    } else if (["Creature", "Rig & animation"].includes(this.tab)) {
      this.field(controls, "Creature", this, "kind", {
        options: Object.keys(creatures).filter(
          (n) => !n.startsWith("explorer"),
        ),
        change: () => {
          this.part = 0;
          this.render();
          return true;
        },
      });
      this.button(controls, "Duplicate creature", () => {
        const name = this.dialog
          .querySelector("#new-creature-name")
          .value.trim()
          .replace(/[^a-zA-Z0-9_-]/g, "-");
        if (!name || creatures[name]) {
          this.status.textContent = "Choose a new unique name.";
          return;
        }
        creatures[name] = structuredClone(creatures[this.kind]);
        creatures[name].name = name;
        this.kind = name;
        this.render();
      });
      const name = element("input");
      name.id = "new-creature-name";
      name.placeholder = "new-creature-name";
      controls.append(name);
      const layout = element("div");
      layout.className = "studio-layout";
      const preview = element("section");
      this.canvas = element("canvas");
      this.canvas.width = 240;
      this.canvas.height = 240;
      preview.append(this.canvas);
      this.field(preview, "Facing", this, "facing", {
        options: ["down", "up", "left", "right"],
      });
      this.field(preview, "Preview action", this, "action", {
        options: ["idle", "walk", "attack", "hurt"],
      });
      this.button(
        preview,
        "Play / pause",
        () => (this.playing = !this.playing),
      );
      preview.append(
        element(
          "p",
          "Artwork comes from Sprite Workshop. Create or crop a head, torso, limb, foot, wing, stem or tail tip, then assign it to a part.",
        ),
      );
      const editor = element("section");
      editor.className = "studio-fields";
      layout.append(preview, editor);
      this.dialog.append(layout);
      const def = creatures[this.kind];
      if (rigSubject(this.kind))
        this.button(preview, "Edit in Rig studio", () => {
          this.playerStudio.setSubject(this.kind);
          this.tab = "Players";
          this.render();
        });
      if (this.tab === "Creature") {
        const catalog = this.creatureModuleCatalog();
        const active = catalog.filter((module) => def.behaviors[module.key]);
        const identity = element("section"); identity.className = "editor-section identity-section";
        const sectionTitle = element("div"); sectionTitle.className = "section-heading";
        sectionTitle.append(element("div", "UNIT DEFINITION"), element("span", "Core identity"));
        identity.append(sectionTitle);
        const identityGrid = element("div"); identityGrid.className = "field-grid two-up";
        this.field(identityGrid, "Faction", def, "faction", { options: ["enemy", "ally", "neutral"] });
        this.field(identityGrid, "Behavior family", def, "aiKind", { options: ["lion", "panther", "crocodile", "boar", "snake", "bat", "wasp", "vine", "golem", "monkey", "skeleton", "archer", "rhino"] });
        identity.append(identityGrid); editor.append(identity);

        const core = element("section"); core.className = "editor-section";
        const coreTitle = element("div"); coreTitle.className = "section-heading";
        const canMove = ["hunt", "dash", "circle", "jump"].some((key) => def.behaviors[key]);
        const canAttack = ["melee", "ranged", "fireball", "flameBreath", "banana", "poisonSpit", "tailSwipe"].some((key) => def.behaviors[key]);
        const baseFields = ["speed", "damage"].filter((key) => key === "speed" ? canMove : canAttack);
        coreTitle.append(element("div", "BASE ATTRIBUTES"), element("span", "Shown when required")); core.append(coreTitle);
        const coreGrid = element("div"); coreGrid.className = "field-grid three-up";
        if (!baseFields.length) { const empty = element("span", "No base attributes needed. Configure a capability below."); empty.className = "empty-modules"; coreGrid.append(empty); }
        for (const k of baseFields) this.field(coreGrid, k, def.stats, k, { min: 0, max: 1500 });
        core.append(coreGrid); editor.append(core);

        const modules = element("section"); modules.className = "editor-section modules-section";
        const moduleHead = element("div"); moduleHead.className = "modules-heading";
        const moduleCopy = element("div"); moduleCopy.append(element("div", "CAPABILITIES"), element("p", "Build this unit from focused behavior modules. Each module owns its configuration."));
        const addRow = element("div"); addRow.className = "module-add-row";
        const addSelect = element("select"); addSelect.className = "module-picker";
        catalog.filter((module) => !def.behaviors[module.key]).forEach((module) => addSelect.append(new Option(`${module.eyebrow}  /  ${module.title}`, module.key)));
        const addButton = this.button(addRow, "+  Add module", () => { if (addSelect.value) this.addModule(editor, def, addSelect.value); }); addButton.className = "add-module-button";
        addRow.prepend(addSelect); moduleHead.append(moduleCopy, addRow); modules.append(moduleHead);
        const activeBar = element("div"); activeBar.className = "active-modules";
        activeBar.append(element("span", `${active.length} active`));
        active.forEach((module) => { const chip = element("span", module.title); chip.className = "module-chip"; activeBar.append(chip); });
        modules.append(activeBar);
        const cards = element("div"); cards.className = "behavior-cards";
        active.forEach((module) => this.moduleCard(cards, def, module));
        if (!active.length) { const empty = element("div", "No behavior modules attached. Add a capability to start building this unit."); empty.className = "empty-modules"; cards.append(empty); }
        modules.append(cards); editor.append(modules);

        const audio = element("section"); audio.className = "editor-section compact-section audio-section";
        const audioTitle = element("div"); audioTitle.className = "section-heading";
        const audioCopy = element("div"); audioCopy.append(element("div", "UNIT REACTIONS"), element("p", "Choose which sound plays when this unit attacks, takes damage, or is defeated."));
        audioTitle.append(audioCopy, element("span", "Sound library")); audio.append(audioTitle);
        def.sounds ||= { attack: "attack", hurt: "hurt", defeat: "defeat" };
        const audioGrid = element("div"); audioGrid.className = "field-grid three-up";
        for (const [k, label] of [["attack", "When this unit attacks"], ["hurt", "When this unit takes damage"], ["defeat", "When this unit is defeated"]])
          this.field(audioGrid, label, def.sounds, k, {
            options: ["", "attack", "hurt", "defeat", "heal", "event", "trap", "dodge", "win", "lose"],
          });
        audio.append(audioGrid); editor.append(audio);
        if (def.behaviors.loot) {
          const drops = this.creatureLootDefaults(def);
          const loot = element("section"); loot.className = "editor-section loot-section";
          const lootTitle = element("div"); lootTitle.className = "section-heading";
          const lootCopy = element("div"); lootCopy.append(element("div", "LOOT TABLE"), element("p", "Add multiple drops. Each entry can have its own chance and unlock condition."));
          lootTitle.append(lootCopy, element("span", `${drops.length} ${drops.length === 1 ? "entry" : "entries"}`)); loot.append(lootTitle);
          const lootEntries = element("div"); lootEntries.className = "loot-entries";
          drops.forEach((entry, i) => this.lootEntry(lootEntries, def, entry, i, drops));
          if (!drops.length) { const empty = element("div", "No special loot configured for this unit. Add an entry below."); empty.className = "empty-modules"; lootEntries.append(empty); }
          loot.append(lootEntries);
          this.button(loot, "+  Add loot entry", () => { drops.push({ item: Object.keys(this.items)[0], qty: 1, chance: 100, condition: { type: "always" } }); this.render(); }).className = "add-module-button";
          editor.append(loot);
        }
      } else {
        this.field(editor, "Renderer", def.rig, "mode", {
          options: ["rig", "legacy", "frames"],
        });
        const preset = element("select");
        for (const n of ["quadruped", "humanoid", "serpent", "winged", "plant"])
          preset.append(new Option(n, n));
        preset.value = def.rig.type;
        editor.append(preset);
        this.button(editor, "Apply rig preset", () => {
          def.rig = rigPreset(preset.value);
          this.part = 0;
          this.render();
        });
        for (const k of [
          "stride",
          "rate",
          "bob",
          "tailThickness",
          "tailLength",
          "tailSegments",
          "tailTaper",
          "tailSwing",
          "tailTip",
        ])
          this.field(editor, k, def.rig, k, {
            min: 0,
            max: k === "tailTaper" ? 1 : 64,
          });
        const select = element("select");
        def.rig.parts.forEach((p, i) =>
          select.append(new Option(p.name, String(i))),
        );
        select.value = this.part;
        select.onchange = () => {
          this.part = Number(select.value);
          this.render();
        };
        editor.append(element("h3", "Parts & attachment points"), select);
        this.button(editor, "Add part", () => {
          const p = structuredClone(rigPreset("humanoid").parts[0]);
          p.name = "part" + Date.now().toString(36).slice(-5);
          p.parent = "";
          p.motion = "none";
          def.rig.parts.push(p);
          this.part = def.rig.parts.length - 1;
          this.render();
        });
        this.button(editor, "Remove part", () => {
          const p = def.rig.parts[this.part];
          if (p) {
            for (const child of def.rig.parts)
              if (child.parent === p.name) child.parent = p.parent;
            def.rig.parts.splice(this.part, 1);
            this.part = 0;
            this.render();
          }
        });
        const p = def.rig.parts[this.part];
        if (p) {
          this.field(editor, "Part name", p, "name", { change: () => true });
          this.field(editor, "Parent joint", p, "parent", {
            options: [
              "",
              ...def.rig.parts.filter((q) => q !== p).map((q) => q.name),
            ],
            validate: true,
            change: () => validateRig(def.rig),
          });
          this.field(editor, "Motion", p, "motion", {
            options: ["none", "legL", "legR", "armL", "armR", "wingL", "wingR"],
          });
          const facing = element("input");
          facing.type = "checkbox";
          facing.checked = !!this.editFacing;
          const l = element("label", "Edit only " + this.facing + " facing");
          l.append(facing);
          editor.append(l);
          facing.onchange = () => {
            this.editFacing = facing.checked;
            this.render();
          };
          let target = p;
          if (this.editFacing) {
            p.views ??= {};
            p.views[this.facing] ??= {
              x: p.x,
              y: p.y,
              w: p.w,
              h: p.h,
              angle: p.angle,
              pivotX: p.pivotX,
              pivotY: p.pivotY,
              source: p.source,
              rect: [...p.rect],
              color: p.color,
            };
            target = p.views[this.facing];
          }
          this.field(editor, "Artwork sprite", target, "source", {
            options: ["", ...Object.keys(this.assets.library)],
          });
          for (const k of [
            "x",
            "y",
            "w",
            "h",
            "angle",
            "pivotX",
            "pivotY",
            "color",
          ])
            this.field(editor, k, target, k, {
              min: ["w", "h"].includes(k)
                ? 1
                : ["pivotX", "pivotY"].includes(k)
                  ? 0
                  : -64,
              max: ["pivotX", "pivotY"].includes(k) ? 1 : 128,
            });
          const crop = element("div");
          crop.className = "part-crop";
          for (let n = 0; n < 4; n++)
            this.field(
              crop,
              ["crop X", "crop Y", "crop W", "crop H"][n],
              target.rect,
              n,
              { min: n > 1 ? 1 : 0, max: 128, step: 1 },
            );
          editor.append(crop);
          this.sourceCanvas = element("canvas");
          this.sourceCanvas.width = this.sourceCanvas.height = 160;
          editor.append(this.sourceCanvas);
          this.sourceTarget = target;
          this.sourceCanvas.onpointerdown = (e) => {
            if (!target.source) return;
            const source = this.assets.canvas(target.source),
              box = this.sourceCanvas.getBoundingClientRect();
            this.cropStart = {
              x: Math.floor(
                ((e.clientX - box.left) / box.width) * source.width,
              ),
              y: Math.floor(
                ((e.clientY - box.top) / box.height) * source.height,
              ),
            };
            this.sourceCanvas.setPointerCapture(e.pointerId);
          };
          this.sourceCanvas.onpointerup = (e) => {
            if (!this.cropStart) return;
            const source = this.assets.canvas(target.source),
              box = this.sourceCanvas.getBoundingClientRect(),
              x = Math.max(
                0,
                Math.min(
                  source.width,
                  Math.round(
                    ((e.clientX - box.left) / box.width) * source.width,
                  ),
                ),
              ),
              y = Math.max(
                0,
                Math.min(
                  source.height,
                  Math.round(
                    ((e.clientY - box.top) / box.height) * source.height,
                  ),
                ),
              );
            target.rect = [
              Math.min(x, this.cropStart.x),
              Math.min(y, this.cropStart.y),
              Math.max(1, Math.abs(x - this.cropStart.x)),
              Math.max(1, Math.abs(y - this.cropStart.y)),
            ];
            this.cropStart = null;
            this.render();
          };
          editor.append(element("h3", "Animation keys · " + this.action));
          def.rig.clips ??= {};
          def.rig.clips[this.action] ??= { duration: 1, keys: [] };
          const clip = def.rig.clips[this.action];
          this.field(editor, "Duration (seconds)", clip, "duration", {
            min: 0.1,
            max: 10,
          });
          const slider = element("input");
          slider.type = "range";
          slider.min = 0;
          slider.max = 1;
          slider.step = 0.01;
          slider.value = this.poseTime;
          slider.oninput = () => {
            this.poseTime = Number(slider.value);
            this.playing = false;
          };
          editor.append(slider);
          const keyFields = element("div");
          this.keyPose ??= { x: 0, y: 0, angle: 0 };
          for (const k of ["x", "y", "angle"])
            this.field(keyFields, "Pose " + k, this.keyPose, k, {
              min: -64,
              max: 64,
            });
          editor.append(keyFields);
          this.button(editor, "Set key for selected part", () => {
            let key = clip.keys.find(
              (k) => Math.abs(k.t - this.poseTime) < 0.005,
            );
            if (!key) {
              key = { t: this.poseTime, parts: {} };
              clip.keys.push(key);
              clip.keys.sort((a, b) => a.t - b.t);
            }
            key.parts[p.name] = { ...this.keyPose };
            this.render();
          });
          for (const key of clip.keys)
            this.button(
              editor,
              Math.round(key.t * 100) +
                "% · " +
                Object.keys(key.parts).join(", "),
              () => {
                this.poseTime = key.t;
                this.keyPose = {
                  ...(key.parts[p.name] || { x: 0, y: 0, angle: 0 }),
                };
                this.playing = false;
                this.render();
              },
            );
          this.button(editor, "Delete key at cursor", () => {
            clip.keys = clip.keys.filter(
              (k) => Math.abs(k.t - this.poseTime) > 0.005,
            );
            this.render();
          });
        }
      }
    } else if (this.tab === "Rules") {
      const fields = element("div");
      fields.className = "studio-fields";
      for (const k of Object.keys(rules))
        this.field(fields, k, rules, k, {
          min: 0.01,
          max: k === "portalDamage" ? 1 : 2000,
        });
      this.dialog.append(fields);
    } else if (this.tab === "Items") {
      this.item ??= "sword";
      this.field(controls, "Item", this, "item", {
        options: Object.keys(this.items),
        change: () => {
          this.render();
          return true;
        },
      });
      const item = this.items[this.item],
        fields = element("div");
      fields.className = "studio-fields";
      this.field(controls, "Item name", item, "name");
      for (const k of ["description", "color", "artColor"])
        this.field(fields, k, item, k);
      for (const k of ["damage", "armor", "stack", "punch", "magnet","maxHp","maxMana"]) {
        item[k] ??= 0;
        this.field(fields, k, item, k, { min: 0, max: 999 });
      }
      item.slot ??= "";
      item.sockets??=0;this.field(fields,'Trinket sockets (0 = none)',item,'sockets',{min:0,max:3,step:1});
      this.field(fields, "Equipment slot", item, "slot", {
        options: [
          "",
          "head",
          "neck",
          "cape",
          "shoulders",
          "chest",
          "gloves",
          "pants",
          "feet",
          "hand1",
          "hand2",
        ],
      });
      if (["hand1", "hand2"].includes(item.slot) || item.twoHanded) {
        const placement = item.twoHanded ? "both" : item.slot;
        const hand = element("label", "Hand placement");
        const select = element("select");
        [["hand1", "Right hand"], ["hand2", "Left hand"], ["both", "Both hands"]].forEach(([value, label]) => select.append(new Option(label, value)));
        select.value = placement;
        select.onchange = () => { item.twoHanded = select.value === "both"; item.slot = select.value === "both" ? "hand1" : select.value; this.status.textContent = "Unsaved changes · preview is live"; this.render(); };
        hand.append(select); fields.append(hand);
      }
      for (const k of ["light", "twoHanded", "rootResist"]) {
        item[k] ??= false;
        this.field(fields, k, item, k);
      }
      this.dialog.append(fields);
      const previews=element('section');
      this.itemPreview=new ItemStudioPreview(previews,this.item,this.items,(id,direction,mode)=>{
        this.tab='Players';this.playerStudio.setSubject('player');this.playerStudio.previewEquipment={[this.items[id].slot]:id};this.playerStudio.gearSlot=this.items[id].slot;this.playerStudio.direction=direction;this.render();
        this.playerStudio.$('.ps-inspector').classList.add('show-equipment');
        if (mode === 'art') { const details = this.playerStudio.$('.ps-fit details'); if (details) details.open = true; }
      });
      fields.before(previews);fields.classList.add('item-studio-fields');
    } else {
      this.eventIndex ??= 0;
      const select = element("select");
      this.events.forEach((e, i) =>
        select.append(new Option(e.name, String(i))),
      );
      select.value = this.eventIndex;
      select.onchange = () => {
        this.eventIndex = Number(select.value);
        this.render();
      };
      controls.append(select);
      this.button(controls,'Add two-stage mystery',()=>{this.events.push(structuredClone({...MYSTERY_EVENTS[0],name:'New mystery'}));this.eventIndex=this.events.length-1;this.render();});
      this.button(controls, "Add event", () => {
        this.events.push({
          ...this.events[0],
          name: "New encounter",
          kind: this.kind,
        });
        this.eventIndex = this.events.length - 1;
        this.render();
      });
      this.button(controls, "Delete event", () => {
        if (this.events.length <= 1) { this.status.textContent = "Keep at least one event definition."; return; }
        this.events.splice(this.eventIndex, 1);
        this.eventIndex = Math.max(0, this.eventIndex - 1);
        this.render();
      });
      const fields = element("div");
      fields.className = "studio-fields";
      const event = this.events[this.eventIndex];
      event.requiredStartArea ||= 'any';
      this.field(fields,'Required map area',event,'requiredStartArea',{options:START_AREAS,optionLabels:START_AREA_LABELS});
      const required=eventStartingAreas(event);fields.append(element('p','Unit requirements are always enforced: '+(required.map(a=>START_AREA_LABELS[a]).join(', ')||'none')+'. Events are excluded when a required area is missing.'));
      event.type ??= "encounter";
      event.weight ??= 10;
      event.duration ??= 45;
      event.spread ??= 0.45;
      event.intensity ??= 1;
      this.field(fields, "Event type", event, "type", {
        options: ["encounter", "mystery", "monsoon", "blizzard", "sandstorm", "thunderstorm", "merchant", "volcano", "stampede"],
        change:()=>{this.render();return true;},
      });
      for (const k of ["weight", "duration", "spread", "intensity"])
        this.field(fields, k, event, k, { min: 0, max: 1000 });
      for (const k of ["name", "verse", "tip"]) this.field(fields, k, event, k);
      if(event.type==='mystery'){
        const m=event.mystery??=structuredClone(MYSTERY_EVENTS[0].mystery);
        const section=element('section');section.className='event-builder-section';section.append(element('h3','Two-stage mystery'),element('p','Stage 1 spawns a target at a safe point near these map coordinates. Stage 2 creates an investigation object near the game board. Rewards only unlock after investigation.'));
        this.field(section,'First objective',m,'goal',{options:['defeat','recover']});
        this.field(section,'Target creature',m,'enemy',{options:Object.keys(creatures)});
        this.field(section,'Clue item appearance',m,'item',{options:Object.keys(this.items)});
        for(const key of ['targetName','location','stageOne','stageTwo','finalName'])this.field(section,key,m,key);
        for(const key of ['x','y'])this.field(section,key,m,key,{min:64,max:1536,step:16});
        m.finalOffsetX??=0;m.finalOffsetY??=120;m.finalItem??='';
        for(const key of ['finalOffsetX','finalOffsetY'])this.field(section,key,m,key,{min:-180,max:180,step:16});
        this.field(section,'Final object appearance',m,'finalItem',{options:['',...Object.keys(this.items)]});
        this.field(section,'Target count',m,'count',{min:1,max:20,step:1});
        for(const key of ['hp','speed','damage'])this.field(section,key,m,key,{min:1,max:1500});
        this.field(section,'Completion reward',m,'reward',{options:Object.keys(this.items)});
        this.field(section,'Reward quantity',m,'qty',{min:1,max:99,step:1});
        this.dialog.append(section);
      }
      this.field(fields, "Creature", event, "kind", {
        options: Object.keys(creatures),
      });
      for (const k of ["count", "hp", "speed", "damage"])
        this.field(fields, k, event, k, {
          min: k === "count" ? 1 : 0,
          max: k === "count" ? 20 : 1000,
        });
      const enemies = this.eventEnemyDefaults(event);
      const enemyPanel = element("section");
      enemyPanel.className = "event-builder-section";
      enemyPanel.append(element("h3", "Event creatures"), element("p", "Add units to this encounter. Each card starts with the selected creature's current config; enable manual overrides only for event-specific values."));
      enemies.forEach((enemy, i) => {
        const card = element("article"); card.className = "event-creature-card";
        const head = element("div"); head.className = "event-creature-head";
        const cfg = creatures[enemy.kind] || creatures.lion;
        const title = element("strong", `Group ${i + 1} · ${cfg.name || enemy.kind}`); head.append(title);
        this.button(head, "Delete", () => { enemies.splice(i, 1); this.render(); }).className = "quiet-button";
        card.append(head);
        const picker = element("div"); picker.className = "event-creature-picker";
        this.field(picker, "Unit", enemy, "kind", { options: Object.keys(creatures), change: (value) => { const next = creatures[value]; if (!enemy.manualOverride && next) { enemy.hp = next.stats.hp; enemy.speed = next.stats.speed; enemy.damage = next.stats.damage; } this.render(); return true; } });
        this.field(picker, "Count", enemy, "count", { min: 1, max: 100, step: 1 }); card.append(picker);
        const summary = element("div", `HP ${enemy.hp}  ·  Speed ${enemy.speed}  ·  Damage ${enemy.damage}`); summary.className = "event-creature-summary"; card.append(summary);
        const overrides = element("details"); overrides.open = !!enemy.manualOverride;
        overrides.append(element("summary", "Manual overrides for this event"));
        const overrideGrid = element("div"); overrideGrid.className = "field-grid three-up event-override-grid";
        this.field(overrideGrid, "Use overrides", enemy, "manualOverride");
        for (const k of ["hp", "speed", "damage"]) this.field(overrideGrid, k, enemy, k, { min: 0, max: 1000 });
        overrides.append(overrideGrid); card.append(overrides); enemyPanel.append(card);
      });
      this.button(enemyPanel, "+  Add creature", () => { const kind = this.kind in creatures ? this.kind : "lion", cfg = creatures[kind]; enemies.push({ kind, count: 1, manualOverride: false, hp: cfg.stats.hp, speed: cfg.stats.speed, damage: cfg.stats.damage }); this.render(); }).className = "add-module-button";
      this.dialog.append(enemyPanel);

      const chain = this.eventChainDefaults(event);
      const chainPanel = element("section");
      chainPanel.className = "event-builder-section";
      chainPanel.append(element("h3", "Event actions"), element("p", "Add simple reactions that run when the encounter begins, after a timer, or after the last creature is defeated."));
      chain.forEach((step, i) => {
        const row = element("div"); row.className = "event-builder-row";
        step.trigger ??= "start"; step.action ??= "message";
        this.field(row, "When", step, "trigger", { options: ["start", "delay", "cleared"], optionLabels: { start: "When the event begins", delay: "After a timer", cleared: "When all creatures are defeated" }, change: () => { this.render(); return true; } });
        this.field(row, "Do", step, "action", { options: ["message", "reward"], optionLabels: { message: "Show a message", reward: "Give loot" }, change: () => { this.render(); return true; } });
        if (step.action === "message") this.field(row, "Message", step, "message");
        else { step.item ??= Object.keys(this.items)[0]; step.qty ??= 1; this.field(row, "Loot", step, "item", { options: Object.keys(this.items) }); this.field(row, "Quantity", step, "qty", { min: 1, max: 999 }); }
        if (step.trigger === "delay") { step.delay ??= 3; this.field(row, "Seconds", step, "delay", { min: 0, max: 300 }); }
        const help = element("span", step.trigger === "start" ? "Runs immediately when this encounter starts." : step.trigger === "delay" ? "Runs after the timer reaches the number of seconds." : "Runs once after every creature in this encounter is defeated."); help.className = "event-action-help"; row.append(help);
        this.button(row, "Delete action", () => { chain.splice(i, 1); this.render(); });
        chainPanel.append(row);
      });
      this.button(chainPanel, "Add chained action", () => { chain.push({ trigger: "start", action: "message", message: "" }); this.render(); });
      this.dialog.append(chainPanel);

      const rewards = this.eventRewardDefaults(event);
      const rewardPanel = element("section");
      rewardPanel.className = "event-builder-section";
      rewardPanel.append(element("h3", "Clear rewards"), element("p", "Guaranteed special loot dropped when every enemy in the event is defeated."));
      rewards.forEach((reward, i) => {
        const row = element("div"); row.className = "event-builder-row";
        reward.item ??= Object.keys(this.items)[0]; reward.qty ??= 1;
        this.field(row, "Loot", reward, "item", { options: Object.keys(this.items) });
        this.field(row, "Quantity", reward, "qty", { min: 1, max: 999 });
        this.button(row, "Delete reward", () => { rewards.splice(i, 1); this.render(); });
        rewardPanel.append(row);
      });
      this.button(rewardPanel, "Add special loot", () => { rewards.push({ item: Object.keys(this.items)[0], qty: 1 }); this.render(); });
      this.dialog.append(rewardPanel);
      this.dialog.append(fields);
    }
    const footer = element("footer");
    this.button(footer, "Save definitions", async () => {
      try {
        for (const c of Object.values(creatures))
          if (!validateRig(c.rig))
            throw Error("Invalid parent chain or part geometry: " + c.name);
        this.npcQuestEditor?.apply();
        localStorage.setItem(
          "wildbound-design",
          JSON.stringify(definitionPack(this.events, this.items)),
        );
        this.onSave();
        await saveProjectRigs(this.events, this.items);
        this.status.textContent =
          this.tab === 'NPC & quests'
            ? 'Saved NPC & quest definitions. New conversations use these settings.'
            : "Saved. Existing creatures refreshed; new events use these settings.";
      } catch (e) {
        this.status.textContent = e.message;
      }
    });
    this.button(footer, "Export definitions", () => {
      try {
      this.npcQuestEditor?.apply();
      const url = URL.createObjectURL(
          new Blob(
            [JSON.stringify(definitionPack(this.events, this.items), null, 2)],
            { type: "application/json" },
          ),
        ),
        a = element("a");
      a.href = url;
      a.download = "wildbound-definitions.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { this.status.textContent = error.message; }
    });
    const input = element("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      try {
        if (!e.target.files[0]) return;
        const pack = JSON.parse(await e.target.files[0].text());
        applyDefinitions(
          pack,
          this.events,
          this.items,
        );
        if (Object.hasOwn(pack, 'npcQuests')) this.npcQuestEditor?.reload();
        this.render();
        this.status.textContent = "Imported. Preview, then Save definitions.";
      } catch (e) {
        this.status.textContent = e.message;
      }
    };
    footer.append(input);
    this.dialog.append(footer, this.status);this.shell();
  }
  animate(dt) {
    if(this.dialog.open&&this.tab==='Items'){this.itemPreview?.animate(dt);return;}
    if (this.dialog.open && this.tab === "Players") {
      this.playerStudio.animate(dt);
      return;
    }
    if (!this.dialog.open || !this.canvas || !this.canvas.isConnected) return;
    if (this.playing) this.time += dt;
    const c = this.canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#253b32";
    c.fillRect(0, 0, 240, 240);
    for (let n = 0; n < 240; n += 20) {
      c.strokeStyle = "#61776033";
      c.strokeRect(n, 0, 20, 240);
      c.strokeRect(0, n, 240, 20);
    }
    const face = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[
        this.facing
      ],
      rig = creatures[this.kind].rig,
      t = this.playing
        ? this.time
        : this.poseTime * (rig.clips?.[this.action]?.duration || 1);
    this.animator.draw(
      c,
      {
        kind: this.kind,
        x: 120,
        y: 118,
        moving: this.action === "walk",
        step: t * rig.rate,
        faceX: face[0],
        faceY: face[1],
        attack: this.action === "attack" ? 0.34 - (t % 0.34) : 0,
        animationAction: this.action,
        rigOverride: rig,
        poseTime: this.playing ? undefined : this.poseTime,
      },
      t,
      this.kind === "dragon" ? 80 : 110,
    );
    if (this.sourceCanvas?.isConnected) {
      const x = this.sourceCanvas.getContext("2d"),
        p = this.sourceTarget,
        source = p.source && this.assets.canvas(p.source);
      x.imageSmoothingEnabled = false;
      x.fillStyle = "#263c32";
      x.fillRect(0, 0, 160, 160);
      if (source) {
        x.drawImage(source, 0, 0, 160, 160);
        x.strokeStyle = "#ffcf75";
        x.lineWidth = 2;
        const [sx, sy, sw, sh] = p.rect;
        x.strokeRect(
          (sx / source.width) * 160,
          (sy / source.height) * 160,
          (sw / source.width) * 160,
          (sh / source.height) * 160,
        );
      }
    }
  }
}
