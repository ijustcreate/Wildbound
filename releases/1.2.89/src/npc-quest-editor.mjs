import { getNpcQuestConfig, replaceNpcQuestConfig, validateNpcQuestConfig, NPC_QUEST_EQUIPMENT } from './npc-quest-data.mjs';
import { appearanceControls } from './appearance.mjs';

const el = (tag, text) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
};

export class NpcQuestEditor {
  constructor(items = null) { this.items = items; this.reload(); }
  reload() { this.draft = structuredClone(getNpcQuestConfig()); this.advanced = null; }
  gearFits(slot, item) {
    return !!item && (item.slot === slot || (slot === 'hand2' && item.slot === 'hand1' && !item.twoHanded));
  }
  validateItems(config) {
    if (!this.items) return;
    for (const [slot, item] of Object.entries(config.equipment))
      if (item && (!Object.hasOwn(this.items, item) || !this.gearFits(slot, this.items[item])))
        throw Error(`NPC equipment ${item} must be an existing ${slot} item.`);
    for (const stage of config.stages)
      if (!Object.hasOwn(this.items, stage.reward)) throw Error(`Unknown NPC stage reward: ${stage.reward}`);
  }
  validate() {
    if (this.advanced !== null && this.advanced !== JSON.stringify(this.draft, null, 2))
      throw Error('Apply the advanced NPC JSON before saving definitions.');
    if (!validateNpcQuestConfig(this.draft))
      throw Error('Invalid NPC draft: use six unique rewards, two branches per stage, counts 1–8, and valid dialogue links.');
    this.validateItems(this.draft);
    return true;
  }
  apply() { this.validate(); return replaceNpcQuestConfig(this.draft); }
  importConfig(config) {
    const next = Object.hasOwn(config || {}, 'npcQuests') ? config.npcQuests : config;
    if (!validateNpcQuestConfig(next)) throw Error('Invalid NPC quest JSON; the current draft was kept.');
    this.validateItems(next);
    this.draft = structuredClone(next); this.advanced = null;
  }
  mount(root) {
    this.root = root; root.replaceChildren(); root.className = 'event-builder-section';
    root.append(el('h2', 'NPC & quests'), el('p', 'Edit your NPC’s story and six quest stages. Choose one branch per stage; both branches share its reward. Save definitions to persist your draft.'));
    const status = el('p'); status.setAttribute('role', 'status'); this.status = status;
    const changed = () => {
      status.textContent = this.advanced === null ? 'Unsaved NPC draft' : 'Unsaved NPC draft · apply the pending advanced JSON before saving';
      if (this.json && this.advanced === null) this.json.value = JSON.stringify(this.draft, null, 2);
    };
    const button = (parent, label, action) => {
      const b = el('button', label); b.type = 'button';
      b.onclick = async () => { try { await action(); } catch (error) { status.textContent = error.message; } };
      parent.append(b); return b;
    };
    const field = (parent, label, object, key, options, multiline = false) => {
      const row = el('label', label), input = el(options ? 'select' : multiline ? 'textarea' : 'input');
      row.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:0;margin:10px 0';
      input.style.maxWidth = '100%';
      input.setAttribute('aria-label', label);
      if (options) for (const value of options) input.append(new Option(value || 'None', value));
      else if (typeof object[key] === 'number') { input.type = 'number'; input.min = 1; input.max = 8; input.step = 1; }
      if (multiline) { input.rows = 3; input.style.width = '100%'; }
      input.value = object[key] ?? '';
      input.onchange = () => { object[key] = typeof object[key] === 'number' ? Number(input.value) : input.value; changed(); };
      row.append(input); parent.append(row); return input;
    };
    const section = title => { const s = el('section'); s.className = 'event-builder-section'; s.append(el('h3', title)); root.append(s); return s; };
    const cfg = this.draft, identity = section('Identity & story');
    for (const key of ['name', 'title', 'backstory', 'greeting']) field(identity, key, cfg, key, null, ['backstory', 'greeting'].includes(key));
    const appearance = section('Appearance'), appearanceRoot = el('div'); appearance.append(appearanceRoot);
    appearanceControls(appearanceRoot, cfg.appearance, changed);
    field(appearance, 'Eye color', cfg.appearance, 'eyeColor');
    const gear = section('Equipment');
    for (const [slot, item] of Object.entries(NPC_QUEST_EQUIPMENT)) {
      const options = this.items ? Object.keys(this.items).filter(id => this.gearFits(slot, this.items[id])) : [item];
      field(gear, slot, cfg.equipment, slot, [...new Set(['', cfg.equipment[slot] || '', ...options])]);
    }
    cfg.stages.forEach((stage, stageIndex) => {
      const s = section(`Stage ${stageIndex + 1} · ${stage.title}`);
      field(s, 'Stage ID', stage, 'id'); field(s, 'Stage title', stage, 'title');
      field(s, 'Shared reward', stage, 'reward', [...new Set([stage.reward, ...(this.items ? Object.keys(this.items) : Object.values(NPC_QUEST_EQUIPMENT))])]);
      stage.branches.forEach((branch, branchIndex) => {
        const card = el('article'); card.className = 'event-creature-card'; card.append(el('h4', `Branch ${branchIndex + 1}`)); s.append(card);
        for (const key of ['id', 'label', 'title', 'description', 'completion']) field(card, 'Branch ' + key, branch, key, null, ['description', 'completion'].includes(key));
        const objective = branch.objective;
        const type = field(card, 'Objective type', objective, 'type', ['collect', 'defeat', 'visit']);
        type.onchange = () => {
          branch.objective = type.value === 'collect' ? { type: 'collect', item: 'stick', count: 1 }
            : type.value === 'defeat' ? { type: 'defeat', kind: 'skeleton', count: 1 } : { type: 'visit', count: 1 };
          changed(); this.mount(root);
        };
        if (objective.type === 'collect') field(card, 'Collect item', objective, 'item', ['stick', 'stone']);
        if (objective.type === 'defeat') field(card, 'Defeat creature', objective, 'kind', ['skeleton', 'bat', 'spider']);
        if (objective.type !== 'visit') field(card, 'Objective count', objective, 'count');
        else card.append(el('p', `Survey the marked waypoint away from ${cfg.name} once, then return.`));
        button(card, 'Remove branch', () => {
          if (stage.branches.length <= 2) throw Error('Keep at least two branches per stage.');
          stage.branches.splice(branchIndex, 1); changed(); this.mount(root);
        });
      });
      button(s, 'Add branch', () => {
        let n = 1; while (stage.branches.some(b => b.id === `branch-${n}`)) n++;
        stage.branches.push({ id: `branch-${n}`, label: 'New trail task', title: 'New trail task', description: 'Collect a stick for a trail marker.', objective: { type: 'collect', item: 'stick', count: 1 }, completion: 'Thank you for helping the travelers.' });
        changed(); this.mount(root);
      });
    });
    const graph = section('Dialogue graph'), nodes = cfg.dialogue.nodes;
    graph.append(el('p', 'The node “quests” is reserved: runtime replaces its content with current stage and branch selection. Nodes with no choices show Close. Link a choice to “quests” to offer tasks.'));
    field(graph, 'Starting node', cfg.dialogue, 'start', Object.keys(nodes));
    for (const [id, node] of Object.entries(nodes)) {
      const card = el('article'); card.className = 'event-creature-card'; card.append(el('h4', id)); graph.append(card);
      const rename = el('input'); rename.value = id; rename.setAttribute('aria-label', 'Node ID'); card.append(rename);
      if (id === 'quests') { rename.disabled = true; card.append(el('p', 'Reserved runtime quest selector. Text and choices below are fallback dialogue.')); }
      rename.onchange = () => {
        const next = rename.value;
        if (!/^[a-zA-Z0-9_-]{1,60}$/.test(next) || ['__proto__', 'constructor', 'prototype'].includes(next) || (next !== id && Object.hasOwn(nodes, next))) {
          rename.value = id; status.textContent = 'Use a unique safe node ID.'; return;
        }
        if (next === id) return;
        nodes[next] = node; delete nodes[id];
        if (cfg.dialogue.start === id) cfg.dialogue.start = next;
        for (const n of Object.values(nodes)) for (const c of n.choices) if (c.next === id) c.next = next;
        changed(); this.mount(root);
      };
      field(card, 'Dialogue text', node, 'text', null, true);
      node.choices.forEach((choice, i) => {
        const row = el('div'); row.className = 'event-builder-row';
        row.style.gridTemplateColumns = 'repeat(auto-fit,minmax(min(160px,100%),1fr))'; card.append(row);
        field(row, 'Choice label', choice, 'label'); field(row, 'Next node', choice, 'next', Object.keys(nodes));
        button(row, 'Remove choice', () => { node.choices.splice(i, 1); changed(); this.mount(root); });
      });
      button(card, 'Add choice', () => { node.choices.push({ label: 'Continue', next: cfg.dialogue.start }); changed(); this.mount(root); });
      button(card, 'Remove node', () => {
        if (id === 'quests') throw Error('Keep the reserved quests node for runtime stage selection.');
        if (cfg.dialogue.start === id || Object.values(nodes).some(n => n.choices.some(c => c.next === id)))
          throw Error('Change the start and incoming choices before removing this node.');
        delete nodes[id]; changed(); this.mount(root);
      });
    }
    button(graph, 'Add dialogue node', () => {
      let n = 1; while (Object.hasOwn(nodes, `node-${n}`)) n++;
      nodes[`node-${n}`] = { text: 'Safe travels, friend.', choices: [] }; changed(); this.mount(root);
    });
    const advanced = el('details'); advanced.append(el('summary', 'Advanced JSON & import/export')); root.append(advanced);
    const json = el('textarea'); json.rows = 18; json.style.width = '100%'; json.setAttribute('aria-label', 'NPC configuration JSON');
    json.value = this.advanced ?? JSON.stringify(cfg, null, 2); this.json = json;
    json.oninput = () => { this.advanced = json.value; status.textContent = 'Unapplied advanced JSON'; }; advanced.append(json);
    button(advanced, 'Apply JSON to draft', () => { this.importConfig(JSON.parse(json.value)); this.mount(root); this.status.textContent = 'Validated JSON applied to draft. Save definitions to persist.'; });
    button(advanced, 'Export NPC JSON', () => {
      this.validate(); const url = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }));
      const a = el('a'); a.href = url; a.download = 'wildbound-npc-quests.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const file = el('input'); file.type = 'file'; file.accept = '.json,application/json'; file.setAttribute('aria-label', 'Import NPC JSON');
    file.onchange = async () => {
      try {
        if (!file.files[0]) return;
        this.importConfig(JSON.parse(await file.files[0].text())); this.mount(root);
        this.status.textContent = 'Validated import applied to draft. Save definitions to persist.';
      } catch (error) { status.textContent = error.message; }
    }; advanced.append(file); root.append(status);
  }
}
export { NpcQuestEditor as NPCQuestEditor };
