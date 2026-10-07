import {npcDialogueView, npcDialogueAction} from './npc-quests.mjs';
import {controllerButtonNames} from './controls.mjs';
import {ITEMS} from './items.mjs';

const el = (tag, text = '', cls = '') => {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
};

function rewardText(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return ITEMS[value]?.name || String(value).replaceAll('_', ' ');
  if (Array.isArray(value)) return value.map(rewardText).filter(Boolean).join(' · ');
  if (value.label || value.name) return String(value.label || value.name);
  if (value.type) return `${value.qty ?? 1} × ${ITEMS[value.type]?.name || String(value.type).replaceAll('_', ' ')}`;
  return Object.entries(value).map(([key, amount]) =>
    `${rewardText(amount)} ${key.replaceAll('_', ' ')}`).join(' · ');
}

export function npcDialoguePanel(panel, g, p, button) {
  const u = p.ui, view = npcDialogueView(g, p);
  panel.npcDialogueView = view;
  const names = controllerButtonNames(p.controllerFamily || 'generic');
  const controls = panel.npcDialogueControls || (p.device === 'keyboard'
    ? {accept: 'Enter', close: 'Esc', select: 'Arrows'}
    : {accept: names[0], close: names[1], select: 'D-pad'});
  const npc = view?.npc;
  const head = panel.querySelector('header');
  if (head) head.textContent = `${p.name} · Conversation`;
  const close = panel.querySelector('[data-action="close"]');
  if (close) {
    close.setAttribute('aria-label', `End conversation · ${controls.close}`);
    close.title = `${controls.close} · End conversation`;
    close.onclick = () => { if (p.ui === u) npcDialogueAction(g, p, 'close'); };
  }
  const box = el('section', '', 'npc-dialogue');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', `Conversation with ${npc?.name || 'a friend'}`);
  const cast = el('div', '', 'npc-dialogue-cast');
  for (const [side, actor, title] of [
    ['player', p, 'Adventurer'], ['npc', npc, npc?.title || 'Friendly face'],
  ]) {
    const portrait = el('figure', '', `npc-dialogue-person npc-dialogue-${side}`);
    const canvas = el('canvas', '', 'npc-dialogue-portrait');
    canvas.width = 180; canvas.height = 132;
    canvas.dataset.portrait = side;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${actor?.name || 'Friend'} · live portrait`);
    const caption = el('figcaption');
    caption.append(el('strong', actor?.name || 'Friend'), el('small', title));
    portrait.append(canvas, caption); cast.append(portrait);
  }
  const body = el('div', '', 'npc-dialogue-body');
  const heading = el('div', '', 'npc-dialogue-heading');
  heading.append(el('h2', view?.title || 'A friendly conversation'));
  if (view?.totalStages > 1) heading.append(el('small',
    `${view.stage} / ${view.totalStages}`, 'npc-dialogue-stage'));
  body.append(heading, el('p', view?.text || 'Our friend has stepped away. You can close this conversation.', 'npc-dialogue-text'));
  if (view?.quest) {
    const quest = view.quest, card = el('section', '', 'npc-dialogue-quest');
    card.setAttribute('aria-label', 'Quest');
    card.classList.toggle('ready', !!quest.ready);
    card.append(el('strong', quest.title || 'A helping hand'));
    if (quest.description) card.append(el('p', quest.description));
    const progress = Number(quest.progress) || 0, target = Number(quest.target) || 0;
    card.append(el('small', quest.ready ? 'Ready to turn in' : `${progress} / ${target}`, 'npc-dialogue-progress-label'));
    if (target > 0) {
      const meter = el('progress'); meter.max = target; meter.value = Math.max(0, Math.min(target, progress));
      meter.setAttribute('aria-label', `${quest.title || 'Quest'} progress`); card.append(meter);
    }
    const reward = rewardText(quest.reward);
    if (reward) card.append(el('small', `Reward: ${reward}`, 'npc-dialogue-reward'));
    body.append(card);
  }
  const choices = el('nav', '', 'npc-dialogue-choices');
  choices.setAttribute('aria-label', 'Conversation choices');
  const node = u.node;
  for (const [index, choice] of (view?.choices || []).entries()) {
    const selected = index === (u.index ?? 0);
    const b = button('', `npc-choice-${index}`, () => {
      if (p.ui !== u || u.node !== node || choice.disabled) return;
      u.index = index;
      npcDialogueAction(g, p, choice.action);
    });
    b.type = 'button'; b.classList.add('npc-dialogue-choice');
    b.classList.toggle('selected', selected);
    b.dataset.index = index;
    b.disabled = !!choice.disabled;
    b.setAttribute('aria-current', String(selected));
    b.append(el('span', selected ? `${controls.accept} · Selected` : `${index + 1}`, 'npc-dialogue-choice-key'),
      el('strong', choice.label));
    if (choice.detail) b.append(el('small', choice.detail, 'npc-dialogue-choice-detail'));
    if (choice.disabled) b.append(el('small', 'Unavailable', 'npc-dialogue-choice-detail'));
    choices.append(b);
  }
  body.append(choices);
  const notice = el('p', view?.notice || u.notice || '', 'npc-dialogue-notice');
  notice.setAttribute('role', 'status'); notice.hidden = !notice.textContent;
  body.append(notice);
  box.append(cast, body, el('small', `${controls.select}: choose · ${controls.accept}: reply · ${controls.close}: leave`, 'npc-dialogue-help'));
  panel.append(box);
}

export function drawNpcDialoguePortraits(panel, g, p, animator) {
  if (p.ui?.shop !== 'npc-dialogue' || !animator) return;
  const npc = panel.npcDialogueView?.npc;
  // Wall time keeps idle breathing live even when the adventure clock pauses.
  const time = performance.now() / 1000;
  for (const canvas of panel.querySelectorAll('.npc-dialogue-portrait')) {
    const player = canvas.dataset.portrait === 'player', source = player ? p : npc;
    const c = canvas.getContext('2d');
    if (!c) continue;
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (!source) continue;
    c.save(); c.imageSmoothingEnabled = false;
    // The humanoid's origin is at its feet. Enlarge and move the legs below
    // the canvas edge, keeping the head/shoulders and equipped upper body.
    animator.draw(c, {
      ...source, sprite: 'explorer-teal', kind: 'player',
      x: canvas.width / 2, y: canvas.height + (player ? 78 : 50),
      faceX: player ? 1 : -1, faceY: 1,
      hp: Math.max(1, source.hp || 1), dead: false, moving: false,
      animationAction: 'idle', playerFrame: undefined, poseTime: undefined,
      animationProgress: undefined, rigOverride: undefined,
      attack: 0, spin: 0, charge: 0, hit: 0, flash: 0, jumpHeight: 0, groundHeight: 0,
      bowAiming: false, bowAimBlend: 0, bowVisualAngle: undefined, gatherTime: 0,
      equipment: source.equipment || {},
    }, time, player ? 264 : 168);
    c.restore();
  }
}
